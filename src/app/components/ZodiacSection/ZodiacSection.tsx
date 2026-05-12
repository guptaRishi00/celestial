import Image from "next/image";
import Link from "next/link";
import { getDailyHoroscopes } from "@/lib/horoscope";

const baseSigns = [
  {
    name: "Aries",
    date: "Mar 21 – Apr 19",
    element: "Fire",
    icon: "/2.png",
    description: "Today brings a surge of fiery energy. Trust your instincts and take the lead on a new project that excites you.",
  },
  {
    name: "Taurus",
    date: "Apr 20 – May 20",
    element: "Earth",
    icon: "/1.png",
    description: "Patience is your greatest virtue today. Take time to enjoy the simple pleasures and ground yourself in nature.",
  },
  {
    name: "Gemini",
    date: "May 21 – Jun 20",
    element: "Air",
    icon: "/3.png",
    description: "Your communication skills are highlighted. Expect interesting conversations that could lead to exciting new ideas.",
  },
  {
    name: "Cancer",
    date: "Jun 21 – Jul 22",
    element: "Water",
    icon: "/4.png",
    description: "Focus on your emotional well-being today. A quiet evening at home will provide the comfort and clarity you need.",
  },
  {
    name: "Leo",
    date: "Jul 23 – Aug 22",
    element: "Fire",
    icon: "/1.png",
    description: "Your natural charisma shines bright. Step into the spotlight and share your creative vision with those around you.",
  },
  {
    name: "Virgo",
    date: "Aug 23 – Sep 22",
    element: "Earth",
    icon: "/2.png",
    description: "Attention to detail will pay off. Organize your space and thoughts to tackle today's tasks with unmatched efficiency.",
  },
  {
    name: "Libra",
    date: "Sep 23 – Oct 22",
    element: "Air",
    icon: "/3.png",
    description: "Balance is key today. Seek harmony in your relationships and don't be afraid to compromise for the greater good.",
  },
  {
    name: "Scorpio",
    date: "Oct 23 – Nov 21",
    element: "Water",
    icon: "/4.png",
    description: "Your intuition is deeply attuned. Trust your gut feelings regarding a complex situation that requires your focus.",
  },
  {
    name: "Sagittarius",
    date: "Nov 22 – Dec 21",
    element: "Fire",
    icon: "/1.png",
    description: "Adventure calls! Embrace spontaneity and be open to learning something entirely new from an unexpected source.",
  },
  {
    name: "Capricorn",
    date: "Dec 22 – Jan 19",
    element: "Earth",
    icon: "/2.png",
    description: "Discipline and focus are your allies today. Stay committed to your long-term goals and celebrate small milestones.",
  },
  {
    name: "Aquarius",
    date: "Jan 20 – Feb 18",
    element: "Air",
    icon: "/3.png",
    description: "Innovation is in the air. Your unique perspective will help solve a lingering problem in a highly unconventional way.",
  },
  {
    name: "Pisces",
    date: "Feb 19 – Mar 20",
    element: "Water",
    icon: "/4.png",
    description: "Let your imagination flow. Creative pursuits will bring you immense joy and help you process your deepest emotions.",
  },
];

const elementColors: Record<string, string> = {
  Earth: "text-emerald-400",
  Fire: "text-orange-400",
  Air: "text-sky-400",
  Water: "text-blue-400",
};

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

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-16">
        {/* ── Section Header ── */}
        <div className="flex flex-col items-center text-center gap-5 mb-16 sm:mb-20">
          <span className="inline-flex items-center gap-2 w-fit rounded-full border border-white/10 bg-white/5 backdrop-blur-md px-4 py-1.5 text-xs tracking-[0.2em] uppercase text-hero-accent font-kobe">
            ✦ Daily Guidance
          </span>

          <h2 className="font-voyage font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight text-white max-w-2xl">
            Your Daily
            <br />
            Horoscope
          </h2>

          <p className="font-kobe text-sm font-medium text-hero-accent tracking-widest uppercase">
            {today}
          </p>

          <p className="font-kobe text-base sm:text-lg leading-relaxed text-white/50 max-w-lg mt-2">
            Consult the stars to navigate your day. Here are your personalized cosmic insights based on the current planetary alignments.
          </p>
        </div>

        {/* ── Cards Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {signs.map((sign) => (
            <Link
              key={sign.name}
              href={`/horoscope/${sign.name.toLowerCase()}`}
              className="group relative flex flex-col items-center text-center gap-5 rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-sm p-7 pb-8 transition-all duration-500 hover:bg-white/[0.07] hover:border-white/15 hover:shadow-[0_0_40px_rgba(196,161,255,0.08)] hover:-translate-y-1 block cursor-pointer"
            >
              {/* Glow on hover */}
              <div className="absolute inset-0 rounded-2xl bg-hero-accent/0 group-hover:bg-hero-accent/[0.04] transition-all duration-500 pointer-events-none" />

              {/* Icon */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 transition-transform duration-500 group-hover:scale-110">
                <Image
                  src={sign.icon}
                  alt={`${sign.name} zodiac symbol`}
                  width={96}
                  height={96}
                  quality={90}
                  className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(196,161,255,0.15)]"
                />
              </div>

              {/* Name & Date */}
              <div className="flex flex-col gap-1.5">
                <h3 className="font-voyage text-2xl font-bold text-white tracking-wide">
                  {sign.name}
                </h3>
                <span className="font-kobe text-xs text-white/40 tracking-widest uppercase">
                  {sign.date}
                </span>
              </div>

              {/* Element tag */}
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-kobe tracking-[0.15em] uppercase ${elementColors[sign.element]}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {sign.element}
              </span>

              {/* Description */}
              <p className="font-kobe text-sm leading-relaxed text-white/45">
                {sign.description}
              </p>

              {/* CTA */}
              <span 
                className="mt-auto font-kobe text-xs tracking-widest uppercase text-hero-accent/70 transition-all duration-300 group-hover:text-hero-accent"
              >
                Read More →
              </span>
            </Link>
          ))}
        </div>

        {/* ── Bottom CTA ── */}
        <div className="flex justify-center mt-14 sm:mt-16">
          <button
            type="button"
            className="rounded-full border border-white/15 bg-white/5 backdrop-blur-sm px-8 py-3.5 text-sm font-bold tracking-wide text-white font-kobe transition-all duration-300 hover:bg-white/10 hover:border-white/25 active:scale-95 cursor-pointer"
          >
            Get Detailed Reading
          </button>
        </div>
      </div>
    </section>
  );
}
