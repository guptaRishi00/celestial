"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";

const tattvaColors: Record<string, string> = {
  Prithvi: "text-emerald-400",
  Agni: "text-orange-400",
  Vayu: "text-sky-400",
  Jala: "text-blue-400",
};

interface ZodiacCardProps {
  signs: {
    name: string;
    vedic: string;
    date: string;
    tattva: string;
    icon: string;
    description: string;
  }[];
  today: string;
}

export default function ZodiacCards({ signs, today }: ZodiacCardProps) {
  const { t, lang } = useLanguage();

  return (
    <div className="relative z-10 mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-16">
      {/* ── Section Header ── */}
      <div className="flex flex-col items-center text-center gap-5 mb-16 sm:mb-20">
        <span className="inline-flex items-center gap-2 w-fit rounded-full border border-white/10 bg-white/5 backdrop-blur-md px-4 py-1.5 text-xs tracking-[0.2em] uppercase text-hero-accent font-kobe">
          {t("zodiac.badge")}
        </span>

        <h2 className="font-voyage font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight text-white max-w-2xl">
          {t("zodiac.titleLine1")}
          <br />
          {t("zodiac.titleLine2")}
        </h2>

        <p className="font-kobe text-sm font-medium text-hero-accent tracking-widest uppercase">
          {today}
        </p>

        <p className="font-kobe text-base sm:text-lg leading-relaxed text-white/50 max-w-lg mt-2">
          {t("zodiac.subtitle")}
        </p>
      </div>

      {/* ── Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {signs.map((sign) => {
          const signNameKey = `sign.${sign.name}` as any;
          const tattvaKey = `tattva.${sign.tattva}` as any;

          return (
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
                  alt={`${sign.name} rashi symbol`}
                  width={96}
                  height={96}
                  quality={90}
                  sizes="(min-width: 640px) 96px, 80px"
                  className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(196,161,255,0.15)]"
                />
              </div>

              {/* Name & Date */}
              <div className="flex flex-col gap-1.5">
                <h3 className="font-voyage text-2xl font-bold text-white tracking-wide">
                  {lang === "hi" ? t(signNameKey) : sign.vedic}
                </h3>
                <span className="font-kobe text-xs text-white/60 tracking-wide">
                  {t(signNameKey)}
                </span>
                <span className="font-kobe text-xs text-white/40 tracking-widest uppercase">
                  {sign.date}
                </span>
              </div>

              {/* Element tag */}
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-kobe tracking-[0.15em] uppercase ${tattvaColors[sign.tattva]}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {t(tattvaKey)} {t("zodiac.tattva")}
              </span>

              {/* Description */}
              <p className="font-kobe text-sm leading-relaxed text-white/45">
                {sign.description}
              </p>

              {/* CTA */}
              <span className="mt-auto font-kobe text-xs tracking-widest uppercase text-hero-accent/70 transition-all duration-300 group-hover:text-hero-accent">
                {t("zodiac.readMore")}
              </span>
            </Link>
          );
        })}
      </div>

      {/* ── Bottom CTA ── */}
      <div className="flex justify-center mt-14 sm:mt-16">
        <Link
          href={"/chat"}
          type="button"
          className="rounded-full border border-white/15 bg-white/5 backdrop-blur-sm px-8 py-3.5 text-sm font-bold tracking-wide text-white font-kobe transition-all duration-300 hover:bg-white/10 hover:border-white/25 active:scale-95 cursor-pointer"
        >
          {t("zodiac.getDetailedReading")}
        </Link>
      </div>
    </div>
  );
}
