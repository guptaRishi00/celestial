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
    <main className="relative w-full min-h-screen overflow-hidden bg-black">

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col h-screen">
        {/* Header bar */}
        <header className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-4 border-b border-white/8">
          <a href="/" className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-hero-accent text-lg sm:text-xl">✦</span>
            <span className="font-voyage text-lg sm:text-xl font-bold text-white tracking-wide">
              Celestial
            </span>
          </a>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] sm:text-xs text-white/50 font-kobe tracking-wide">
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
