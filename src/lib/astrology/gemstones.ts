import type { NatalChart } from "./types";
import { PlanetName } from "./constants";

export interface GemstoneInfo {
  planet: PlanetName;
  stone: string;
  hindiName: string;
  metal: string;
  finger: string;
  day: string;
  purpose: string;
}

const GEM_DATA: Record<PlanetName, Omit<GemstoneInfo, 'planet' | 'purpose'>> = {
  Sun: { stone: "Ruby", hindiName: "माणिक (Manik)", metal: "Gold or Copper", finger: "Ring finger", day: "Sunday" },
  Moon: { stone: "Pearl", hindiName: "मोती (Moti)", metal: "Silver", finger: "Little finger", day: "Monday" },
  Mars: { stone: "Red Coral", hindiName: "मूंगा (Moonga)", metal: "Gold or Copper", finger: "Ring finger", day: "Tuesday" },
  Mercury: { stone: "Emerald", hindiName: "पन्ना (Panna)", metal: "Gold or Silver", finger: "Little finger", day: "Wednesday" },
  Jupiter: { stone: "Yellow Sapphire", hindiName: "पुखराज (Pukhraj)", metal: "Gold", finger: "Index finger", day: "Thursday" },
  Venus: { stone: "Diamond / White Sapphire", hindiName: "हीरा / सफेद पुखराज (Heera)", metal: "Silver, Platinum or Gold", finger: "Middle or Ring finger", day: "Friday" },
  Saturn: { stone: "Blue Sapphire", hindiName: "नीलम (Neelam)", metal: "Silver or Iron", finger: "Middle finger", day: "Saturday" },
  Rahu: { stone: "Hessonite", hindiName: "गोमेद (Gomed)", metal: "Silver or Ashtadhatu", finger: "Middle finger", day: "Saturday or Wednesday" },
  Ketu: { stone: "Cat's Eye", hindiName: "लहसुनिया (Lehsuniya)", metal: "Silver or Ashtadhatu", finger: "Middle or Little finger", day: "Tuesday or Saturday" },
};

export interface ChartGemstones {
  lifeStone: GemstoneInfo;
  luckyStone: GemstoneInfo;
  fortuneStone: GemstoneInfo;
  dashaStone: GemstoneInfo;
  rudraksha: string;
}

export function getGemstoneRecommendations(chart: NatalChart): ChartGemstones {
  const lagnaLord = chart.houseLords[1];
  const fifthLord = chart.houseLords[5];
  const ninthLord = chart.houseLords[9];

  const currentDashaLord = chart.dashas.current.maha.lord;
  
  // Rudraksha logic (Simplified: Ascendant Lord based)
  const rudrakshaMap: Record<PlanetName, string> = {
    Sun: "1 Mukhi or 12 Mukhi Rudraksha (For health, confidence, and leadership)",
    Moon: "2 Mukhi Rudraksha (For emotional balance and mental peace)",
    Mars: "3 Mukhi Rudraksha (For energy, courage, and overcoming obstacles)",
    Mercury: "4 Mukhi Rudraksha (For intellect, communication, and learning)",
    Jupiter: "5 Mukhi Rudraksha (For wisdom, health, and spiritual growth)",
    Venus: "6 Mukhi or 13 Mukhi Rudraksha (For harmony, attraction, and arts)",
    Saturn: "7 Mukhi or 14 Mukhi Rudraksha (For discipline, wealth, and removing delays)",
    Rahu: "8 Mukhi Rudraksha (For overcoming sudden obstacles and protection)",
    Ketu: "9 Mukhi Rudraksha (For spiritual elevation and courage)"
  };

  return {
    lifeStone: {
      planet: lagnaLord,
      ...GEM_DATA[lagnaLord],
      purpose: "Life Stone (Lagnesh): Enhances health, vitality, immunity, self-confidence, and overall well-being. It strengthens your core personality and protects against general life struggles."
    },
    luckyStone: {
      planet: fifthLord,
      ...GEM_DATA[fifthLord],
      purpose: "Lucky Stone (Panchamesh): Enhances intelligence, creativity, educational pursuits, and speculative luck. It also brings blessings of children and past-life good karma."
    },
    fortuneStone: {
      planet: ninthLord,
      ...GEM_DATA[ninthLord],
      purpose: "Fortune Stone (Bhagyesh): Enhances luck, fortune, spiritual growth, and higher knowledge. It removes obstacles in life and brings the grace of destiny and gurus."
    },
    dashaStone: {
      planet: currentDashaLord,
      ...GEM_DATA[currentDashaLord],
      purpose: `Dasha Stone: Your current Mahadasha is of ${currentDashaLord}. Wearing this stone during this period can help harness the positive energies of the dasha lord.`
    },
    rudraksha: rudrakshaMap[lagnaLord]
  };
}
