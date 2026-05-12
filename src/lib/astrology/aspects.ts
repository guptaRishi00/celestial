import { SPECIAL_ASPECTS, type PlanetName } from "./constants";
import type { AspectInfo, PlanetPosition } from "./types";

/**
 * Compute Drishti (Vedic aspects) cast by each planet.
 * All planets aspect the 7th house from themselves.
 * Mars, Jupiter, Saturn (+ Rahu/Ketu) have additional special aspects.
 */
export function computeAspects(planets: PlanetPosition[]): AspectInfo[] {
  const out: AspectInfo[] = [];

  // Index planets by house for quick lookup
  const planetsByHouse: Record<number, PlanetName[]> = {};
  for (const p of planets) {
    (planetsByHouse[p.house] ||= []).push(p.name);
  }

  for (const planet of planets) {
    const aspects = SPECIAL_ASPECTS[planet.name] ?? [7];
    for (const offset of aspects) {
      const toHouse = ((planet.house - 1 + offset - 1) % 12) + 1;
      out.push({
        from: planet.name,
        toHouse,
        toPlanets: planetsByHouse[toHouse] ?? [],
        type: offset === 7 ? "7th" : "special",
      });
    }
  }
  return out;
}

/** Which planets aspect a given house? */
export function aspectsOnHouse(aspects: AspectInfo[], house: number): AspectInfo[] {
  return aspects.filter(a => a.toHouse === house);
}

/** Which planets aspect a given planet (by sitting house)? */
export function aspectsOnPlanet(aspects: AspectInfo[], planet: PlanetPosition): AspectInfo[] {
  return aspects.filter(a => a.toHouse === planet.house && a.from !== planet.name);
}
