import OpenAI from "openai";
import { getDb } from "@/lib/mongodb";

// ── Helpers ──────────────────────────────────────────────────────────

const ALL_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

/** Returns today's date string in IST (Asia/Kolkata) as "YYYY-MM-DD" */
function getTodayIST(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function getOpenAIClient() {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterKey) return null;
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: openRouterKey,
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      "X-Title": "Celestial Astrology",
    },
  });
}

// ── Types ────────────────────────────────────────────────────────────

interface DailyHoroscopeEntry {
  name: string;
  description: string;
}

interface DetailedHoroscope {
  general: string;
  career: string;
  love: string;
  health: string;
  luckyColor: string;
  luckyNumber: string;
}

// ── AI Generation ───────────────────────────────────────────────────

async function generateDailyHoroscopes(): Promise<DailyHoroscopeEntry[] | null> {
  const openai = getOpenAIClient();
  if (!openai) return null;

  const prompt = `You are an expert Vedic astrologer (Jyotishi). Generate today's daily rashi phal (horoscope) for all 12 rashis based on current graha gochar (planetary transits) using Sidereal/Vedic principles.

IMPORTANT: Base your readings on Vedic Jyotish concepts — Rashi lords, current graha transits (gochar), nakshatras, and dasha influences. Do NOT use Western sun-sign personality clichés like "Aries are natural leaders" or element-based descriptions.

Return ONLY a valid JSON array where each item has this exact structure:
[
  {
    "name": "Aries",
    "description": "Today's Vedic rashi phal here... (around 2 sentences, referencing graha influences)"
  },
  ...
]
Do not include any markdown formatting blocks like \`\`\`json. Just return the raw JSON array string. Ensure all 12 signs are included exactly as: Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces.`;

  const response = await openai.chat.completions.create({
    model: "deepseek/deepseek-chat",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content || "[]";
  const jsonStr = content.replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(jsonStr) as DailyHoroscopeEntry[];
}

async function generateAllDetailedHoroscopes(): Promise<Record<string, DetailedHoroscope> | null> {
  const openai = getOpenAIClient();
  if (!openai) return null;

  const prompt = `You are an expert Vedic astrologer. Generate highly detailed daily horoscopes for ALL 12 zodiac signs for today.

Return ONLY a valid JSON object where each key is the sign name (lowercase) and the value has this structure:
{
  "aries": {
    "general": "A general overview of the day (3-4 sentences).",
    "career": "Insights regarding career, work, and finances.",
    "love": "Insights regarding love, relationships, and family.",
    "health": "Insights regarding health and well-being.",
    "luckyColor": "A specific lucky color",
    "luckyNumber": "A single lucky number"
  },
  "taurus": { ... },
  ...
}

Include all 12 signs: aries, taurus, gemini, cancer, leo, virgo, libra, scorpio, sagittarius, capricorn, aquarius, pisces.
Do not include any markdown formatting blocks. Return ONLY the raw JSON object.`;

  const response = await openai.chat.completions.create({
    model: "deepseek/deepseek-chat",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content || "{}";
  const jsonStr = content.replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(jsonStr) as Record<string, DetailedHoroscope>;
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Get daily horoscopes for all 12 signs.
 * Checks MongoDB for today's cached data first.
 * If not found, generates BOTH daily + detailed horoscopes from AI,
 * saves everything to DB, then returns the daily summaries.
 */
export async function getDailyHoroscopes(): Promise<DailyHoroscopeEntry[] | null> {
  const today = getTodayIST();

  try {
    const db = await getDb();
    const dailyCol = db.collection("daily_horoscopes");

    // Check if we already have today's data
    const cached = await dailyCol.findOne({ date: today });
    if (cached && cached.horoscopes) {
      return cached.horoscopes as DailyHoroscopeEntry[];
    }

    // ── First request of the day: generate everything ──

    // 1. Generate daily summaries
    const horoscopes = await generateDailyHoroscopes();
    if (!horoscopes) return null;

    // Save daily summaries
    await dailyCol.updateOne(
      { date: today },
      {
        $set: {
          date: today,
          horoscopes,
          generatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    // 2. Pre-generate all detailed horoscopes in the background
    //    (don't block the response — fire and forget)
    generateAndCacheAllDetailed(today).catch((e) =>
      console.error("Background detailed horoscope generation failed:", e)
    );

    return horoscopes;
  } catch (error) {
    console.error("Daily Horoscope Error:", error);
    try {
      return await generateDailyHoroscopes();
    } catch {
      return null;
    }
  }
}

/**
 * Pre-generates detailed horoscopes for all 12 signs and saves them to DB.
 * Called once per day when daily horoscopes are first generated.
 */
async function generateAndCacheAllDetailed(today: string): Promise<void> {
  const db = await getDb();
  const detailCol = db.collection("detailed_horoscopes");

  // Check if any detailed data already exists for today (avoid duplicate work)
  const existingCount = await detailCol.countDocuments({ date: today });
  if (existingCount >= 12) return;

  const allDetailed = await generateAllDetailedHoroscopes();
  if (!allDetailed) return;

  // Bulk-write all 12 signs
  const ops = ALL_SIGNS.map((sign) => {
    const key = sign.toLowerCase();
    const data = allDetailed[key];
    if (!data) return null;
    return {
      updateOne: {
        filter: { date: today, sign: key },
        update: {
          $set: {
            date: today,
            sign: key,
            data,
            generatedAt: new Date(),
          },
        },
        upsert: true,
      },
    };
  }).filter(Boolean);

  if (ops.length > 0) {
    await detailCol.bulkWrite(ops as any[]);
  }
}

/**
 * Get detailed horoscope for a specific sign.
 * Reads from MongoDB (pre-generated by getDailyHoroscopes).
 * Falls back to on-demand AI generation if not yet cached.
 */
export async function getDetailedHoroscope(sign: string): Promise<DetailedHoroscope | null> {
  const today = getTodayIST();
  const normalizedSign = sign.toLowerCase();

  try {
    const db = await getDb();
    const collection = db.collection("detailed_horoscopes");

    // Check if we already have today's data for this sign
    const cached = await collection.findOne({ date: today, sign: normalizedSign });
    if (cached && cached.data) {
      return cached.data as DetailedHoroscope;
    }

    // Fallback: generate just this sign on-demand (rare — only if background job hasn't finished)
    const openai = getOpenAIClient();
    if (!openai) return null;

    const prompt = `You are an expert Vedic astrologer. Generate a highly detailed, personalized daily horoscope for the zodiac sign ${sign} for today.
Provide the reading in a structured JSON format with the following keys:
{
  "general": "A general overview of the day (3-4 sentences).",
  "career": "Insights regarding career, work, and finances.",
  "love": "Insights regarding love, relationships, and family.",
  "health": "Insights regarding health and well-being.",
  "luckyColor": "A specific lucky color",
  "luckyNumber": "A single lucky number"
}
Return ONLY the raw JSON object string without any markdown formatting.`;

    const response = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const jsonStr = content.replace(/```json\n?|\n?```/g, "").trim();
    const data = JSON.parse(jsonStr) as DetailedHoroscope;

    // Save to DB
    await collection.updateOne(
      { date: today, sign: normalizedSign },
      {
        $set: {
          date: today,
          sign: normalizedSign,
          data,
          generatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return data;
  } catch (error) {
    console.error(`Detailed Horoscope Error for ${sign}:`, error);
    return null;
  }
}
