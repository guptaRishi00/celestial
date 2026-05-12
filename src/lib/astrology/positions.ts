import { NAKSHATRAS, SIGNS, type PlanetName } from "./constants";
import type { PlanetPosition, RawChartInput } from "./types";

const PLANET_KEYS: PlanetName[] = [
  "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu",
];

interface FreeAstrologyApiResult {
  ascendant?: number;
  output?: Record<string, any>;
  [key: string]: any;
}

async function geocode(place: string, apiKey: string): Promise<{ lat: number; lon: number; tz: number } | null> {
  try {
    const res = await fetch("https://json.freeastrologyapi.com/geo-details", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({ location: place }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return {
        lat: parseFloat(data[0].latitude),
        lon: parseFloat(data[0].longitude),
        tz: data[0].timezone_offset !== undefined ? parseFloat(data[0].timezone_offset) : 5.5,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function safeNum(v: any, fallback = 0): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    if (!Number.isNaN(n)) return n;
  }
  return fallback;
}

function nakshatraFromLongitude(longitude: number): { index: number; pada: 1 | 2 | 3 | 4 } {
  const lon = ((longitude % 360) + 360) % 360;
  const nakSpan = 360 / 27; // 13.3333°
  const idx = Math.floor(lon / nakSpan) % 27;
  const within = lon - idx * nakSpan;
  const pada = (Math.floor(within / (nakSpan / 4)) + 1) as 1 | 2 | 3 | 4;
  return { index: idx, pada: Math.min(4, Math.max(1, pada)) as 1 | 2 | 3 | 4 };
}

function normalizePlanetEntry(raw: any, name: PlanetName): PlanetPosition | null {
  if (!raw) return null;

  const longitude = safeNum(raw.fullDegree ?? raw.full_degree ?? raw.longitude ?? raw.absolute_degree, NaN);
  const sign = safeNum(raw.current_sign ?? raw.sign ?? raw.zodiac_sign_id, NaN);
  const house = safeNum(raw.house_number ?? raw.house ?? raw.bhava, NaN);
  const degreeInSign = safeNum(raw.normDegree ?? raw.norm_degree ?? raw.degree, NaN);

  // Sometimes the API returns nakshatra info directly; otherwise derive.
  let nakIdx: number;
  let pada: 1 | 2 | 3 | 4;
  if (Number.isFinite(longitude)) {
    const n = nakshatraFromLongitude(longitude);
    nakIdx = n.index;
    pada = n.pada;
  } else if (raw.nakshatra_id || raw.nakshatra_number) {
    nakIdx = Math.max(0, Math.min(26, safeNum(raw.nakshatra_id ?? raw.nakshatra_number, 1) - 1));
    pada = (safeNum(raw.nakshatra_pada ?? raw.pada, 1) as 1 | 2 | 3 | 4) || 1;
  } else {
    return null;
  }

  const nak = NAKSHATRAS[nakIdx];
  if (!nak) return null;

  // Compute longitude if missing using sign + degreeInSign
  const computedLon = Number.isFinite(longitude)
    ? longitude
    : (Number.isFinite(sign) && Number.isFinite(degreeInSign))
      ? (sign - 1) * 30 + degreeInSign
      : nakIdx * (360 / 27);

  const computedSign = Number.isFinite(sign) && sign >= 1 && sign <= 12
    ? sign
    : Math.floor(computedLon / 30) + 1;

  const computedDeg = Number.isFinite(degreeInSign)
    ? degreeInSign
    : computedLon - (computedSign - 1) * 30;

  const computedHouse = Number.isFinite(house) && house >= 1 && house <= 12 ? house : computedSign;

  return {
    name,
    sign: computedSign,
    signName: raw.zodiac_sign_name || SIGNS[computedSign - 1],
    house: computedHouse,
    degreeInSign: Math.max(0, Math.min(29.9999, computedDeg)),
    longitude: ((computedLon % 360) + 360) % 360,
    nakshatraIndex: nakIdx,
    nakshatraName: nak.name,
    nakshatraPada: pada,
    nakshatraLord: nak.lord,
    retrograde: raw.isRetro === "true" || raw.isRetro === true || raw.retrograde === true,
  };
}

export interface RawPositions {
  ascendantLongitude: number;
  ascendantSign: number;
  ascendantDegree: number;
  planets: PlanetPosition[];
  latitude: number;
  longitude: number;
  timezone: number;
}

export async function fetchRawPositions(input: RawChartInput): Promise<RawPositions | null> {
  const apiKey = process.env.ASTROLOGY_API_KEY;
  if (!apiKey) return null;

  if (!input.dob || !input.birthTime) return null;
  const [year, month, date] = input.dob.split("-").map(Number);
  const [hours, minutes] = input.birthTime.split(":").map(Number);
  if (!year || !month || !date) return null;

  let lat = input.latitude ?? 28.6139;
  let lon = input.longitude ?? 77.2090;
  let tz = input.timezone ?? 5.5;

  if ((input.latitude === undefined || input.longitude === undefined) && input.birthPlace) {
    const geo = await geocode(input.birthPlace, apiKey);
    if (geo) {
      lat = geo.lat;
      lon = geo.lon;
      tz = geo.tz;
    }
  }

  let body: any;
  try {
    const res = await fetch("https://json.freeastrologyapi.com/planets/extended", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({
        year, month, date, hours, minutes, seconds: 0,
        latitude: lat, longitude: lon, timezone: tz,
        settings: { observation_point: "topocentric", ayanamsha: "lahiri" },
      }),
    });
    if (!res.ok) return null;
    body = await res.json();
  } catch {
    return null;
  }

  const output = body?.output ?? body;
  if (!output || typeof output !== "object") return null;

  // Ascendant — try several common shapes
  let ascLon = safeNum(output.Ascendant?.fullDegree ?? output.ascendant?.fullDegree ?? body.ascendant, NaN);
  if (!Number.isFinite(ascLon)) {
    // Sometimes called 'ascendant' or under a numbered key
    for (const k of Object.keys(output)) {
      if (/asc(endant)?/i.test(k)) {
        ascLon = safeNum(output[k]?.fullDegree ?? output[k]?.full_degree ?? output[k], NaN);
        if (Number.isFinite(ascLon)) break;
      }
    }
  }
  if (!Number.isFinite(ascLon)) ascLon = 0;
  const ascSign = Math.floor(ascLon / 30) + 1;
  const ascDeg = ascLon - (ascSign - 1) * 30;

  // Extract planet entries
  const planets: PlanetPosition[] = [];
  for (const name of PLANET_KEYS) {
    let entry: any = output[name] || output[name.toLowerCase()];
    if (!entry) {
      // try by numeric key with localized_name match
      for (const k of Object.keys(output)) {
        const v = output[k];
        if (v && typeof v === "object" && (v.localized_name === name || v.name === name)) {
          entry = v;
          break;
        }
      }
    }
    const norm = normalizePlanetEntry(entry, name);
    if (norm) {
      // Derive house from ascendant if not provided
      if (!norm.house || norm.house < 1) {
        const diff = ((norm.sign - ascSign + 12) % 12) + 1;
        norm.house = diff;
      }
      planets.push(norm);
    }
  }

  if (planets.length < 7) return null; // need at least the 7 visible grahas

  return {
    ascendantLongitude: ascLon,
    ascendantSign: ascSign,
    ascendantDegree: ascDeg,
    planets,
    latitude: lat,
    longitude: lon,
    timezone: tz,
  };
}
