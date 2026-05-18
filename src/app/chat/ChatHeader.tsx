"use client";

import React from "react";
import { useLanguage } from "@/lib/LanguageContext";

export default function ChatHeader() {
  const { t } = useLanguage();

  return (
    <header className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-4 border-b border-white/8">
      <a href="/" className="flex items-center gap-1.5 sm:gap-2">
        {/* <span className="text-hero-accent text-lg sm:text-xl">✦</span> */}
        <span className="font-voyage text-lg sm:text-xl font-bold text-hero-accent tracking-wide">
          Future Dekho
        </span>
      </a>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[10px] sm:text-xs text-white/50 font-kobe tracking-wide">
          {t("chat.panditJiOnline")}
        </span>
      </div>
    </header>
  );
}
