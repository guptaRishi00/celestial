import sweph from "sweph";
import tzLookup from "tz-lookup";
import { AYANAMSHA_MAP, NAKSHATRAS, SIGNS, type PlanetName } from "./constants";
import type { AyanamshaKey, PlanetPosition, RawChartInput } from "./types";
import type { RawPositions } from "./positions";

const C = sweph.constants;

let _lastSidMode = -1;
function ensureInit(ayanamshaId: number) {
  if (_lastSidMode === ayanamshaId) return;
  sweph.set_sid_mode(ayanamshaId, 0, 0);
  _lastSidMode = ayanamshaId;
}

const PLANET_IDS: Array<{ name: PlanetName; id: number }> = [
  { name: "Sun",     id: C.SE_SUN },
  { name: "Moon",    id: C.SE_MOON },
  { name: "Mars",    id: C.SE_MARS },
  { name: "Mercury", id: C.SE_MERCURY },
  { name: "Jupiter", id: C.SE_JUPITER },
  { name: "Venus",   id: C.SE_VENUS },
  { name: "Saturn",  id: C.SE_SATURN },
  // Rahu = mean lunar node. Ketu = Rahu + 180°
  { name: "Rahu",    id: C.SE_MEAN_NODE },
];

function nakshatraFromLongitude(longitude: number): { index: number; pada: 1 | 2 | 3 | 4 } {
  const lon = ((longitude % 360) + 360) % 360;
  const nakSpan = 360 / 27;
  const idx = Math.floor(lon / nakSpan) % 27;
  const within = lon - idx * nakSpan;
  const pada = Math.min(4, Math.max(1, Math.floor(within / (nakSpan / 4)) + 1)) as 1 | 2 | 3 | 4;
  return { index: idx, pada };
}

/**
 * Compute timezone offset in hours for a given IANA timezone at a given UTC reference point.
 * Positive for east of GMT (e.g., +5.5 for IST).
 */
function tzOffsetHours(iana: string, refUtcMs: number): number {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: iana,
      hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    const parts = dtf.formatToParts(new Date(refUtcMs));
    const get = (t: string) => Number((parts.find(p => p.type === t)?.value ?? "0"));
    const localAsUtc = Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour") === 24 ? 0 : get("hour"),
      get("minute"),
      get("second"),
    );
    return (localAsUtc - refUtcMs) / 3600000;
  } catch {
    return 0;
  }
}

/**
 * Resolve the timezone offset for a local birth datetime in a given IANA tz.
 * Iterates once to handle DST boundaries cleanly.
 */
function resolveLocalToUtc(
  year: number, month: number, day: number, hour: number, minute: number,
  iana: string,
): { utcMs: number; offsetHours: number } {
  // First pass: pretend the local time IS UTC, then back-correct by the offset
  let candidateUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  let offset = tzOffsetHours(iana, candidateUtc);
  candidateUtc -= offset * 3600000;
  // Refine once for DST edges
  const offset2 = tzOffsetHours(iana, candidateUtc);
  if (offset2 !== offset) {
    candidateUtc = Date.UTC(year, month - 1, day, hour, minute, 0) - offset2 * 3600000;
    offset = offset2;
  }
  return { utcMs: candidateUtc, offsetHours: offset };
}

/**
 * Nominatim geocoder — free, no key required. Has a 1 req/sec usage policy.
 */
async function geocodeNominatim(place: string): Promise<{ lat: number; lon: number; iana: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Celestial-Astrology/1.0 (contact via repo)" },
    });
    if (!res.ok) return null;
    const arr = await res.json();
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const lat = parseFloat(arr[0].lat);
    const lon = parseFloat(arr[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    let iana = "UTC";
    try { iana = tzLookup(lat, lon); } catch {}
    return { lat, lon, iana };
  } catch {
    return null;
  }
}

/**
 * Determine the Bhava Chalit (Placidus) house for a sidereal longitude, given 12 cusp longitudes.
 * Cusps may wrap around 360°, so the comparison handles that.
 */
function bhavaHouseFromCusps(longitude: number, cusps: number[]): number {
  const lon = ((longitude % 360) + 360) % 360;
  for (let i = 0; i < 12; i++) {
    const start = ((cusps[i] % 360) + 360) % 360;
    const end = ((cusps[(i + 1) % 12] % 360) + 360) % 360;
    if (end > start) {
      // Normal case: cusp range doesn't wrap 360°
      if (lon >= start && lon < end) return i + 1;
    } else {
      // Wraps around 360° (e.g., 350° → 10°)
      if (lon >= start || lon < end) return i + 1;
    }
  }
  return 1; // fallback — should not happen
}

export async function computePositionsSweph(input: RawChartInput): Promise<RawPositions | null> {
  if (!input.dob || !input.birthTime) return null;
  const [year, month, day] = input.dob.split("-").map(Number);
  const [hour, minute] = input.birthTime.split(":").map(Number);
  if (!year || !month || !day) return null;

  // Resolve location → lat/lon/timezone
  let lat = input.latitude;
  let lon = input.longitude;
  let iana: string | null = null;
  let tzHours = input.timezone;

  if ((lat === undefined || lon === undefined) && input.birthPlace) {
    const geo = await geocodeNominatim(input.birthPlace);
    if (geo) {
      lat = geo.lat;
      lon = geo.lon;
      iana = geo.iana;
    }
  }

  // Default to Delhi/IST if everything failed
  if (lat === undefined || lon === undefined) {
    lat = 28.6139;
    lon = 77.2090;
    iana = "Asia/Kolkata";
  } else if (!iana) {
    try { iana = tzLookup(lat, lon); } catch { iana = "UTC"; }
  }

  // Convert local birth time → UTC
  let utcMs: number;
  if (typeof tzHours === "number" && Number.isFinite(tzHours)) {
    utcMs = Date.UTC(year, month - 1, day, hour, minute, 0) - tzHours * 3600000;
  } else {
    const resolved = resolveLocalToUtc(year, month, day, hour, minute || 0, iana || "UTC");
    utcMs = resolved.utcMs;
    tzHours = resolved.offsetHours;
  }

  // Julian Day (UT)
  const ut = new Date(utcMs);
  const ymd = { y: ut.getUTCFullYear(), m: ut.getUTCMonth() + 1, d: ut.getUTCDate() };
  const fracHour = ut.getUTCHours() + ut.getUTCMinutes() / 60 + ut.getUTCSeconds() / 3600;
  const jd = sweph.julday(ymd.y, ymd.m, ymd.d, fracHour, C.SE_GREG_CAL);

  // Resolve which Ayanamsha to use
  const ayanKey: AyanamshaKey = input.ayanamsha ?? "lahiri";
  const ayanId = AYANAMSHA_MAP[ayanKey]?.swephId ?? 1;
  ensureInit(ayanId);
  const flags = C.SEFLG_SIDEREAL | C.SEFLG_MOSEPH | C.SEFLG_SPEED;

  // Ascendant + Placidus house cusps (sidereal)
  const houses = sweph.houses_ex2(jd, C.SEFLG_SIDEREAL, lat, lon, "P");
  const ascLon = houses?.data?.points?.[0];
  if (typeof ascLon !== "number") return null;
  const ascSign = Math.floor(((ascLon % 360) + 360) % 360 / 30) + 1;
  const ascDegInSign = ascLon - (ascSign - 1) * 30;

  // Extract 12 Placidus cusp longitudes for Bhava Chalit
  const rawCusps: number[] = houses?.data?.cusps ?? [];
  // houses_ex2 returns cusps[0] unused (1-indexed), cusps[1..12] = the 12 house cusps
  const bhavaCusps: number[] = rawCusps.length > 12
    ? rawCusps.slice(1, 13).map(c => ((c % 360) + 360) % 360)
    : [];

  const planets: PlanetPosition[] = [];
  for (const { name, id } of PLANET_IDS) {
    const r = sweph.calc_ut(jd, id, flags);
    if (!r?.data || r.flag < 0) continue;
    const lonDeg = ((r.data[0] % 360) + 360) % 360;
    const speed = r.data[3];
    const sign = Math.floor(lonDeg / 30) + 1;
    const degreeInSign = lonDeg - (sign - 1) * 30;
    const nak = nakshatraFromLongitude(lonDeg);
    const nakObj = NAKSHATRAS[nak.index];
    const house = ((sign - ascSign + 12) % 12) + 1;
    const bh = bhavaCusps.length === 12 ? bhavaHouseFromCusps(lonDeg, bhavaCusps) : undefined;
    planets.push({
      name,
      sign,
      signName: SIGNS[sign - 1],
      house,
      degreeInSign,
      longitude: lonDeg,
      nakshatraIndex: nak.index,
      nakshatraName: nakObj.name,
      nakshatraPada: nak.pada,
      nakshatraLord: nakObj.lord,
      retrograde: name !== "Rahu" && speed < 0,
      ...(bh !== undefined && { bhavaHouse: bh }),
    });
  }

  // Ketu = opposite Rahu
  const rahu = planets.find(p => p.name === "Rahu");
  if (rahu) {
    const ketuLon = (rahu.longitude + 180) % 360;
    const sign = Math.floor(ketuLon / 30) + 1;
    const degreeInSign = ketuLon - (sign - 1) * 30;
    const nak = nakshatraFromLongitude(ketuLon);
    const nakObj = NAKSHATRAS[nak.index];
    const house = ((sign - ascSign + 12) % 12) + 1;
    const ketuBh = bhavaCusps.length === 12 ? bhavaHouseFromCusps(ketuLon, bhavaCusps) : undefined;
    planets.push({
      name: "Ketu",
      sign,
      signName: SIGNS[sign - 1],
      house,
      degreeInSign,
      longitude: ketuLon,
      nakshatraIndex: nak.index,
      nakshatraName: nakObj.name,
      nakshatraPada: nak.pada,
      nakshatraLord: nakObj.lord,
      retrograde: true, // nodes are always retrograde in Vedic convention
      ...(ketuBh !== undefined && { bhavaHouse: ketuBh }),
    });
    // Rahu is also considered retrograde
    rahu.retrograde = true;
  }

  if (planets.length < 9) return null;

  return {
    ascendantLongitude: ascLon,
    ascendantSign: ascSign,
    ascendantDegree: ascDegInSign,
    planets,
    latitude: lat,
    longitude: lon,
    timezone: tzHours,
    ...(bhavaCusps.length === 12 && { bhavaCusps }),
  };
}
