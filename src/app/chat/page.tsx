import type { Metadata } from "next";
import Image from "next/image";
import ChatInterface from "./ChatInterface";
import ChatHeader from "./ChatHeader";

export const metadata: Metadata = {
  title: "Chat with Pandit Ji — Celestial",
  description:
    "Consult with our experienced Vedic astrologer for personalized kundali readings, horoscope analysis, and cosmic guidance.",
};

export default function ChatPage() {
  return (
    <main className="relative w-full min-h-screen overflow-hidden bg-black">

      {/* ── Content ── */}
      {/* h-[100dvh] (dynamic viewport height) handles mobile Safari/Chrome's
          collapsing URL bar correctly. Falls back to h-screen on older browsers. */}
      <div className="relative z-10 flex flex-col h-screen h-[100dvh]">
        {/* Header bar */}
        <ChatHeader />

        {/* Chat area */}
        <ChatInterface />
      </div>
    </main>
  );
}
