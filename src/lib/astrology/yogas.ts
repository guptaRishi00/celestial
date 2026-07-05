import { YOGA_CITATIONS } from "./classical-grounding";
import {
  EXALTATION,
  KENDRA,
  OWN_SIGNS,
  type PlanetName,
  SIGN_LORD,
  TRIKONA,
} from "./constants";
import type { PlanetPosition, YogaResult } from "./types";

function findPlanet(
  planets: PlanetPosition[],
  name: PlanetName,
): PlanetPosition | undefined {
  return planets.find((p) => p.name === name);
}

function inOwnSign(p: PlanetPosition): boolean {
  return (OWN_SIGNS[p.name] ?? []).includes(p.sign);
}

function inExaltation(p: PlanetPosition): boolean {
  return EXALTATION[p.name] === p.sign;
}

function inKendra(p: PlanetPosition): boolean {
  return KENDRA.includes(p.house);
}

function inTrikona(p: PlanetPosition): boolean {
  return TRIKONA.includes(p.house);
}

function houseDiff(a: number, b: number): number {
  return ((a - b + 12) % 12) + 1; // 1-indexed distance forward
}

/**
 * Detects classical Vedic yogas. Conservative — only flags clearly-formed ones.
 */
export function detectYogas(
  planets: PlanetPosition[],
  ascendantSign: number,
): YogaResult[] {
  const out: YogaResult[] = [];
  const moon = findPlanet(planets, "Moon");
  const sun = findPlanet(planets, "Sun");
  const jupiter = findPlanet(planets, "Jupiter");
  const mars = findPlanet(planets, "Mars");
  const mercury = findPlanet(planets, "Mercury");
  const venus = findPlanet(planets, "Venus");
  const saturn = findPlanet(planets, "Saturn");

  // Gajakesari Yoga — Moon and Jupiter in mutual kendra
  if (moon && jupiter) {
    const d = houseDiff(jupiter.house, moon.house);
    if ([1, 4, 7, 10].includes(d)) {
      out.push({
        name: "Gajakesari Yoga",
        type: "auspicious",
        description:
          "Jupiter in a kendra (1st/4th/7th/10th) from Moon — confers intelligence, fame, eloquence, and a virtuous reputation. Native often gains respect from learned people.",
        involves: ["Moon", "Jupiter"],
        strength: jupiter.house === moon.house ? "strong" : "moderate",
      });
    }
  }

  // Chandra-Mangal Yoga — Moon and Mars conjunct
  if (moon && mars && moon.sign === mars.sign) {
    out.push({
      name: "Chandra-Mangal Yoga",
      type: "auspicious",
      description:
        "Moon and Mars conjunct — a powerful wealth-generating combination especially through business, real estate, or self-made ventures. Native is enterprising and emotionally driven toward action.",
      involves: ["Moon", "Mars"],
      strength: "strong",
    });
  }

  // Budha-Aditya Yoga — Sun and Mercury conjunct (Mercury not combust badly)
  if (sun && mercury && sun.sign === mercury.sign) {
    const diff = Math.abs(sun.degreeInSign - mercury.degreeInSign);
    out.push({
      name: "Budha-Aditya Yoga",
      type: "auspicious",
      description:
        "Sun and Mercury conjunct — bestows sharp intellect, articulate communication, and success in fields requiring analysis or leadership. Strongest when Mercury is not deeply combust.",
      involves: ["Sun", "Mercury"],
      strength: diff > 5 ? "strong" : "moderate",
    });
  }

  // Pancha Mahapurusha Yogas — Mars/Mercury/Jupiter/Venus/Saturn in own/exalted sign in kendra
  const mahaPurushaMap: { planet: PlanetName; name: string; desc: string }[] = [
    {
      planet: "Mars",
      name: "Ruchaka Yoga",
      desc: "Confers courage, leadership, military/athletic prowess, commanding personality, and victory over enemies.",
    },
    {
      planet: "Mercury",
      name: "Bhadra Yoga",
      desc: "Bestows intellect, eloquence, wit, business acumen, longevity, and respect among the learned.",
    },
    {
      planet: "Jupiter",
      name: "Hamsa Yoga",
      desc: "Grants wisdom, spirituality, moral authority, wealth through righteous means, and graceful demeanor.",
    },
    {
      planet: "Venus",
      name: "Malavya Yoga",
      desc: "Confers beauty, luxury, artistic talent, harmonious relationships, and refined tastes.",
    },
    {
      planet: "Saturn",
      name: "Sasa Yoga",
      desc: "Bestows discipline, authority over masses, leadership in organizations, and enduring success through perseverance.",
    },
  ];
  for (const m of mahaPurushaMap) {
    const p = findPlanet(planets, m.planet);
    if (p && inKendra(p) && (inOwnSign(p) || inExaltation(p))) {
      out.push({
        name: m.name,
        type: "auspicious",
        description: `Pancha Mahapurusha Yoga — ${m.planet} in kendra and in ${inExaltation(p) ? "exaltation" : "own sign"}. ${m.desc}`,
        involves: [m.planet],
        strength: inExaltation(p) ? "strong" : "moderate",
      });
    }
  }

  // Neecha Bhanga — a debilitated planet whose debilitation is cancelled
  for (const p of planets) {
    const debilSign = EXALTATION[p.name]
      ? ((EXALTATION[p.name]! + 6 - 1) % 12) + 1
      : null;
    if (debilSign && p.sign === debilSign) {
      // Cancellation: lord of debilitation sign is in kendra from ascendant or Moon
      const debilLord = SIGN_LORD[debilSign];
      const lordPos = findPlanet(planets, debilLord);
      if (
        lordPos &&
        (inKendra(lordPos) ||
          (moon && houseDiff(lordPos.house, moon.house) % 3 === 1))
      ) {
        out.push({
          name: "Neecha Bhanga Raja Yoga",
          type: "auspicious",
          description: `${p.name} is debilitated but its debilitation is cancelled (Neecha Bhanga) — this paradoxically becomes a powerful raja yoga, raising the native from humble circumstances to high position later in life.`,
          involves: [p.name, debilLord],
          strength: "moderate",
        });
      }
    }
  }

  // Dhana Yoga (simplified) — lords of 2/5/9/11 conjunct or in mutual kendra/trikona
  const wealthHouses = [2, 5, 9, 11];
  const wealthLordSigns = wealthHouses.map(
    (h) => ((ascendantSign - 1 + h - 1) % 12) + 1,
  );
  const wealthLords = wealthLordSigns.map((s) => SIGN_LORD[s]);
  const wealthLordPositions = wealthLords
    .map((l) => findPlanet(planets, l))
    .filter(Boolean) as PlanetPosition[];
  for (let i = 0; i < wealthLordPositions.length; i++) {
    for (let j = i + 1; j < wealthLordPositions.length; j++) {
      const a = wealthLordPositions[i];
      const b = wealthLordPositions[j];
      if (a.name === b.name) continue;
      if (a.sign === b.sign) {
        out.push({
          name: "Dhana Yoga",
          type: "auspicious",
          description: `Wealth-generating combination formed by the lords of the 2nd/5th/9th/11th houses (${a.name} and ${b.name}) joining in the same sign — indicates significant accumulation of wealth, often suddenly or through favorable circumstances.`,
          involves: [a.name, b.name],
          strength: "moderate",
        });
        break;
      }
    }
  }

  // Raja Yoga — Kendra lord + Trikona lord conjunct
  const kendraLords = KENDRA.map(
    (h) => SIGN_LORD[((ascendantSign - 1 + h - 1) % 12) + 1],
  );
  const trikonaLords = TRIKONA.map(
    (h) => SIGN_LORD[((ascendantSign - 1 + h - 1) % 12) + 1],
  );
  const seen = new Set<string>();
  for (const kl of kendraLords) {
    for (const tl of trikonaLords) {
      if (kl === tl) continue;
      const a = findPlanet(planets, kl);
      const b = findPlanet(planets, tl);
      if (a && b && a.sign === b.sign) {
        const key = [kl, tl].sort().join("-");
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          name: "Raja Yoga",
          type: "auspicious",
          description: `A kendra lord (${kl}) and trikona lord (${tl}) conjunct — classical Raja Yoga that elevates social status, authority, and material success during the dashas of either planet.`,
          involves: [kl, tl],
          strength: "strong",
        });
      }
    }
  }

  // Kemadruma Yoga — Moon with no planets in 2nd/12th from it and not joined by any planet (challenging).
  // Classically cancelled if Moon is in a kendra from Lagna — that condition is now actually
  // checked, rather than just mentioned in the description while still always firing.
  if (moon) {
    const sign2 = (moon.sign % 12) + 1;
    const sign12 = ((moon.sign + 10) % 12) + 1;
    const moonSignOccupants = planets.filter(
      (p) => p.name !== "Moon" && p.sign === moon.sign,
    );
    const adjacent = planets.filter(
      (p) => p.name !== "Moon" && (p.sign === sign2 || p.sign === sign12),
    );
    const cancelledByKendra = inKendra(moon);
    if (
      moonSignOccupants.length === 0 &&
      adjacent.length === 0 &&
      !cancelledByKendra
    ) {
      out.push({
        name: "Kemadruma Yoga",
        type: "challenging",
        description:
          "Moon stands isolated with no planets in adjacent signs (2nd/12th from Moon), no conjunction, and Moon is not in a kendra from Lagna — indicates emotional isolation, struggles in early life, and a need for self-reliance.",
        involves: ["Moon"],
        strength: "moderate",
      });
    }
  }

  // Vipreet Raj Yoga (simplified) — 6/8/12 lords in 6/8/12 from each other
  const dustanaHouses = [6, 8, 12];
  const dustanaLords = dustanaHouses.map((h) => ({
    house: h,
    lord: SIGN_LORD[((ascendantSign - 1 + h - 1) % 12) + 1],
  }));
  const vipreetSeen = new Set<string>();
  for (let i = 0; i < dustanaLords.length; i++) {
    for (let j = i + 1; j < dustanaLords.length; j++) {
      const a = findPlanet(planets, dustanaLords[i].lord);
      const b = findPlanet(planets, dustanaLords[j].lord);
      if (
        a &&
        b &&
        dustanaHouses.includes(a.house) &&
        dustanaHouses.includes(b.house)
      ) {
        const key = [dustanaLords[i].lord, dustanaLords[j].lord]
          .sort()
          .join("-");
        if (vipreetSeen.has(key)) continue;
        vipreetSeen.add(key);
        out.push({
          name: "Vipreet Raja Yoga",
          type: "auspicious",
          description: `Dusthana lords (${dustanaLords[i].lord} and ${dustanaLords[j].lord}) sitting in dusthana houses — paradoxically gives rise from adversity. Native overcomes obstacles to achieve unexpected success, often through unconventional paths.`,
          involves: [dustanaLords[i].lord, dustanaLords[j].lord],
          strength: "moderate",
        });
      }
    }
  }

  // Attach classical-text citations where available, so the LLM layer has a verbatim
  // source to build on instead of free-generating an unsourced description.
  for (const yoga of out) {
    const citation = YOGA_CITATIONS[yoga.name];
    if (citation) yoga.citation = citation;
  }

  return out;
}
