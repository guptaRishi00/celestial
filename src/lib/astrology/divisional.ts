import type { PlanetPosition } from "./types";

/**
 * Calculate the Navamsa (D9) sign for a given longitude.
 * Formula: Each sign is 30 degrees, divided into 9 navamsas of 3°20' (3.333... degrees).
 * Navamsas start from different signs depending on the element of the planet's actual sign:
 * - Fire signs (Aries, Leo, Sagittarius): starts from Aries (1)
 * - Earth signs (Taurus, Virgo, Capricorn): starts from Capricorn (10)
 * - Air signs (Gemini, Libra, Aquarius): starts from Libra (7)
 * - Water signs (Cancer, Scorpio, Pisces): starts from Cancer (4)
 */
export function getNavamsaSign(sign: number, degreeInSign: number): number {
  const navamsaIndex = Math.floor(degreeInSign / (30 / 9)); // 0 to 8
  
  let startSign = 1;
  if ([1, 5, 9].includes(sign)) startSign = 1;
  else if ([2, 6, 10].includes(sign)) startSign = 10;
  else if ([3, 7, 11].includes(sign)) startSign = 7;
  else if ([4, 8, 12].includes(sign)) startSign = 4;
  
  const navamsaSign = ((startSign - 1 + navamsaIndex) % 12) + 1;
  return navamsaSign;
}

/**
 * Calculate Dasamamsa (D10) sign for a given longitude.
 * Formula: Each sign is divided into 10 parts of 3°.
 * - If the sign is Odd (Aries, Gemini, Leo, Libra, Sagittarius, Aquarius): starts from the sign itself.
 * - If the sign is Even (Taurus, Cancer, Virgo, Scorpio, Capricorn, Pisces): starts from the 9th sign from it.
 */
export function getDasamamsaSign(sign: number, degreeInSign: number): number {
  const d10Index = Math.floor(degreeInSign / 3); // 0 to 9
  
  let startSign = sign;
  if (sign % 2 === 0) {
    // Even sign
    startSign = ((sign - 1 + 8) % 12) + 1; // 9th sign from it
  }
  
  const d10Sign = ((startSign - 1 + d10Index) % 12) + 1;
  return d10Sign;
}

export interface DivisionalCharts {
  d9: {
    ascendantSign: number;
    planets: PlanetPosition[];
  };
  d10: {
    ascendantSign: number;
    planets: PlanetPosition[];
  };
  moonChart: {
    ascendantSign: number;
    planets: PlanetPosition[];
  };
  chalitChart: {
    ascendantSign: number;
    planets: PlanetPosition[];
  };
}

export function computeDivisionalCharts(planets: PlanetPosition[], ascendantSign: number, ascendantDegree: number): DivisionalCharts {
  // 1. D9 - Navamsa
  const d9Asc = getNavamsaSign(ascendantSign, ascendantDegree);
  const d9Planets = planets.map(p => {
    const d9S = getNavamsaSign(p.sign, p.degreeInSign);
    return { ...p, sign: d9S, house: ((d9S - d9Asc + 12) % 12) + 1 };
  });

  // 2. D10 - Dasamamsa
  const d10Asc = getDasamamsaSign(ascendantSign, ascendantDegree);
  const d10Planets = planets.map(p => {
    const d10S = getDasamamsaSign(p.sign, p.degreeInSign);
    return { ...p, sign: d10S, house: ((d10S - d10Asc + 12) % 12) + 1 };
  });

  // 3. Moon Chart
  const moon = planets.find(p => p.name === "Moon");
  const moonAsc = moon ? moon.sign : ascendantSign;
  const moonPlanets = planets.map(p => {
    return { ...p, house: ((p.sign - moonAsc + 12) % 12) + 1 };
  });

  // 4. Chalit Chart (Bhava Chalit)
  // Re-map the 'sign' to the 'bhavaHouse' so the KundaliChartNorth component renders it based on Bhava instead of Rashi
  // Actually, KundaliChartNorth groups by p.house. So we just update p.house = p.bhavaHouse || p.house
  const chalitPlanets = planets.map(p => {
    const bh = p.bhavaHouse || p.house;
    return { ...p, house: bh };
  });

  return {
    d9: { ascendantSign: d9Asc, planets: d9Planets },
    d10: { ascendantSign: d10Asc, planets: d10Planets },
    moonChart: { ascendantSign: moonAsc, planets: moonPlanets },
    chalitChart: { ascendantSign, planets: chalitPlanets } // ascendantSign remains same, planets shift houses
  };
}
