import { fetchRawPositions } from "./positions";
import { computePositionsSweph } from "./positions-sweph";
import type { NatalChart, PlanetPosition, TransitInfo } from "./types";
import { getOpenRouterClient, MODELS } from "@/lib/ai/client";
import { buildChartDigest } from "@/lib/astrology/chart";

let CACHE: { date: string; info: TransitInfo | null } | null = null;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function cleanAndParseJson<T>(content: string): T {
  const startIdx = content.indexOf("{");
  const endIdx = content.lastIndexOf("}");

  let jsonStr = content;
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    jsonStr = content.substring(startIdx, endIdx + 1);
  } else {
    jsonStr = content.replace(/```json\n?|\n?```/g, "").trim();
  }

  return JSON.parse(jsonStr) as T;
}

export async function getDailyTransits(): Promise<TransitInfo | null> {
  const key = todayKey();
  if (CACHE && CACHE.date === key) return CACHE.info;

  const now = new Date();
  const dob = now.toISOString().slice(0, 10);
  const hh = String(now.getUTCHours()).padStart(2, "0");
  const mm = String(now.getUTCMinutes()).padStart(2, "0");

  const raw = await fetchRawPositions({
    dob,
    birthTime: `${hh}:${mm}`,
    latitude: 51.4779,
    longitude: 0,
    timezone: 0,
  });

  if (!raw) {
    CACHE = { date: key, info: null };
    return null;
  }

  const info: TransitInfo = {
    date: key,
    planets: raw.planets,
    notable: {},
  };

  CACHE = { date: key, info };
  return info;
}

export function enrichTransitsForChart(
  transits: TransitInfo,
  chart: NatalChart,
): TransitInfo {
  const ascSign = chart.ascendant.sign;
  const natalMoon = chart.planets.find((p) => p.name === "Moon");

  const housedPlanets: PlanetPosition[] = transits.planets.map((p) => {
    const house = ((p.sign - ascSign + 12) % 12) + 1;
    return { ...p, house };
  });

  const enriched: TransitInfo = {
    ...transits,
    planets: housedPlanets,
    notable: { ...transits.notable },
  };

  if (natalMoon) {
    const transitSaturn = housedPlanets.find((p) => p.name === "Saturn");
    if (transitSaturn) {
      const fromMoon = ((transitSaturn.sign - natalMoon.sign + 12) % 12) + 1;
      if (fromMoon === 12) {
        enriched.notable.sadeSati = {
          phase: "rising",
          description:
            "Saturn transiting the 12th sign from natal Moon — early phase of Sade Sati. Expenses rise, sleep disturbances, foreign or distant matters become prominent.",
        };
      } else if (fromMoon === 1) {
        enriched.notable.sadeSati = {
          phase: "peak",
          description:
            "Saturn transiting over natal Moon — peak phase of Sade Sati. Emotional weight, health considerations, and karmic lessons predominate.",
        };
      } else if (fromMoon === 2) {
        enriched.notable.sadeSati = {
          phase: "setting",
          description:
            "Saturn transiting the 2nd sign from natal Moon — closing phase of Sade Sati. Family and financial matters demand attention.",
        };
      } else {
        enriched.notable.sadeSati = null;
      }
    }
  }

  const transitJupiter = housedPlanets.find((p) => p.name === "Jupiter");
  if (transitJupiter) {
    enriched.notable.jupiterTransitHouse = transitJupiter.house;
  }

  const tRahu = housedPlanets.find((p) => p.name === "Rahu");
  const tKetu = housedPlanets.find((p) => p.name === "Ketu");
  if (tRahu && tKetu) {
    enriched.notable.rahuKetuTransit = {
      rahuHouse: tRahu.house,
      ketuHouse: tKetu.house,
    };
  }

  const natalSaturn = chart.planets.find((p) => p.name === "Saturn");
  const tSaturn = housedPlanets.find((p) => p.name === "Saturn");
  if (natalSaturn && tSaturn && natalSaturn.sign === tSaturn.sign) {
    enriched.notable.saturnReturn = true;
  }

  return enriched;
}

export interface MonthlyPrediction {
  month: string;
  date: string;
  transits: TransitInfo;
  description: string;
}

export async function getFutureTransits(
  chart: NatalChart,
  monthsAhead: number = 6,
  lang: "en" | "hi" = "en",
): Promise<MonthlyPrediction[]> {
  const predictions: MonthlyPrediction[] = [];
  const now = new Date();

  for (let i = 1; i <= monthsAhead; i++) {
    const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 15);
    const dob = futureDate.toISOString().slice(0, 10);

    const raw = await computePositionsSweph({
      dob,
      birthTime: "12:00",
      latitude: 0,
      longitude: 0,
      timezone: 0,
    });

    if (!raw) continue;

    const baseTransit: TransitInfo = {
      date: dob,
      planets: raw.planets,
      notable: {},
    };

    const enriched = enrichTransitsForChart(baseTransit, chart);

    const jupHouse = enriched.notable.jupiterTransitHouse;
    const suffix =
      jupHouse === 1
        ? "st"
        : jupHouse === 2
          ? "nd"
          : jupHouse === 3
            ? "rd"
            : "th";
    const saturnDesc = enriched.notable.sadeSati
      ? ` ${enriched.notable.sadeSati.phase} phase of Sade Sati.`
      : "";

    let desc =
      lang === "hi"
        ? `इस महीने के दौरान, मुख्य गोचर आपकी कुंडली को प्रभावित कर रहे हैं।`
        : `During this month, major transits influence your chart.`;

    if (jupHouse) {
      desc +=
        lang === "hi"
          ? ` बृहस्पति आपके ${jupHouse}वें भाव में गोचर कर रहा है, जिससे इस क्षेत्र में उन्नति होगी।`
          : ` Jupiter transits your ${jupHouse}${suffix} house, bringing expansion and blessings to this area.`;
    }
    if (enriched.notable.rahuKetuTransit) {
      desc +=
        lang === "hi"
          ? ` राहु आपके ${enriched.notable.rahuKetuTransit.rahuHouse}वें भाव से गोचर कर रहा है।`
          : ` Rahu moves through your ${enriched.notable.rahuKetuTransit.rahuHouse}th house, creating sudden desires or foreign connections.`;
    }
    if (saturnDesc) {
      desc += saturnDesc;
    }

    predictions.push({
      month: futureDate.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-US", {
        month: "long",
        year: "numeric",
      }),
      date: dob,
      transits: enriched,
      description: desc,
    });
  }

  const client = getOpenRouterClient();
  if (!client) {
    console.warn(
      "⚠️ AI Predictions skipped: OpenRouter Client is not configured.",
    );
    return predictions;
  }

  try {
    const digest = buildChartDigest(chart, null);
    const transitSummary = predictions.map((p) => ({
      month: p.month,
      jupiterHouse: p.transits.notable.jupiterTransitHouse,
      rahuHouse: p.transits.notable.rahuKetuTransit?.rahuHouse,
      ketuHouse: p.transits.notable.rahuKetuTransit?.ketuHouse,
      sadeSatiPhase: p.transits.notable.sadeSati?.phase || "none",
      planets: p.transits.planets.map(
        (pl) => `${pl.name} in House ${pl.house} (Sign ${pl.sign})`,
      ),
    }));

    const systemPrompt = `You are an expert Vedic Astrologer creating a highly specific monthly prediction segment for a Kundali PDF report.
Analyze the seeker's natal chart details and the transit snapshots for the next ${monthsAhead} months. Generate a completely unique, highly descriptive, and predictive forecast paragraph for each month.

CRITICAL VEDIC RULES:
- Frame your readings around how transiting planets cross over natal houses (measured from the Lagna/Ascendant).
- Ensure every month's forecast is entirely distinct. Do NOT repeat text blocks or sentence structures across multiple months.
- Look closely at fast-moving transits (Sun, Mercury, Mars, Venus) across houses to highlight different themes for each month.
- Write in ${lang === "hi" ? "pure Hindi (Devanagari script)" : "English"}.
- Output ONLY a valid JSON object with a single key "descriptions" containing an array of strings in chronological order:
{
  "descriptions": [
    "Dynamic predictive paragraph for month 1...",
    "Dynamic predictive paragraph for month 2...",
    ...
  ]
}`;

    const res = await client.chat.completions.create({
      model: MODELS.REASONING,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: JSON.stringify(
            {
              natalChart: {
                identity: digest.identity,
                yogas: digest.yogas,
                doshas: digest.doshas,
              },
              transits: transitSummary,
            },
            null,
            2,
          ),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 2000,
    });

    const raw = res.choices[0]?.message?.content || "";
    const parsed = cleanAndParseJson<{ descriptions?: string[] }>(raw);

    if (
      parsed.descriptions &&
      Array.isArray(parsed.descriptions) &&
      parsed.descriptions.length === predictions.length
    ) {
      for (let i = 0; i < predictions.length; i++) {
        if (parsed.descriptions[i]) {
          predictions[i].description = parsed.descriptions[i].trim();
        }
      }
    }
  } catch (e) {
    console.error(
      "❌ Failed to parse or generate AI future predictions batch:",
      e,
    );
  }

  return predictions;
}
