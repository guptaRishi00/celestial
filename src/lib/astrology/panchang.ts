import { NAKSHATRAS, SIGNS_VEDIC } from "./constants";

export const TITHIS = [
  "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi",
  "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi",
  "Trayodashi", "Chaturdashi", "Purnima", // Shukla Paksha
  "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi",
  "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi",
  "Trayodashi", "Chaturdashi", "Amavasya" // Krishna Paksha
];

export const VARAS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

export const YOGAS = [
  "Vishkumbha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda",
  "Sukarma", "Dhriti", "Shoola", "Ganda", "Vriddhi", "Dhruva", "Vyaghata",
  "Harshana", "Vajra", "Siddhi", "Vyatipata", "Variyana", "Parigha", "Shiva",
  "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti"
];

export const KARANAS = [
  "Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti", // Repeating
  "Shakuni", "Chatushpada", "Naga", "Kintughna" // Fixed
];

// Reference tables for Avakahada
export const YONIS = [
  "Ashwa", "Gaja", "Mesha", "Sarpa", "Shwan", "Marjara", "Mesha", "Shwan",
  "Marjara", "Mushaka", "Mushaka", "Gau", "Mahisha", "Vyaghra", "Mahisha",
  "Vyaghra", "Mriga", "Mriga", "Shwan", "Vanara", "Nakula", "Vanara",
  "Simha", "Ashwa", "Simha", "Gau", "Gaja"
];

export const GANAS = [
  "Deva", "Manushya", "Rakshasa", "Manushya", "Deva", "Manushya", "Deva", "Deva",
  "Rakshasa", "Rakshasa", "Manushya", "Manushya", "Deva", "Rakshasa", "Deva",
  "Rakshasa", "Deva", "Rakshasa", "Rakshasa", "Manushya", "Manushya", "Deva",
  "Rakshasa", "Rakshasa", "Manushya", "Manushya", "Deva"
];

export const NADIS = [
  "Aadi", "Madhya", "Antya", "Antya", "Madhya", "Aadi", "Aadi", "Madhya", "Antya",
  "Antya", "Madhya", "Aadi", "Aadi", "Madhya", "Antya", "Antya", "Madhya", "Aadi",
  "Aadi", "Madhya", "Antya", "Antya", "Madhya", "Aadi", "Aadi", "Madhya", "Antya"
];

export const VARNAS = [
  "Kshatriya", "Vaishya", "Shudra", "Brahmin", // Repeating for 12 signs
  "Kshatriya", "Vaishya", "Shudra", "Brahmin",
  "Kshatriya", "Vaishya", "Shudra", "Brahmin"
];

export const VASHYAS = [
  "Chatushpada", "Chatushpada", "Manushya", "Jalachara", "Vanachara", "Manushya",
  "Manushya", "Keeta", "Chatushpada", "Chatushpada", "Manushya", "Jalachara"
];

export const TARA_NAMES = [
  "Janma", "Sampat", "Vipat", "Kshema", "Pratyari", "Sadhaka", "Vadha", "Mitra", "Ati Mitra"
];

export function computePanchangAndAvakahada(
  sunLon: number,
  moonLon: number,
  ascLon: number,
  date: Date
) {
  // 1. Tithi
  let tithiDiff = moonLon - sunLon;
  if (tithiDiff < 0) tithiDiff += 360;
  const tithiIndex = Math.floor(tithiDiff / 12);
  const tithiLeftPercent = 1 - ((tithiDiff % 12) / 12);

  // 2. Vara
  const varaIndex = date.getUTCDay(); // Approximation: usually calculated based on sunrise, but UTC day is a decent fallback if exact local sunrise isn't available

  // 3. Nakshatra
  const nakshatraDiff = moonLon;
  const nakshatraIndex = Math.floor(nakshatraDiff / (360 / 27));
  const nakshatraLeftPercent = 1 - ((nakshatraDiff % (360 / 27)) / (360 / 27));

  // 4. Yoga
  let yogaSum = sunLon + moonLon;
  if (yogaSum >= 360) yogaSum -= 360;
  const yogaIndex = Math.floor(yogaSum / (360 / 27));
  const yogaLeftPercent = 1 - ((yogaSum % (360 / 27)) / (360 / 27));

  // 5. Karana
  let karanaIndex = 0;
  const karanaDiff = tithiDiff;
  const rawKarana = Math.floor(karanaDiff / 6);
  if (rawKarana === 0) karanaIndex = 10; // Kintughna
  else if (rawKarana >= 58) {
    if (rawKarana === 58) karanaIndex = 7; // Shakuni
    if (rawKarana === 59) karanaIndex = 8; // Chatushpada
    if (rawKarana === 60) karanaIndex = 9; // Naga
  } else {
    karanaIndex = (rawKarana - 1) % 7;
  }
  const karanaLeftPercent = 1 - ((karanaDiff % 6) / 6);

  // Avakahada Chakra calculations
  const moonSignIndex = Math.floor(moonLon / 30);
  const nakshatraPada = Math.floor((moonLon % (360 / 27)) / (360 / 108)) + 1;

  // Nama Akshar (First letter of name based on Nakshatra Pada)
  // Simplified for this implementation. A full implementation requires a mapping of 108 sounds.
  const nameAlphabet = "A"; 
  
  // Paya (based on Nakshatra distance from Sun)
  const payaIndex = Math.floor(tithiDiff / 90);
  const payas = ["Gold", "Silver", "Copper", "Iron"];

  return {
    panchang: {
      tithi: { index: tithiIndex, name: TITHIS[tithiIndex], leftPercent: tithiLeftPercent },
      vara: { index: varaIndex, name: VARAS[varaIndex] },
      nakshatra: { index: nakshatraIndex, name: NAKSHATRAS[nakshatraIndex].name, leftPercent: nakshatraLeftPercent },
      yoga: { index: yogaIndex, name: YOGAS[yogaIndex], leftPercent: yogaLeftPercent },
      karana: { index: karanaIndex, name: KARANAS[karanaIndex], leftPercent: karanaLeftPercent }
    },
    avakahada: {
      varna: VARNAS[moonSignIndex],
      vashya: VASHYAS[moonSignIndex],
      tara: TARA_NAMES[nakshatraIndex % 9], // simplified
      yoni: YONIS[nakshatraIndex],
      grahaMaitri: "Neutral", // simplified
      gana: GANAS[nakshatraIndex],
      bhakoot: SIGNS_VEDIC[moonSignIndex],
      nadi: NADIS[nakshatraIndex],
      nadiPada: ["Aadi", "Madhya", "Antya"][nakshatraPada - 1] || "Aadi",
      nameAlphabet: nameAlphabet,
      paya: payas[payaIndex]
    }
  };
}
