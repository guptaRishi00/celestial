"use client";

import Image from "next/image";
import { useLanguage } from "@/lib/LanguageContext";

export default function DestinySection() {
  const { t } = useLanguage();

  return (
    <section
      id="destiny-section"
      className="relative w-full overflow-hidden py-24 sm:py-32"
    >
      {/* ── Background ── */}
      <Image
        src="/bg2.png"
        alt="Starry background"
        fill
        priority
        quality={90}
        className="object-cover object-center"
      />

      {/* Dark gradient overlay to blend top with Zodiac section */}
      <div className="absolute inset-0 bg-linear-to-b from-black via-transparent to-transparent opacity-80" />

      <div className="relative z-10 mx-auto w-full max-w-4xl px-6 sm:px-10 lg:px-16 flex flex-col items-center text-center">
        {/* ── Badge ── */}
        <span className="mb-5 inline-flex items-center gap-2 w-fit rounded-full border border-white/10 bg-[#0f0e0c]/80 backdrop-blur-md px-4 py-1.5 text-xs tracking-[0.2em] uppercase text-hero-accent font-kobe">
          {t("destiny.badge")}
        </span>

        {/* ── Title ── */}
        <h2 className="font-voyage font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.12] tracking-tight text-white max-w-2xl">
          {t("destiny.titleLine1")}
          <br className="hidden sm:block" />
          {" "}{t("destiny.titleLine2")}
        </h2>

        {/* ── Description ── */}
        <p className="mt-6 sm:mt-8 font-kobe text-sm sm:text-base leading-relaxed text-white/50 max-w-xl">
          {t("destiny.description")}
        </p>

        {/* ── Cards Image ── */}
        <div className="relative mt-12 sm:mt-16 w-full max-w-2xl sm:max-w-3xl lg:max-w-4xl">
          {/* Soft glow behind the cards */}
          <div className="absolute inset-0 translate-y-8 bg-hero-accent/8 blur-3xl rounded-full pointer-events-none" />

          <Image
            src="/cards.png"
            alt="Mystical tarot cards spread"
            width={1000}
            height={700}
            quality={100}
            className="relative w-full h-auto object-contain drop-shadow-[0_8px_40px_rgba(196,161,255,0.15)]"
          />
        </div>
      </div>
    </section>
  );
}
