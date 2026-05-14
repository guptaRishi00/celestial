import {
  AYANAMSHA_MAP,
  HOUSE_MEANINGS,
  NAKSHATRAS,
  SIGNS,
  SIGNS_VEDIC,
  SIGN_LORD,
  TOPIC_HOUSES,
  TOPIC_PLANETS,
  type PlanetName,
} from "./constants";
import { computeAspects } from "./aspects";
import { computeVimshottariDasha } from "./dashas";
import { detectDoshas } from "./doshas";
import { fetchRawPositions, type RawPositions } from "./positions";
import { computePositionsSweph } from "./positions-sweph";
import { detectYogas } from "./yogas";
import { computePanchangAndAvakahada } from "./panchang";
import type {
  AyanamshaKey,
  ChartDigest,
  HouseSystem,
  NatalChart,
  PlanetPosition,
  RawChartInput,
  TransitInfo,
} from "./types";

const CHART_VERSION = 2;

export async function computeNatalChart(input: RawChartInput): Promise<NatalChart | null> {
  const ayanamsha: AyanamshaKey = input.ayanamsha ?? "lahiri";
  const houseSystem: HouseSystem = input.houseSystem ?? "whole_sign";

  // Try Swiss Ephemeris first (offline, no rate limits, sub-arcsecond accuracy).
  // Fall back to FreeAstrologyAPI if sweph fails for any reason (e.g., native module load issue in some envs).
  let raw: RawPositions | null = null;
  try {
    raw = await computePositionsSweph(input);
  } catch (e) {
    console.warn("Sweph chart compute failed, falling back to remote API:", e);
  }
  if (!raw) {
    raw = await fetchRawPositions(input);
  }
  if (!raw) return null;

  // Re-house planets relative to ascendant if API didn't do it consistently
  const ascSign = raw.ascendantSign;
  const planets: PlanetPosition[] = raw.planets.map(p => ({
    ...p,
    house: ((p.sign - ascSign + 12) % 12) + 1,
  }));

  const moon = planets.find(p => p.name === "Moon");
  const sun = planets.find(p => p.name === "Sun");
  if (!moon || !sun) return null;

  const dashas = computeVimshottariDasha(moon, input.dob, input.birthTime);
  const yogas = detectYogas(planets, ascSign);
  const doshas = detectDoshas(planets, ascSign);
  const aspects = computeAspects(planets);

  // Compute Panchang and Avakahada
  const dateObj = new Date(`${input.dob}T${input.birthTime}Z`); // approximation for Vara calculation
  const { panchang, avakahada } = computePanchangAndAvakahada(
    sun.longitude,
    moon.longitude,
    raw.ascendantLongitude,
    dateObj
  );

  // House lords map (1..12 → planet that rules the sign occupying that house)
  const houseLords: Record<number, PlanetName> = {};
  for (let h = 1; h <= 12; h++) {
    const signInHouse = ((ascSign - 1 + h - 1) % 12) + 1;
    houseLords[h] = SIGN_LORD[signInHouse];
  }

  return {
    version: CHART_VERSION,
    computedAt: new Date().toISOString(),
    input: {
      ...input,
      latitude: raw.latitude,
      longitude: raw.longitude,
      timezone: raw.timezone,
    },
    ayanamsha,
    houseSystem,
    ascendant: {
      sign: ascSign,
      signName: SIGNS[ascSign - 1],
      degreeInSign: raw.ascendantDegree,
    },
    moonSign: moon.sign,
    sunSign: sun.sign,
    planets,
    houseLords,
    ...(raw.bhavaCusps && { bhavaCusps: raw.bhavaCusps }),
    dashas,
    yogas,
    doshas,
    aspects,
    panchang,
    avakahada,
  };
}

/** Build a compact text digest of the chart for LLM prompting. Uses Vedic Jyotish terminology. */
export function buildChartDigest(chart: NatalChart, transits?: TransitInfo | null): ChartDigest {
  const ascName = chart.ascendant.signName;
  const ascVedic = SIGNS_VEDIC[chart.ascendant.sign - 1];
  const moonNak = NAKSHATRAS[chart.planets.find(p => p.name === "Moon")!.nakshatraIndex];
  const sunNak = NAKSHATRAS[chart.planets.find(p => p.name === "Sun")!.nakshatraIndex];
  const ayanLabel = AYANAMSHA_MAP[chart.ayanamsha]?.label ?? chart.ayanamsha;

  const identity =
    `${ascVedic} (${ascName}) Lagna at ${chart.ascendant.degreeInSign.toFixed(1)}°. ` +
    `Chandra Rashi: ${SIGNS_VEDIC[chart.moonSign - 1]} (${SIGNS[chart.moonSign - 1]}), nakshatra ${moonNak.name}. ` +
    `Surya Rashi: ${SIGNS_VEDIC[chart.sunSign - 1]} (${SIGNS[chart.sunSign - 1]}), nakshatra ${sunNak.name}. ` +
    `Ayanamsha: ${ayanLabel}. House system: Whole Sign (Rashi-based).`;

  const planets = chart.planets.map(p => {
    const retro = p.retrograde ? " [Vakri]" : "";
    const vedicSign = SIGNS_VEDIC[p.sign - 1];
    const bhava = p.bhavaHouse != null && p.bhavaHouse !== p.house
      ? `, Bhava Chalit Bhava ${p.bhavaHouse}`
      : "";
    return `${p.name} (Graha) in ${vedicSign}/${p.signName} Rashi (Bhava ${p.house}${bhava}, ${p.degreeInSign.toFixed(1)}°) — ${NAKSHATRAS[p.nakshatraIndex].name} nakshatra, Pada ${p.nakshatraPada}, ruled by ${NAKSHATRAS[p.nakshatraIndex].lord}${retro}`;
  });

  const planetsByHouse: Record<number, string[]> = {};
  for (const p of chart.planets) {
    (planetsByHouse[p.house] ||= []).push(p.name);
  }
  const houseSummary: string[] = [];
  for (let h = 1; h <= 12; h++) {
    const lord = chart.houseLords[h];
    const occupants = planetsByHouse[h]?.length ? `occupied by ${planetsByHouse[h].join(", ")}` : "no occupants";
    houseSummary.push(`Bhava ${h} (${HOUSE_MEANINGS[h]}): lord is ${lord} (sitting in Bhava ${chart.planets.find(p => p.name === lord)?.house ?? "?"}), ${occupants}`);
  }

  const yogas = chart.yogas.map(y => `${y.name} [${y.type}, ${y.strength}]: ${y.description}`);
  const doshas = chart.doshas.map(d => {
    const cancel = d.cancellation ? ` ${d.cancellation}` : "";
    return `${d.name} [severity: ${d.severity}]: ${d.description}${cancel}`;
  });

  const m = chart.dashas.current.maha;
  const a = chart.dashas.current.antar;
  const pr = chart.dashas.current.pratyantar;
  const currentDasha =
    `Mahadasha: ${m.lord} (until ${m.endDate.slice(0, 10)}). ` +
    `Antardasha: ${a.lord} (until ${a.endDate.slice(0, 10)})` +
    (pr ? `. Pratyantar: ${pr.lord} (until ${pr.endDate.slice(0, 10)})` : "");

  const notableTransits: string[] = [];
  if (transits?.notable.sadeSati) {
    notableTransits.push(`Sade Sati [${transits.notable.sadeSati.phase}]: ${transits.notable.sadeSati.description}`);
  }
  if (transits?.notable.saturnReturn) {
    notableTransits.push("Saturn Return — transit Saturn over natal Saturn sign. A major life-restructuring period (typically around ages 29-30, 58-60).");
  }
  if (transits?.notable.jupiterTransitHouse) {
    notableTransits.push(`Jupiter currently transits the ${transits.notable.jupiterTransitHouse}${suffix(transits.notable.jupiterTransitHouse)} house from your ascendant — ${HOUSE_MEANINGS[transits.notable.jupiterTransitHouse]} area is being expanded/blessed.`);
  }
  if (transits?.notable.rahuKetuTransit) {
    notableTransits.push(`Rahu currently in your ${transits.notable.rahuKetuTransit.rahuHouse}${suffix(transits.notable.rahuKetuTransit.rahuHouse)} house, Ketu in your ${transits.notable.rahuKetuTransit.ketuHouse}${suffix(transits.notable.rahuKetuTransit.ketuHouse)} house — axis of desire vs. detachment activated in these life areas.`);
  }

  return { identity, planets, houseSummary, yogas, doshas, currentDasha, notableTransits };
}

/** Extract chart fragments most relevant to a given life topic. */
export function relevantChartFor(chart: NatalChart, topic: string, transits?: TransitInfo | null) {
  const key = (topic || "general").toLowerCase();
  const houses = TOPIC_HOUSES[key] ?? TOPIC_HOUSES.general;
  const karakas = TOPIC_PLANETS[key] ?? TOPIC_PLANETS.general;

  const relevantHouses = houses.map(h => {
    const lord = chart.houseLords[h];
    const lordPos = chart.planets.find(p => p.name === lord);
    const occupants = chart.planets.filter(p => p.house === h);
    const aspectingPlanets = chart.aspects
      .filter(a => a.toHouse === h)
      .map(a => a.from);
    // Note planets whose Bhava Chalit house differs from Whole Sign house
    const bhavaShifts = chart.planets
      .filter(p => p.bhavaHouse != null && p.house !== h && p.bhavaHouse === h)
      .map(p => p.name);
    return {
      house: h,
      meaning: HOUSE_MEANINGS[h],
      lord,
      lordPosition: lordPos ? `${lord} in House ${lordPos.house} (${lordPos.signName})` : null,
      occupants: occupants.map(o => `${o.name} (${o.signName})`),
      aspectingPlanets: Array.from(new Set(aspectingPlanets)),
      bhavaShiftsIn: bhavaShifts,
    };
  });

  const relevantKarakas = karakas.map(k => {
    const p = chart.planets.find(pl => pl.name === k);
    if (!p) return null;
    return {
      planet: k,
      sign: p.signName,
      house: p.house,
      nakshatra: NAKSHATRAS[p.nakshatraIndex].name,
      retrograde: p.retrograde,
    };
  }).filter(Boolean);

  const relevantYogas = chart.yogas.filter(y =>
    y.involves.some(p => karakas.includes(p))
    || houses.some(h => y.description.includes(`${h}${suffix(h)} house`))
  );

  const relevantDoshas = chart.doshas.filter(d =>
    d.severity !== "cancelled" && d.severity !== "none"
  );

  const transitImpact: string[] = [];
  if (transits) {
    for (const h of houses) {
      const inThisHouse = transits.planets.filter(p => p.house === h);
      if (inThisHouse.length > 0) {
        transitImpact.push(`Currently transiting your ${h}${suffix(h)} bhava: ${inThisHouse.map(p => p.name).join(", ")}`);
      }
    }
  }

  // ── Dasha–topic interaction (Jyotish predictive priority) ──
  // Analyze how current Maha/Antar dasha lords relate to this topic's houses and karakas.
  const maha = chart.dashas.current.maha;
  const antar = chart.dashas.current.antar;
  const pratyantar = chart.dashas.current.pratyantar;

  const dashaLords = [maha.lord, antar.lord, ...(pratyantar ? [pratyantar.lord] : [])] as PlanetName[];
  const dashaTopicInteraction: string[] = [];

  for (const lord of dashaLords) {
    const lordPos = chart.planets.find(p => p.name === lord);
    if (!lordPos) continue;
    const level = lord === maha.lord ? "Mahadasha" : lord === antar.lord ? "Antardasha" : "Pratyantar";

    // Does the dasha lord sit in a topic-relevant house?
    if (houses.includes(lordPos.house)) {
      dashaTopicInteraction.push(`${level} lord ${lord} sits in Bhava ${lordPos.house} — directly activating the ${key} area.`);
    }

    // Does the dasha lord rule a topic-relevant house?
    for (const h of houses) {
      if (chart.houseLords[h] === lord) {
        dashaTopicInteraction.push(`${level} lord ${lord} rules Bhava ${h} (${HOUSE_MEANINGS[h]}), bringing its significations into active karma period.`);
      }
    }

    // Is the dasha lord itself a karaka for this topic?
    if (karakas.includes(lord)) {
      dashaTopicInteraction.push(`${level} lord ${lord} is a natural karaka (significator) for ${key} — strongly colours this dasha period.`);
    }
  }

  return {
    topic: key,
    houses: relevantHouses,
    karakas: relevantKarakas,
    yogas: relevantYogas,
    doshas: relevantDoshas,
    currentDasha: chart.dashas.current,
    dashaTopicInteraction,
    transitImpact,
  };
}

function suffix(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return "th";
  switch (n % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}
