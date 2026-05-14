import { fetchRawPositions } from "./positions";
import { computePositionsSweph } from "./positions-sweph";
import type { NatalChart, PlanetPosition, TransitInfo } from "./types";

let CACHE: { date: string; info: TransitInfo | null } | null = null;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

/** Compute today's planetary positions (geocentric, neutral location). Cached per-day in process. */
export async function getDailyTransits(): Promise<TransitInfo | null> {
  const key = todayKey();
  if (CACHE && CACHE.date === key) return CACHE.info;

  const now = new Date();
  const dob = now.toISOString().slice(0, 10);
  const hh = String(now.getUTCHours()).padStart(2, "0");
  const mm = String(now.getUTCMinutes()).padStart(2, "0");

  // Use a neutral reference location (Greenwich) — house positions don't matter for pure transit positions
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

/**
 * Enrich transit info with chart-specific context (Sade Sati, Jupiter transit house, etc.).
 * Houses are computed relative to natal ascendant.
 */
export function enrichTransitsForChart(transits: TransitInfo, chart: NatalChart): TransitInfo {
  const ascSign = chart.ascendant.sign;
  const natalMoon = chart.planets.find(p => p.name === "Moon");

  const housedPlanets: PlanetPosition[] = transits.planets.map(p => {
    const house = ((p.sign - ascSign + 12) % 12) + 1;
    return { ...p, house };
  });

  const enriched: TransitInfo = {
    ...transits,
    planets: housedPlanets,
    notable: { ...transits.notable },
  };

  // Sade Sati — Saturn transiting 12th, 1st, or 2nd house from natal Moon
  if (natalMoon) {
    const transitSaturn = housedPlanets.find(p => p.name === "Saturn");
    if (transitSaturn) {
      const fromMoon = ((transitSaturn.sign - natalMoon.sign + 12) % 12) + 1;
      if (fromMoon === 12) {
        enriched.notable.sadeSati = {
          phase: "rising",
          description: "Saturn transiting the 12th sign from natal Moon — early phase of Sade Sati. Expenses rise, sleep disturbances, foreign or distant matters become prominent. Begin spiritual discipline now to ease the coming phase.",
        };
      } else if (fromMoon === 1) {
        enriched.notable.sadeSati = {
          phase: "peak",
          description: "Saturn transiting over natal Moon — peak phase of Sade Sati. Emotional weight, health considerations, and karmic lessons predominate. Steady effort, simple living, and Shani remedies bring relief.",
        };
      } else if (fromMoon === 2) {
        enriched.notable.sadeSati = {
          phase: "setting",
          description: "Saturn transiting the 2nd sign from natal Moon — closing phase of Sade Sati. Family and financial matters demand attention but maturity gained from previous phases bears fruit.",
        };
      } else {
        enriched.notable.sadeSati = null;
      }
    }
  }

  // Jupiter transit house from ascendant
  const transitJupiter = housedPlanets.find(p => p.name === "Jupiter");
  if (transitJupiter) {
    enriched.notable.jupiterTransitHouse = transitJupiter.house;
  }

  // Rahu/Ketu transit
  const tRahu = housedPlanets.find(p => p.name === "Rahu");
  const tKetu = housedPlanets.find(p => p.name === "Ketu");
  if (tRahu && tKetu) {
    enriched.notable.rahuKetuTransit = {
      rahuHouse: tRahu.house,
      ketuHouse: tKetu.house,
    };
  }

  // Saturn return — transit Saturn in natal Saturn's sign
  const natalSaturn = chart.planets.find(p => p.name === "Saturn");
  const tSaturn = housedPlanets.find(p => p.name === "Saturn");
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

export async function getFutureTransits(chart: NatalChart, monthsAhead: number = 6): Promise<MonthlyPrediction[]> {
  const predictions: MonthlyPrediction[] = [];
  const now = new Date();

  for (let i = 1; i <= monthsAhead; i++) {
    const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 15); // Mid-month evaluation
    const dob = futureDate.toISOString().slice(0, 10);
    
    // Use sweph directly for faster offline compute for future dates
    let raw = await computePositionsSweph({
      dob,
      birthTime: "12:00", // Midday
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
    
    // Generate description based on key slow movers
    const jupHouse = enriched.notable.jupiterTransitHouse;
    const saturnDesc = enriched.notable.sadeSati ? ` ${enriched.notable.sadeSati.phase} phase of Sade Sati.` : "";
    let desc = `During this month, major transits influence your chart.`;
    if (jupHouse) {
      desc += ` Jupiter transits your ${jupHouse}th house, bringing expansion and blessings to this area.`;
    }
    if (enriched.notable.rahuKetuTransit) {
      desc += ` Rahu moves through your ${enriched.notable.rahuKetuTransit.rahuHouse}th house, creating sudden desires or foreign connections.`;
    }
    if (saturnDesc) {
      desc += saturnDesc;
    }

    predictions.push({
      month: futureDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      date: dob,
      transits: enriched,
      description: desc
    });
  }

  return predictions;
}
