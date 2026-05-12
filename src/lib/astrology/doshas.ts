import type { PlanetName } from "./constants";
import type { DoshaResult, PlanetPosition } from "./types";

function findPlanet(planets: PlanetPosition[], name: PlanetName): PlanetPosition | undefined {
  return planets.find(p => p.name === name);
}

function houseDiff(a: number, b: number): number {
  return ((a - b + 12) % 12) + 1;
}

export function detectDoshas(planets: PlanetPosition[], ascendantSign: number): DoshaResult[] {
  const out: DoshaResult[] = [];
  const mars = findPlanet(planets, "Mars");
  const rahu = findPlanet(planets, "Rahu");
  const ketu = findPlanet(planets, "Ketu");
  const saturn = findPlanet(planets, "Saturn");
  const sun = findPlanet(planets, "Sun");
  const moon = findPlanet(planets, "Moon");
  const jupiter = findPlanet(planets, "Jupiter");

  // Mangal Dosha — Mars in 1, 4, 7, 8, or 12 from Lagna or Moon
  if (mars) {
    const mangalHouses = [1, 4, 7, 8, 12];
    const fromLagna = mars.house;
    const fromMoon = moon ? houseDiff(mars.house, moon.house) : 0;
    const fromLagnaHit = mangalHouses.includes(fromLagna);
    const fromMoonHit = fromMoon && mangalHouses.includes(fromMoon);
    if (fromLagnaHit || fromMoonHit) {
      // Cancellation factors: Mars in own/exalted sign, Jupiter aspect, etc.
      const cancelled =
        (mars.sign === 1 || mars.sign === 8 || mars.sign === 10) || // own/exalted
        (jupiter && houseDiff(jupiter.house, mars.house) === 7);     // Jupiter direct aspect
      out.push({
        name: "Mangal Dosha (Kuja Dosha)",
        present: true,
        severity: cancelled ? "cancelled" : "moderate",
        description: `Mars occupies the ${fromLagnaHit ? `${fromLagna}${suffix(fromLagna)} house from Lagna` : `${fromMoon}${suffix(fromMoon)} house from Moon`} — traditionally indicates friction or delays in marriage and harsh temperament in partnership matters.`,
        cancellation: cancelled
          ? `Cancelled — ${mars.sign === 1 || mars.sign === 8 || mars.sign === 10 ? "Mars is in own/exalted sign which neutralizes the dosha" : "Jupiter aspects Mars and softens its effects"}.`
          : undefined,
      });
    }
  }

  // Kaal Sarp Dosha — all 7 planets between Rahu and Ketu (one side of the Rahu-Ketu axis)
  if (rahu && ketu) {
    const rahuLon = rahu.longitude;
    const ketuLon = ketu.longitude;
    // Check if all visible planets are on one side of Rahu-Ketu axis
    const otherPlanets = planets.filter(p => p.name !== "Rahu" && p.name !== "Ketu");
    const inForwardArc = (lon: number) => {
      // forward arc from Rahu to Ketu (going through increasing degrees mod 360)
      const arc = (ketuLon - rahuLon + 360) % 360;
      const rel = (lon - rahuLon + 360) % 360;
      return rel < arc;
    };
    const forwardCount = otherPlanets.filter(p => inForwardArc(p.longitude)).length;
    const allOneSide = forwardCount === otherPlanets.length || forwardCount === 0;
    if (allOneSide) {
      out.push({
        name: "Kaal Sarp Dosha",
        present: true,
        severity: "high",
        description: "All seven major planets are hemmed between the Rahu-Ketu axis — indicates karmic obstacles, delays in achievements, and a sense of struggle to manifest one's goals. Often manifests as obstacles before breakthroughs.",
      });
    }
  }

  // Sade Sati — Saturn currently transiting 12th/1st/2nd from natal Moon
  // (This needs current transits — flagged for transits module to enrich)
  // Here we just note natal Saturn aspect to Moon as a related stress factor
  if (saturn && moon) {
    const d = houseDiff(saturn.house, moon.house);
    if ([1, 7].includes(d) || saturn.sign === moon.sign) {
      out.push({
        name: "Shani-Chandra Affliction",
        present: true,
        severity: "moderate",
        description: `Saturn and Moon are in close relation (${saturn.sign === moon.sign ? "same sign" : `${d}${suffix(d)} from each other`}) — natural emotional heaviness, tendency toward melancholy or seriousness, and lessons through emotional discipline. Often gives wisdom and depth with maturity.`,
      });
    }
  }

  // Pitra Dosha — Sun with Rahu/Ketu (esp. in 9th house)
  if (sun) {
    const withRahu = rahu && sun.sign === rahu.sign;
    const withKetu = ketu && sun.sign === ketu.sign;
    if (withRahu || withKetu) {
      const severity: DoshaResult["severity"] = sun.house === 9 ? "high" : "moderate";
      out.push({
        name: "Pitra Dosha",
        present: true,
        severity,
        description: `Sun conjunct with ${withRahu ? "Rahu" : "Ketu"}${sun.house === 9 ? " in the 9th house" : ""} — traditionally indicates karmic issues from paternal lineage. Often manifests as challenges in relationship with father, blocks in career fortune, or unresolved ancestral matters.`,
      });
    }
  }

  // Guru Chandal — Jupiter conjunct Rahu or Ketu
  if (jupiter && (rahu && jupiter.sign === rahu.sign)) {
    out.push({
      name: "Guru Chandal Yoga",
      present: true,
      severity: "moderate",
      description: "Jupiter conjunct Rahu — wisdom mixed with unconventional or unorthodox influences. Can give sharp intellect and innovative thinking but also tendency toward questionable advice or moral confusion. Spiritual study often resolves it.",
    });
  }
  if (jupiter && (ketu && jupiter.sign === ketu.sign)) {
    out.push({
      name: "Guru Chandal Yoga (Ketu)",
      present: true,
      severity: "mild",
      description: "Jupiter conjunct Ketu — gives strong spiritual inclinations, detachment from materialism, but can scatter focus from worldly responsibilities. Often produces deep philosophers or seekers.",
    });
  }

  return out;
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
