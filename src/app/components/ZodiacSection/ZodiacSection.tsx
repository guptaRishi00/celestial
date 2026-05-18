import Image from "next/image";
import { getDailyHoroscopes } from "@/lib/horoscope";
import ZodiacCards from "./ZodiacCards";

const baseSigns = [
  {
    name: "Aries",
    vedic: "Mesha",
    date: "Mar 21 – Apr 19",
    tattva: "Agni",
    icon: "/2.png",
    description:
      "Today brings a surge of fiery energy. Trust your instincts and take the lead on a new project that excites you.",
  },
  {
    name: "Taurus",
    vedic: "Vrishabha",
    date: "Apr 20 – May 20",
    tattva: "Prithvi",
    icon: "/1.png",
    description:
      "Patience is your greatest virtue today. Take time to enjoy the simple pleasures and ground yourself in nature.",
  },
  {
    name: "Gemini",
    vedic: "Mithuna",
    date: "May 21 – Jun 20",
    tattva: "Vayu",
    icon: "/3.png",
    description:
      "Your communication skills are highlighted. Expect interesting conversations that could lead to exciting new ideas.",
  },
  {
    name: "Cancer",
    vedic: "Karka",
    date: "Jun 21 – Jul 22",
    tattva: "Jala",
    icon: "/4.png",
    description:
      "Focus on your emotional well-being today. A quiet evening at home will provide the comfort and clarity you need.",
  },
  {
    name: "Leo",
    vedic: "Simha",
    date: "Jul 23 – Aug 22",
    tattva: "Agni",
    icon: "/1.png",
    description:
      "Your natural charisma shines bright. Step into the spotlight and share your creative vision with those around you.",
  },
  {
    name: "Virgo",
    vedic: "Kanya",
    date: "Aug 23 – Sep 22",
    tattva: "Prithvi",
    icon: "/2.png",
    description:
      "Attention to detail will pay off. Organize your space and thoughts to tackle today's tasks with unmatched efficiency.",
  },
  {
    name: "Libra",
    vedic: "Tula",
    date: "Sep 23 – Oct 22",
    tattva: "Vayu",
    icon: "/3.png",
    description:
      "Balance is key today. Seek harmony in your relationships and don't be afraid to compromise for the greater good.",
  },
  {
    name: "Scorpio",
    vedic: "Vrishchika",
    date: "Oct 23 – Nov 21",
    tattva: "Jala",
    icon: "/4.png",
    description:
      "Your intuition is deeply attuned. Trust your gut feelings regarding a complex situation that requires your focus.",
  },
  {
    name: "Sagittarius",
    vedic: "Dhanu",
    date: "Nov 22 – Dec 21",
    tattva: "Agni",
    icon: "/1.png",
    description:
      "Adventure calls! Embrace spontaneity and be open to learning something entirely new from an unexpected source.",
  },
  {
    name: "Capricorn",
    vedic: "Makara",
    date: "Dec 22 – Jan 19",
    tattva: "Prithvi",
    icon: "/2.png",
    description:
      "Discipline and focus are your allies today. Stay committed to your long-term goals and celebrate small milestones.",
  },
  {
    name: "Aquarius",
    vedic: "Kumbha",
    date: "Jan 20 – Feb 18",
    tattva: "Vayu",
    icon: "/3.png",
    description:
      "Innovation is in the air. Your unique perspective will help solve a lingering problem in a highly unconventional way.",
  },
  {
    name: "Pisces",
    vedic: "Meena",
    date: "Feb 19 – Mar 20",
    tattva: "Jala",
    icon: "/4.png",
    description:
      "Let your imagination flow. Creative pursuits will bring you immense joy and help you process your deepest emotions.",
  },
];

export default async function ZodiacSection() {
  const aiHoroscopes = await getDailyHoroscopes();

  const signs = baseSigns.map((sign) => {
    const aiData = aiHoroscopes?.find(
      (h) => h.name.toLowerCase() === sign.name.toLowerCase(),
    );
    return {
      ...sign,
      description: aiData?.description || sign.description,
    };
  });

  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
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
