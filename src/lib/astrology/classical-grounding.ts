import type { PlanetName } from "./constants";

/**
 * Curated, verbatim-cited excerpts from the classical Jyotisha canon, extracted
 * directly from primary-text translations (Bṛhat Parāśara Horā Śāstra, Sārāvalī).
 * Source files: ../../../vedic-knowledge-base/texts/{bphs,saravali1}.txt
 *
 * Purpose: give the LLM layer (reasoning.ts, persona.ts, interpretations.ts) real
 * citations to build on instead of pure free-generation. Every string here is a
 * direct or lightly-trimmed quote with a chapter:verse reference — do not paraphrase
 * when adding entries; the citation is only meaningful if it's verifiable against
 * the source file.
 */

export interface FunctionalNature {
  benefics: PlanetName[];
  malefics: PlanetName[];
  neutral: PlanetName[];
  yogakarakas: PlanetName[]; // rules a kendra AND a trikona — the strongest functional benefic
  note: string; // verbatim-derived summary of BPHS 34.x for this lagna
  citation: string;
}

/**
 * BPHS Chapter 34, verses 19-44 — functional benefic/malefic/yogakaraka per ascendant.
 * Extracted verbatim from bphs.txt lines 3250-3300. ascSign is 1=Aries..12=Pisces.
 */
export const FUNCTIONAL_NATURE: Record<number, FunctionalNature> = {
  1: {
    // Aries
    benefics: ["Jupiter", "Sun"],
    malefics: ["Saturn", "Mercury", "Venus"],
    neutral: [],
    yogakarakas: [],
    note: "Śani, Budh and Śukr are malefics. Auspicious are Guru and Sūrya. Śukr is a direct (independent) killer.",
    citation: "BPHS 34.19-22",
  },
  2: {
    // Taurus
    benefics: ["Saturn", "Sun"],
    malefics: ["Jupiter", "Venus", "Moon"],
    neutral: ["Mercury"],
    yogakarakas: ["Saturn"],
    note: "Guru, Śukr and Candr are malefics. Śani and Sūrya are auspicious. Śani will cause Raj Yog. Budh is somewhat inauspicious.",
    citation: "BPHS 34.23-24",
  },
  3: {
    // Gemini
    benefics: ["Venus"],
    malefics: ["Mars", "Jupiter", "Sun"],
    neutral: [],
    yogakarakas: [],
    note: "Mangal, Guru and Sūrya are malefics, while Śukr is the only auspicious Grah. Candr is the prime killer.",
    citation: "BPHS 34.25-26",
  },
  4: {
    // Cancer
    benefics: ["Mars", "Jupiter", "Moon"],
    malefics: ["Venus", "Mercury"],
    neutral: [],
    yogakarakas: ["Mars"],
    note: "Śukr and Budh are malefics, Mangal, Guru and Candr are auspicious. Mangal is capable of conferring a full-fledged Yog.",
    citation: "BPHS 34.27-28",
  },
  5: {
    // Leo
    benefics: ["Mars", "Jupiter", "Sun"],
    malefics: ["Mercury", "Venus", "Saturn"],
    neutral: [],
    yogakarakas: [],
    note: "Budh, Śukr and Śani are malefics. Auspicious effects will be given by Mangal, Guru and Sūrya.",
    citation: "BPHS 34.29-30",
  },
  6: {
    // Virgo
    benefics: ["Mercury", "Venus"],
    malefics: ["Mars", "Jupiter", "Moon"],
    neutral: ["Sun"],
    yogakarakas: [],
    note: "Mangal, Guru and Candr are malefics, while Budh and Śukr are auspicious. Śukr's Yuti with Budh will produce Yog. Śukr is a killer as well.",
    citation: "BPHS 34.31-32",
  },
  7: {
    // Libra
    benefics: ["Saturn", "Mercury"],
    malefics: ["Jupiter", "Sun", "Mars"],
    neutral: ["Venus"],
    yogakarakas: ["Saturn"],
    note: "Guru, Sūrya and Mangal are malefics. Auspicious are Śani and Budh. Candr and Budh will cause Raj Yog. Śukr is neutral.",
    citation: "BPHS 34.33-34",
  },
  8: {
    // Scorpio
    benefics: ["Jupiter", "Moon"],
    malefics: ["Venus", "Mercury", "Saturn"],
    neutral: ["Mars"],
    yogakarakas: [],
    note: "Śukr, Budh and Śani are malefics. Guru and Candr are auspicious. Sūrya, as well as Candr, are Yog Karakas.",
    citation: "BPHS 34.35-36",
  },
  9: {
    // Sagittarius
    benefics: ["Mars", "Sun"],
    malefics: ["Venus"],
    neutral: ["Jupiter"],
    yogakarakas: [],
    note: "Only Śukr is inauspicious. Mangal and Sūrya are auspicious. Sūrya and Budh are capable of conferring a Yog.",
    citation: "BPHS 34.37-38",
  },
  10: {
    // Capricorn
    benefics: ["Venus", "Mercury"],
    malefics: ["Mars", "Jupiter", "Moon"],
    neutral: ["Sun"],
    yogakarakas: ["Venus"],
    note: "Mangal, Guru and Candr are malefics, Śukr and Budh are auspicious. Only Śukr is capable of causing a superior Yog.",
    citation: "BPHS 34.39-40",
  },
  11: {
    // Aquarius
    benefics: ["Venus", "Saturn"],
    malefics: ["Jupiter", "Moon", "Mars"],
    neutral: ["Mercury"],
    yogakarakas: ["Venus"],
    note: "Guru, Candr and Mangal are malefics, while Śukr and Śani are auspicious. Śukr is the only Grah that causes Raj Yog.",
    citation: "BPHS 34.41-42",
  },
  12: {
    // Pisces
    benefics: ["Mars", "Moon"],
    malefics: ["Saturn", "Venus", "Sun", "Mercury"],
    neutral: [],
    yogakarakas: ["Mars"],
    note: "Śani, Śukr, Sūrya and Budh are malefics. Mangal and Candr are auspicious. Mangal and Guru will cause a Yog.",
    citation: "BPHS 34.43-44",
  },
};

/** True classical yogakaraka test: rules both a kendra (1,4,7,10) and a trikona (1,5,9) from Lagna. */
export function isYogakaraka(ascSign: number, planet: PlanetName): boolean {
  return FUNCTIONAL_NATURE[ascSign]?.yogakarakas.includes(planet) ?? false;
}

export function isFunctionalMalefic(
  ascSign: number,
  planet: PlanetName,
): boolean {
  return FUNCTIONAL_NATURE[ascSign]?.malefics.includes(planet) ?? false;
}

export function isFunctionalBenefic(
  ascSign: number,
  planet: PlanetName,
): boolean {
  return FUNCTIONAL_NATURE[ascSign]?.benefics.includes(planet) ?? false;
}

/** Verbatim classical citations for the yogas yogas.ts detects — grounding text for LLM prompts. */
export const YOGA_CITATIONS: Record<string, string> = {
  "Raja Yoga":
    'BPHS 34.2-7: "The Lord of Lagn is specially auspicious, as Lagn is a Kendr, as well as a Kon." A kendra-lord and trikona-lord joining is the classical mechanism for Raja Yoga.',
  "Neecha Bhanga Raja Yoga":
    "Classical Neecha Bhanga doctrine (multiple conditions recognized, e.g. dispositor of the debilitated planet in kendra from Lagna/Moon) — a debilitated planet whose affliction is cancelled becomes a paradoxically strong Raja Yoga.",
  "Budha-Aditya Yoga":
    "Sun-Mercury conjunction — classical Budha-Aditya Yoga, associated with sharp intellect and articulate communication.",
  "Gajakesari Yoga":
    "Jupiter in kendra (1st/4th/7th/10th) from the Moon — classical Gajakesari Yoga, associated with intelligence, fame, and a virtuous reputation.",
  "Vipreet Raja Yoga":
    "Dusthana lords (6th/8th/12th) placed in dusthana houses from each other — classical doctrine names three variants (Harsha: 6th lord in 8th/12th; Sarala: 8th lord in 6th/12th; Vimala: 12th lord in 6th/8th), each producing rise from adversity.",
};

/** BPHS 57.24-27½ / 28-29 — Venus antardasha within Saturn Mahadasha, favorable and afflicted cases. */
export const DASHA_ANTARDASHA_NOTES: Partial<
  Record<PlanetName, Partial<Record<PlanetName, string>>>
> = {
  Saturn: {
    Venus:
      'BPHS 57.24-27½: favorable results (marriage, wealth, honours) come "if Śukr is in a Kendr, Trikon, or in Labh... If during the period of Antar Dasha of Śukr Guru is favourable in transit, there will be dawn of fortune." BPHS 57.28-29 warns of "distress to wife, loss of position, mental agony" if Śukr is combust or in a dusthana — check both conditions against the actual chart before writing this period up.',
  },
};
