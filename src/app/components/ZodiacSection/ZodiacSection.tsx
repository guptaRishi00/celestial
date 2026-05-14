import Image from "next/image";
import { getDailyHoroscopes } from "@/lib/horoscope";
import ZodiacCards from "./ZodiacCards";

const baseSigns = [
  {
    name: "Aries",
    vedic: "Mesha",
    date: "Apr 14 – May 14",
    tattva: "Agni",
    icon: "/2.png",
    description: "Today brings a surge of fiery energy. Trust your instincts and take the lead on a new project that excites you.",
  },
  {
    name: "Taurus",
    vedic: "Vrishabha",
    date: "May 15 – Jun 14",
    tattva: "Prithvi",
    icon: "/1.png",
    description: "Patience is your greatest virtue today. Take time to enjoy the simple pleasures and ground yourself in nature.",
  },
  {
    name: "Gemini",
    vedic: "Mithuna",
    date: "Jun 15 – Jul 14",
    tattva: "Vayu",
    icon: "/3.png",
    description: "Your communication skills are highlighted. Expect interesting conversations that could lead to exciting new ideas.",
  },
  {
    name: "Cancer",
    vedic: "Karka",
    date: "Jul 15 – Aug 14",
    tattva: "Jala",
    icon: "/4.png",
    description: "Focus on your emotional well-being today. A quiet evening at home will provide the comfort and clarity you need.",
  },
  {
    name: "Leo",
    vedic: "Simha",
    date: "Aug 15 – Sep 15",
    tattva: "Agni",
    icon: "/1.png",
    description: "Your natural charisma shines bright. Step into the spotlight and share your creative vision with those around you.",
  },
  {
    name: "Virgo",
    vedic: "Kanya",
    date: "Sep 16 – Oct 15",
    tattva: "Prithvi",
    icon: "/2.png",
    description: "Attention to detail will pay off. Organize your space and thoughts to tackle today's tasks with unmatched efficiency.",
  },
  {
    name: "Libra",
    vedic: "Tula",
    date: "Oct 16 – Nov 14",
    tattva: "Vayu",
    icon: "/3.png",
    description: "Balance is key today. Seek harmony in your relationships and don't be afraid to compromise for the greater good.",
  },
  {
    name: "Scorpio",
    vedic: "Vrishchika",
    date: "Nov 15 – Dec 14",
    tattva: "Jala",
    icon: "/4.png",
    description: "Your intuition is deeply attuned. Trust your gut feelings regarding a complex situation that requires your focus.",
  },
  {
    name: "Sagittarius",
    vedic: "Dhanu",
    date: "Dec 15 – Jan 13",
    tattva: "Agni",
    icon: "/1.png",
    description: "Adventure calls! Embrace spontaneity and be open to learning something entirely new from an unexpected source.",
  },
  {
    name: "Capricorn",
    vedic: "Makara",
    date: "Jan 14 – Feb 12",
    tattva: "Prithvi",
    icon: "/2.png",
    description: "Discipline and focus are your allies today. Stay committed to your long-term goals and celebrate small milestones.",
  },
  {
    name: "Aquarius",
    vedic: "Kumbha",
    date: "Feb 13 – Mar 13",
    tattva: "Vayu",
    icon: "/3.png",
    description: "Innovation is in the air. Your unique perspective will help solve a lingering problem in a highly unconventional way.",
  },
  {
    name: "Pisces",
    vedic: "Meena",
    date: "Mar 14 – Apr 13",
    tattva: "Jala",
    icon: "/4.png",
    description: "Let your imagination flow. Creative pursuits will bring you immense joy and help you process your deepest emotions.",
  },
];

export default async function ZodiacSection() {
  const aiHoroscopes = await getDailyHoroscopes();
  
  const signs = baseSigns.map(sign => {
    const aiData = aiHoroscopes?.find(h => h.name.toLowerCase() === sign.name.toLowerCase());
    return {
      ...sign,
      description: aiData?.description || sign.description
    };
  });

  const today = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  return (
    <section
      id="zodiac-section"
      className="relative w-full overflow-hidden py-24 sm:py-32"
    >
      {/* ── Background ── */}
      <Image
        src="/bg2.png"
        alt="Starry background for zodiac section"
        fill
        priority
        quality={90}
        className="object-cover object-center"
      />

      {/* Dark gradient overlay — bottom */}
      <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent" />

      <ZodiacCards signs={signs} today={today} />
    </section>
  );
}
