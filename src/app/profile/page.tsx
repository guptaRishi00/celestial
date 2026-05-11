import type { Metadata } from "next";
import Image from "next/image";
import ProfileContent from "./ProfileContent";

export const metadata: Metadata = {
  title: "Your Profile — Celestial",
  description:
    "View your cosmic profile, account details, and astrology consultation history.",
};

export default function ProfilePage() {
  return (
    <main className="relative w-full min-h-screen overflow-hidden">
      {/* ── Background ── */}
      <Image
        src="/night8.png"
        alt="Celestial night sky"
        fill
        priority
        quality={90}
        className="object-cover object-center"
      />

      {/* Dark overlays */}
      <div className="absolute inset-0 bg-black/70" />
      <div className="absolute inset-0 bg-linear-to-b from-black/50 via-transparent to-black/80" />

      {/* ── Top nav ── */}
      <header className="relative z-20 flex items-center justify-between px-6 py-5">
        <a href="/" className="flex items-center gap-2">
          <span className="text-hero-accent text-xl">✦</span>
          <span className="font-voyage text-xl font-bold text-white tracking-wide">
            Celestial
          </span>
        </a>
        <a
          href="/chat"
          className="flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3.5 py-2 text-sm text-white/70 font-kobe tracking-wide transition-all duration-200 hover:bg-white/10 hover:text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path
              fillRule="evenodd"
              d="M3.43 2.524A41.29 41.29 0 0 1 10 2c2.236 0 4.43.18 6.57.524 1.437.231 2.43 1.49 2.43 2.902v5.148c0 1.413-.993 2.67-2.43 2.902a41.102 41.102 0 0 1-3.55.414c-.28.02-.521.18-.643.413l-1.712 3.293a.75.75 0 0 1-1.33 0l-1.713-3.293a.783.783 0 0 0-.642-.413 41.108 41.108 0 0 1-3.55-.414C1.993 13.245 1 11.986 1 10.574V5.426c0-1.413.993-2.67 2.43-2.902Z"
              clipRule="evenodd"
            />
          </svg>
          Chat
        </a>
      </header>

      {/* ── Content ── */}
      <div className="relative z-10 flex items-start justify-center px-4 pt-4 pb-20">
        <ProfileContent />
      </div>
    </main>
  );
}
