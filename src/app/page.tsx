import { Suspense } from "react";
import Header from "./components/Header/Header";
import HeroSection from "./components/HeroSection/HeroSection";
import ZodiacSection from "./components/ZodiacSection/ZodiacSection";
import DestinySection from "./components/DestinySection/DestinySection";
import { GlobeDemo } from "./components/globe/GlobeDemo";
import Footer from "./components/Footer/Footer";

function ZodiacLoading() {
  return (
    <section className="relative w-full overflow-hidden py-24 sm:py-32">
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-16">
        <div className="flex flex-col items-center text-center gap-5 mb-16 sm:mb-20">
          <span className="inline-flex items-center gap-2 w-fit rounded-full border border-white/10 bg-white/5 backdrop-blur-md px-4 py-1.5 text-xs tracking-[0.2em] uppercase text-hero-accent font-kobe">
            ✦ Daily Guidance
          </span>
          <h2 className="font-voyage font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight text-white max-w-2xl">
            Your Daily<br />Horoscope
          </h2>
          <p className="font-kobe text-base sm:text-lg leading-relaxed text-white/50 max-w-lg mt-2">
            Loading today&apos;s cosmic insights...
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center gap-5 rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-sm p-7 pb-8 animate-pulse"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/5" />
              <div className="flex flex-col gap-2 w-full items-center">
                <div className="h-6 w-24 bg-white/5 rounded" />
                <div className="h-3 w-16 bg-white/5 rounded" />
              </div>
              <div className="h-3 w-20 bg-white/5 rounded-full" />
              <div className="flex flex-col gap-1.5 w-full">
                <div className="h-3 w-full bg-white/5 rounded" />
                <div className="h-3 w-3/4 bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="w-full">
      <Header />
      <HeroSection />
      <Suspense fallback={<ZodiacLoading />}>
        <ZodiacSection />
      </Suspense>
      <DestinySection />
      <GlobeDemo />
      <Footer />
    </main>
  );
}
