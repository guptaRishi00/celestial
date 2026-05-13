import type { AyanamshaKey } from "./types";

export const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

export const SIGNS_VEDIC = [
  "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
  "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena",
] as const;

export type SignIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type PlanetName =
  | "Sun" | "Moon" | "Mars" | "Mercury" | "Jupiter"
  | "Venus" | "Saturn" | "Rahu" | "Ketu";

export const PLANETS_VEDIC: Record<PlanetName, string> = {
  Sun: "Surya", Moon: "Chandra", Mars: "Mangal", Mercury: "Budha",
  Jupiter: "Guru", Venus: "Shukra", Saturn: "Shani", Rahu: "Rahu", Ketu: "Ketu",
};

// Sign rulers (1-indexed)
export const SIGN_LORD: Record<number, PlanetName> = {
  1: "Mars", 2: "Venus", 3: "Mercury", 4: "Moon", 5: "Sun", 6: "Mercury",
  7: "Venus", 8: "Mars", 9: "Jupiter", 10: "Saturn", 11: "Saturn", 12: "Jupiter",
};

// Sign of exaltation for each planet (1-indexed)
export const EXALTATION: Partial<Record<PlanetName, number>> = {
  Sun: 1, Moon: 2, Mars: 10, Mercury: 6, Jupiter: 4, Venus: 12, Saturn: 7,
};

export const DEBILITATION: Partial<Record<PlanetName, number>> = {
  Sun: 7, Moon: 8, Mars: 4, Mercury: 12, Jupiter: 10, Venus: 6, Saturn: 1,
};

// Own signs
export const OWN_SIGNS: Partial<Record<PlanetName, number[]>> = {
  Sun: [5], Moon: [4], Mars: [1, 8], Mercury: [3, 6],
  Jupiter: [9, 12], Venus: [2, 7], Saturn: [10, 11],
};

// Mooltrikona signs
export const MOOLTRIKONA: Partial<Record<PlanetName, number>> = {
  Sun: 5, Moon: 2, Mars: 1, Mercury: 6, Jupiter: 9, Venus: 7, Saturn: 11,
};

// 27 Nakshatras with ruling planet (Vimshottari dasha lord)
export const NAKSHATRAS = [
  { name: "Ashwini",          lord: "Ketu"    as PlanetName, deity: "Ashwini Kumaras" },
  { name: "Bharani",          lord: "Venus"   as PlanetName, deity: "Yama" },
  { name: "Krittika",         lord: "Sun"     as PlanetName, deity: "Agni" },
  { name: "Rohini",           lord: "Moon"    as PlanetName, deity: "Brahma" },
  { name: "Mrigashira",       lord: "Mars"    as PlanetName, deity: "Soma" },
  { name: "Ardra",            lord: "Rahu"    as PlanetName, deity: "Rudra" },
  { name: "Punarvasu",        lord: "Jupiter" as PlanetName, deity: "Aditi" },
  { name: "Pushya",           lord: "Saturn"  as PlanetName, deity: "Brihaspati" },
  { name: "Ashlesha",         lord: "Mercury" as PlanetName, deity: "Nagas" },
  { name: "Magha",            lord: "Ketu"    as PlanetName, deity: "Pitrs" },
  { name: "Purva Phalguni",   lord: "Venus"   as PlanetName, deity: "Bhaga" },
  { name: "Uttara Phalguni",  lord: "Sun"     as PlanetName, deity: "Aryaman" },
  { name: "Hasta",            lord: "Moon"    as PlanetName, deity: "Savitr" },
  { name: "Chitra",           lord: "Mars"    as PlanetName, deity: "Tvashtr" },
  { name: "Swati",            lord: "Rahu"    as PlanetName, deity: "Vayu" },
  { name: "Vishakha",         lord: "Jupiter" as PlanetName, deity: "Indra-Agni" },
  { name: "Anuradha",         lord: "Saturn"  as PlanetName, deity: "Mitra" },
  { name: "Jyeshtha",         lord: "Mercury" as PlanetName, deity: "Indra" },
  { name: "Mula",             lord: "Ketu"    as PlanetName, deity: "Nirrti" },
  { name: "Purva Ashadha",    lord: "Venus"   as PlanetName, deity: "Apas" },
  { name: "Uttara Ashadha",   lord: "Sun"     as PlanetName, deity: "Vishvedevas" },
  { name: "Shravana",         lord: "Moon"    as PlanetName, deity: "Vishnu" },
  { name: "Dhanishta",        lord: "Mars"    as PlanetName, deity: "Vasus" },
  { name: "Shatabhisha",      lord: "Rahu"    as PlanetName, deity: "Varuna" },
  { name: "Purva Bhadrapada", lord: "Jupiter" as PlanetName, deity: "Aja Ekapada" },
  { name: "Uttara Bhadrapada",lord: "Saturn"  as PlanetName, deity: "Ahir Budhnya" },
  { name: "Revati",           lord: "Mercury" as PlanetName, deity: "Pushan" },
] as const;

// Vimshottari Dasha years per planet (total = 120)
export const DASHA_YEARS: Record<PlanetName, number> = {
  Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7,
  Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17,
};

// Dasha sequence in Vimshottari order
export const DASHA_SEQUENCE: PlanetName[] = [
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
];

// Drishti (aspects) — houses aspected from a planet's position (counted forward incl. self+offset)
// All planets aspect the 7th from themselves. Mars/Jupiter/Saturn have special aspects.
export const SPECIAL_ASPECTS: Partial<Record<PlanetName, number[]>> = {
  Mars: [4, 7, 8],
  Jupiter: [5, 7, 9],
  Saturn: [3, 7, 10],
  Rahu: [5, 7, 9],
  Ketu: [5, 7, 9],
};

// Friendships (natural) — simplified
export const NATURAL_FRIENDS: Record<PlanetName, PlanetName[]> = {
  Sun: ["Moon", "Mars", "Jupiter"],
  Moon: ["Sun", "Mercury"],
  Mars: ["Sun", "Moon", "Jupiter"],
  Mercury: ["Sun", "Venus"],
  Jupiter: ["Sun", "Moon", "Mars"],
  Venus: ["Mercury", "Saturn"],
  Saturn: ["Mercury", "Venus"],
  Rahu: ["Venus", "Saturn"],
  Ketu: ["Mars", "Venus"],
};

export const NATURAL_ENEMIES: Record<PlanetName, PlanetName[]> = {
  Sun: ["Venus", "Saturn"],
  Moon: [],
  Mars: ["Mercury"],
  Mercury: ["Moon"],
  Jupiter: ["Mercury", "Venus"],
  Venus: ["Sun", "Moon"],
  Saturn: ["Sun", "Moon", "Mars"],
  Rahu: ["Sun", "Moon", "Mars"],
  Ketu: ["Sun", "Moon"],
};

// House significations (what each house represents)
export const HOUSE_MEANINGS: Record<number, string> = {
  1: "Self, personality, body, vitality, life direction (Tanu Bhava)",
  2: "Wealth, family, speech, food, accumulated assets (Dhana Bhava)",
  3: "Siblings, courage, short journeys, communication (Sahaja Bhava)",
  4: "Mother, home, property, vehicles, emotional foundation (Sukha Bhava)",
  5: "Children, intelligence, creativity, education, past-life merit (Putra Bhava)",
  6: "Enemies, disease, debts, service, daily struggles (Ari Bhava)",
  7: "Marriage, partnerships, business, spouse, public dealings (Yuvati/Kalatra Bhava)",
  8: "Longevity, transformation, inheritance, hidden matters, occult (Ayur Bhava)",
  9: "Father, dharma, fortune, higher learning, long journeys, guru (Bhagya Bhava)",
  10: "Career, status, profession, reputation, authority (Karma Bhava)",
  11: "Gains, income, friends, elder siblings, desires fulfilled (Labha Bhava)",
  12: "Losses, expenses, moksha, foreign lands, hidden enemies, isolation (Vyaya Bhava)",
};

// Which houses are most relevant for which life topic
export const TOPIC_HOUSES: Record<string, number[]> = {
  career: [10, 6, 2, 11, 1],
  marriage: [7, 2, 5, 11, 8],
  health: [1, 6, 8, 12],
  wealth: [2, 11, 5, 9],
  education: [4, 5, 9],
  family: [2, 4, 9],
  children: [5, 9, 11],
  travel: [3, 9, 12],
  spirituality: [9, 12, 5, 8],
  property: [4, 11],
  litigation: [6, 8, 12],
  general: [1, 5, 9, 10],
};

export const TOPIC_PLANETS: Record<string, PlanetName[]> = {
  career: ["Sun", "Saturn", "Mercury", "Mars"],
  marriage: ["Venus", "Jupiter", "Mars", "Moon"],
  health: ["Sun", "Mars", "Saturn"],
  wealth: ["Jupiter", "Venus", "Mercury"],
  education: ["Mercury", "Jupiter"],
  family: ["Moon", "Jupiter", "Venus"],
  children: ["Jupiter"],
  travel: ["Moon", "Mercury", "Rahu"],
  spirituality: ["Jupiter", "Ketu", "Saturn"],
  property: ["Mars", "Moon"],
  litigation: ["Mars", "Saturn"],
  general: ["Sun", "Moon", "Jupiter"],
};

// Kendra (angular) and Trikona (trinal) houses
export const KENDRA = [1, 4, 7, 10];
export const TRIKONA = [1, 5, 9];
export const DUSTHANA = [6, 8, 12];
export const UPACHAYA = [3, 6, 10, 11];

// Supported Ayanamsha systems → Swiss Ephemeris constant + display label + fallback API name
export const AYANAMSHA_MAP: Record<AyanamshaKey, { swephId: number; label: string; apiName: string }> = {
  lahiri:         { swephId: 1,  label: "Lahiri (Chitrapaksha)",  apiName: "lahiri" },
  raman:          { swephId: 3,  label: "B.V. Raman",            apiName: "raman" },
  krishnamurti:   { swephId: 5,  label: "KP (Krishnamurti)",     apiName: "krishnamurti" },
  yukteshwar:     { swephId: 7,  label: "Sri Yukteshwar",        apiName: "yukteshwar" },
  fagan_bradley:  { swephId: 0,  label: "Fagan-Bradley",         apiName: "fagan" },
  true_citra:     { swephId: 27, label: "True Chitra (Spica)",   apiName: "lahiri" },
  true_revati:    { swephId: 28, label: "True Revati (ζ Piscium)", apiName: "lahiri" },
};
