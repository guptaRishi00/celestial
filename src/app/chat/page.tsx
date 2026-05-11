import type { Metadata } from "next";
import Image from "next/image";
import ChatInterface from "./ChatInterface";

export const metadata: Metadata = {
  title: "Chat with Pandit Ji — Celestial",
  description:
    "Consult with our experienced Vedic astrologer for personalized kundali readings, horoscope analysis, and cosmic guidance.",
};

export default function ChatPage() {
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
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-black/70" />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col h-screen">
        {/* Header bar */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/8">
          <a href="/" className="flex items-center gap-2">
            <span className="text-hero-accent text-xl">✦</span>
            <span className="font-voyage text-xl font-bold text-white tracking-wide">
              Celestial
            </span>
          </a>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-white/50 font-kobe tracking-wide">
              Pandit Ji is online
            </span>
          </div>
        </header>

        {/* Chat area */}
        <ChatInterface />
      </div>
    </main>
  );
}
