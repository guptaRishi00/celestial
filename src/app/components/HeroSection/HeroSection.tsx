
import Image from "next/image";

export default function HeroSection() {
  return (
    <section
      id="hero-section"
      className="relative w-full min-h-screen overflow-hidden flex items-center"
    >
      {/* ── Background ── */}
      <Image
        src="/night8.png"
        alt="Celestial night sky with zodiac symbols"
        fill
        priority
        quality={90}
        className="object-cover object-center"
      />

      {/* Dark gradient overlay — left */}
      <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/40 to-transparent" />

      {/* Dark gradient overlay — bottom */}
      <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent" />

      {/* ── Content Grid ── */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-16 pt-36 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">

        {/* ── Left: Text Column ── */}
        <div className="flex flex-col gap-7 max-w-xl">
          {/* Badge */}
          <span className="inline-flex items-center gap-2 w-fit rounded-full border border-white/20 bg-white/5 backdrop-blur-md px-4 py-1.5 text-xs tracking-[0.2em] uppercase text-hero-accent font-kobe">
            ✦ Celestial Guidance
          </span>

          {/* Title */}
          <h1 className="font-voyage font-bold text-5xl sm:text-6xl lg:text-7xl leading-[1.08] tracking-tight text-white">
            Unlock the
            <br />
            <span className="">
              Stars Within
            </span>
          </h1>

          {/* Description */}
          <p className="font-kobe text-base sm:text-lg leading-relaxed text-white/70 max-w-md">
            Discover the cosmic blueprint written in your birth chart. Our
            expert astrologers blend ancient wisdom with modern insight to
            illuminate your path, relationships, and destiny.
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap gap-4 mt-1">
            <a
              href="/chat"
              className="rounded-full bg-hero-accent px-7 py-3 text-sm font-bold tracking-wide text-inverse-surface font-kobe transition-all duration-300 hover:scale-105 hover:shadow-[0_0_28px_rgba(196,161,255,0.45)] active:scale-95 cursor-pointer"
            >
              Get Your Reading
            </a>
            <a
              href="#zodiac-section"
              className="rounded-full border border-white/25 bg-white/5 backdrop-blur-sm px-7 py-3 text-sm font-bold tracking-wide text-white font-kobe transition-all duration-300 hover:bg-white/15 hover:border-white/40 active:scale-95 cursor-pointer"
            >
              Explore Signs
            </a>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex -space-x-2">
              <span className="inline-block w-7 h-7 rounded-full bg-hero-accent ring-2 ring-black/40" />
              <span className="inline-block w-7 h-7 rounded-full bg-hero-warm ring-2 ring-black/40" />
              <span className="inline-block w-7 h-7 rounded-full bg-hero-cool ring-2 ring-black/40" />
            </div>
            <span className="text-xs text-white/50 font-kobe tracking-wide">
              2,400+ readings delivered this month
            </span>
          </div>
        </div>

        {/* ── Right: Image Composition ── */}
        <div className="flex items-center justify-center lg:justify-end">
          <div className="relative w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] lg:w-[520px] lg:h-[520px]">
            {/* Pulsing glow ring */}
            <div className="absolute inset-[-12%] rounded-full bg-linear-to-br  blur-3xl" />

            {/* Zodiac Wheel — slow continuous spin */}
            <Image
              src="/zodiac.png"
              alt="Zodiac wheel chart"
              width={520}
              height={520}
              quality={100}
              className="absolute inset-0 w-full h-full object-contain animate-spin-slow"
            />

            {/* Taurus layered on top — gentle float */}
            <Image
              src="/taurus.png"
              alt="Taurus zodiac illustration"
              width={340}
              height={380}
              quality={90}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[62%] h-auto object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
