import OpenAI from "openai";
import { getDb } from "@/lib/mongodb";

// ── Helpers ──────────────────────────────────────────────────────────

const ALL_SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
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
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      "X-Title": "Celestial Astrology",
    },
  });
}

/** Robust JSON parser that strips conversational text around JSON content */
function cleanAndParseJson<T>(content: string, type: "array" | "object"): T {
  const startChar = type === "array" ? "[" : "{";
  const endChar = type === "array" ? "]" : "}";

  const startIdx = content.indexOf(startChar);
  const endIdx = content.lastIndexOf(endChar);

  let jsonStr = content;
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    jsonStr = content.substring(startIdx, endIdx + 1);
  } else {
    jsonStr = content.replace(/```json\n?|\n?```/g, "").trim();
  }

  return JSON.parse(jsonStr) as T;
}

// ── In-memory cache (avoids DB roundtrip on every request) ──────────

let memCacheDaily: { date: string; data: DailyHoroscopeEntry[] } | null = null;
const memCacheDetailed = new Map<
  string,
  { date: string; data: DetailedHoroscope }
>();

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

async function generateDailyHoroscopes(): Promise<
  DailyHoroscopeEntry[] | null
> {
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
  return cleanAndParseJson<DailyHoroscopeEntry[]>(content, "array");
}

async function generateAllDetailedHoroscopes(): Promise<Record<
  string,
  DetailedHoroscope
> | null> {
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
  return cleanAndParseJson<Record<string, DetailedHoroscope>>(
    content,
    "object",
  );
}

// ── Public API ──────────────────────────────────────────────────────

export async function getDailyHoroscopes(): Promise<
  DailyHoroscopeEntry[] | null
> {
  const today = getTodayIST();

  if (memCacheDaily && memCacheDaily.date === today) {
    return memCacheDaily.data;
  }

  try {
    const db = await getDb();
    const dailyCol = db.collection("daily_horoscopes");

    const cached = await dailyCol.findOne({ date: today });
    if (cached && cached.horoscopes) {
      const data = cached.horoscopes as DailyHoroscopeEntry[];
      memCacheDaily = { date: today, data };
      return data;
    }

    const horoscopes = await generateDailyHoroscopes();
    if (!horoscopes) return null;

    await dailyCol.updateOne(
      { date: today },
      { $set: { date: today, horoscopes, generatedAt: new Date() } },
      { upsert: true },
    );
    memCacheDaily = { date: today, data: horoscopes };

    generateAndCacheAllDetailed(today).catch((e) =>
      console.error("Background detailed horoscope generation failed:", e),
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

async function generateAndCacheAllDetailed(today: string): Promise<void> {
  const db = await getDb();
  const detailCol = db.collection("detailed_horoscopes");

  const existingCount = await detailCol.countDocuments({ date: today });
  if (existingCount >= 12) return;

  const allDetailed = await generateAllDetailedHoroscopes();
  if (!allDetailed) return;

  const ops = ALL_SIGNS.map((sign) => {
    const key = sign.toLowerCase();
    const data = allDetailed[key];
    if (!data) return null;
    return {
      updateOne: {
        filter: { date: today, sign: key },
        update: {
          $set: { date: today, sign: key, data, generatedAt: new Date() },
        },
        upsert: true,
      },
    };
  }).filter(Boolean);

  if (ops.length > 0) {
    await detailCol.bulkWrite(ops as any[]);
    for (const sign of ALL_SIGNS) {
      const key = sign.toLowerCase();
      if (allDetailed[key]) {
        memCacheDetailed.set(key, { date: today, data: allDetailed[key] });
      }
    }
  }
}

export async function getDetailedHoroscope(
  sign: string,
): Promise<DetailedHoroscope | null> {
  const today = getTodayIST();
  const normalizedSign = sign.toLowerCase();

  const memEntry = memCacheDetailed.get(normalizedSign);
  if (memEntry && memEntry.date === today) {
    return memEntry.data;
  }

  try {
    const db = await getDb();
    const collection = db.collection("detailed_horoscopes");

    const cached = await collection.findOne({
      date: today,
      sign: normalizedSign,
    });
    if (cached && cached.data) {
      const data = cached.data as DetailedHoroscope;
      memCacheDetailed.set(normalizedSign, { date: today, data });
      return data;
    }

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
    const data = cleanAndParseJson<DetailedHoroscope>(content, "object");

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
      { upsert: true },
    );
    memCacheDetailed.set(normalizedSign, { date: today, data });

    return data;
  } catch (error) {
    console.error(`Detailed Horoscope Error for ${sign}:`, error);
    return null;
  }
}
