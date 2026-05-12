import type { PlanetName } from "./constants";

export interface PlanetPosition {
  name: PlanetName;
  sign: number;          // 1..12
  signName: string;
  house: number;         // 1..12
  degreeInSign: number;  // 0..29.999
  longitude: number;     // 0..359.999 (absolute ecliptic)
  nakshatraIndex: number; // 0..26
  nakshatraName: string;
  nakshatraPada: 1 | 2 | 3 | 4;
  nakshatraLord: PlanetName;
  retrograde: boolean;
}

export interface RawChartInput {
  dob: string;            // YYYY-MM-DD
  birthTime: string;      // HH:MM
  birthPlace?: string;
  latitude?: number;
  longitude?: number;
  timezone?: number;      // hours offset, e.g. 5.5
}

export interface DashaPeriod {
  lord: PlanetName;
  startDate: string;      // ISO date
  endDate: string;
  years: number;
  level: 1 | 2 | 3;       // 1=Maha, 2=Antar, 3=Pratyantar
  parent?: PlanetName;    // for antar/pratyantar
}

export interface DashaTimeline {
  current: {
    maha: DashaPeriod;
    antar: DashaPeriod;
    pratyantar?: DashaPeriod;
  };
  upcomingMaha: DashaPeriod[];   // next 2-3 mahadashas
  birthDasha: PlanetName;
}

export interface YogaResult {
  name: string;
  type: "auspicious" | "challenging" | "neutral";
  description: string;
  involves: PlanetName[];
  strength: "strong" | "moderate" | "weak";
}

export interface DoshaResult {
  name: string;
  present: boolean;
  severity: "high" | "moderate" | "mild" | "cancelled" | "none";
  description: string;
  cancellation?: string;
}

export interface AspectInfo {
  from: PlanetName;
  toHouse: number;
  toPlanets: PlanetName[];   // planets sitting in that aspected house
  type: "7th" | "special";
}

export interface TransitInfo {
  date: string;
  planets: PlanetPosition[];
  notable: {
    sadeSati?: { phase: "rising" | "peak" | "setting"; description: string } | null;
    saturnReturn?: boolean;
    jupiterTransitHouse?: number;
    rahuKetuTransit?: { rahuHouse: number; ketuHouse: number };
  };
}

export interface NatalChart {
  version: number;
  computedAt: string;
  input: RawChartInput;
  ascendant: { sign: number; signName: string; degreeInSign: number };
  moonSign: number;
  sunSign: number;
  planets: PlanetPosition[];
  houseLords: Record<number, PlanetName>;
  dashas: DashaTimeline;
  yogas: YogaResult[];
  doshas: DoshaResult[];
  aspects: AspectInfo[];
}

export interface ChartDigest {
  // Compact human-readable digest fed into LLM prompts
  identity: string;       // "Mesha lagna with Moon in Vrishabha (Rohini nakshatra)..."
  planets: string[];      // one-line per planet
  houseSummary: string[]; // one-line per house with lord + occupants
  yogas: string[];
  doshas: string[];
  currentDasha: string;
  notableTransits: string[];
}
