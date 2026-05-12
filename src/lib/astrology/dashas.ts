import { DASHA_SEQUENCE, DASHA_YEARS, NAKSHATRAS, type PlanetName } from "./constants";
import type { DashaPeriod, DashaTimeline, PlanetPosition } from "./types";

const NAK_SPAN = 360 / 27; // 13.3333°
const YEAR_MS = 365.2425 * 24 * 60 * 60 * 1000;

function addYears(date: Date, years: number): Date {
  return new Date(date.getTime() + years * YEAR_MS);
}

function isoDate(d: Date): string {
  return d.toISOString();
}

function dashaIndexOf(planet: PlanetName): number {
  return DASHA_SEQUENCE.indexOf(planet);
}

/**
 * Compute Vimshottari dasha timeline from Moon's longitude at birth.
 *
 * Algorithm: Moon's nakshatra determines birth dasha. Time remaining in birth
 * dasha = (1 - fractionElapsedInNakshatra) × dashaYears.
 */
export function computeVimshottariDasha(moon: PlanetPosition, dob: string, birthTime: string): DashaTimeline {
  const birthDate = new Date(`${dob}T${birthTime || "12:00"}:00Z`);

  const nakIdx = moon.nakshatraIndex;
  const nak = NAKSHATRAS[nakIdx];
  const birthLord = nak.lord;

  // How far through the birth nakshatra is the Moon?
  const moonLon = moon.longitude;
  const nakStart = nakIdx * NAK_SPAN;
  const within = moonLon - nakStart;
  const fractionElapsed = within / NAK_SPAN; // 0..1

  // Remaining years in the birth dasha
  const birthDashaTotal = DASHA_YEARS[birthLord];
  const remainingInBirthDasha = birthDashaTotal * (1 - fractionElapsed);

  // Build mahadasha timeline starting from birth
  const mahas: DashaPeriod[] = [];
  let cursor = new Date(birthDate);

  // First (partial) mahadasha — from birth to end of birth dasha
  const firstEnd = addYears(cursor, remainingInBirthDasha);
  mahas.push({
    lord: birthLord,
    startDate: isoDate(cursor),
    endDate: isoDate(firstEnd),
    years: remainingInBirthDasha,
    level: 1,
  });
  cursor = firstEnd;

  // Subsequent mahadashas (full length) — generate next 8 to cover ~100+ years
  let seqIdx = dashaIndexOf(birthLord);
  for (let i = 0; i < 8; i++) {
    seqIdx = (seqIdx + 1) % DASHA_SEQUENCE.length;
    const lord = DASHA_SEQUENCE[seqIdx];
    const yrs = DASHA_YEARS[lord];
    const end = addYears(cursor, yrs);
    mahas.push({
      lord,
      startDate: isoDate(cursor),
      endDate: isoDate(end),
      years: yrs,
      level: 1,
    });
    cursor = end;
  }

  // Find current mahadasha
  const now = Date.now();
  const currentMaha = mahas.find(m => new Date(m.startDate).getTime() <= now && new Date(m.endDate).getTime() > now)
    ?? mahas[0];

  // Compute antardashas within current mahadasha
  const antars = buildSubPeriods(currentMaha, 2);
  const currentAntar = antars.find(a => new Date(a.startDate).getTime() <= now && new Date(a.endDate).getTime() > now)
    ?? antars[0];

  // Pratyantar within current antar
  const pratyantars = buildSubPeriods(currentAntar, 3);
  const currentPratyantar = pratyantars.find(p => new Date(p.startDate).getTime() <= now && new Date(p.endDate).getTime() > now);

  // Next mahadashas (after current one)
  const idxOfCurrent = mahas.indexOf(currentMaha);
  const upcomingMaha = mahas.slice(idxOfCurrent + 1, idxOfCurrent + 4);

  return {
    current: {
      maha: currentMaha,
      antar: currentAntar,
      pratyantar: currentPratyantar,
    },
    upcomingMaha,
    birthDasha: birthLord,
  };
}

/**
 * Within a given dasha period, build sub-periods (antardasha or pratyantar).
 * Sub-periods start from the dasha lord and proceed in Vimshottari order.
 * Each sub-period length = (parentYears × subLordYears) / 120.
 */
function buildSubPeriods(parent: DashaPeriod, level: 2 | 3): DashaPeriod[] {
  const out: DashaPeriod[] = [];
  let cursor = new Date(parent.startDate);
  const parentEnd = new Date(parent.endDate).getTime();
  let seqIdx = dashaIndexOf(parent.lord);

  for (let i = 0; i < 9; i++) {
    const subLord = DASHA_SEQUENCE[(seqIdx + i) % DASHA_SEQUENCE.length];
    const subYears = (parent.years * DASHA_YEARS[subLord]) / 120;
    let end = addYears(cursor, subYears);
    if (end.getTime() > parentEnd) end = new Date(parentEnd);
    out.push({
      lord: subLord,
      startDate: isoDate(cursor),
      endDate: isoDate(end),
      years: subYears,
      level,
      parent: parent.lord,
    });
    cursor = end;
    if (cursor.getTime() >= parentEnd) break;
  }
  return out;
}
