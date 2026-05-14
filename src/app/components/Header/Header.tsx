"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportToast, setReportToast] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const { lang, setLang, t } = useLanguage();

  const generateReport = async () => {
    setIsGeneratingReport(true);
    setReportToast(null);
    try {
      const res = await fetch(`/api/report?lang=${lang}`);
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        const data = await res.json().catch(() => null);
        const msg = data?.error || t("chat.reportFailed");
        setReportToast({ message: msg, type: "error" });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="([^"]+)"/);
      a.download = match?.[1] || "Kundali_Report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setReportToast({ message: t("chat.reportSuccess"), type: "success" });
    } catch {
      setReportToast({ message: t("chat.networkError"), type: "error" });
    } finally {
      setIsGeneratingReport(false);
      setTimeout(() => setReportToast(null), 5000);
    }
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => { });
  }, []);

  const initials = user
    ? user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : "";

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-7xl">
      <nav className="relative flex items-center justify-between rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl px-5 py-3 shadow-lg shadow-black/10">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <span className="text-hero-accent text-xl">✦</span>
          <span className="font-voyage text-xl font-bold text-white tracking-wide">
            Celestial
          </span>
        </a>



        {/* Desktop actions */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Generate Report */}
          <button
            type="button"
            onClick={generateReport}
            disabled={isGeneratingReport}
            className="flex items-center gap-1.5 rounded-lg bg-hero-warm/10 border border-hero-warm/30 px-3.5 py-2 text-sm text-hero-warm font-kobe tracking-wide transition-all duration-200 hover:bg-hero-warm/20 disabled:opacity-50"
          >
            {isGeneratingReport ? (
              <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z" clipRule="evenodd" />
              </svg>
            )}
            {t("header.generateReport")}
          </button>

          {/* Chat */}
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
            {t("header.chatWithPanditJi")}
          </a>

          {user ? (
            /* Logged-in: Profile avatar */
            <a
              href="/profile"
              className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 transition-all duration-200 hover:bg-white/10 group"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-hero-accent/40 to-hero-warm/40 flex items-center justify-center">
                <span className="text-[11px] font-voyage font-bold text-white">
                  {initials}
                </span>
              </div>
              <span className="text-sm text-white/70 font-kobe tracking-wide group-hover:text-white">
                {user.name.split(" ")[0]}
              </span>
            </a>
          ) : (
            <>
              {/* Login */}
              <a
                href="/login"
                className="rounded-lg px-4 py-2 text-sm font-bold text-white/80 font-kobe tracking-wide transition-all duration-200 hover:text-white"
              >
                {t("header.logIn")}
              </a>

              {/* Sign Up */}
              <a
                href="/login?mode=signup"
                className="rounded-lg bg-hero-accent px-4 py-2 text-sm font-bold text-inverse-surface font-kobe tracking-wide transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(196,161,255,0.4)] active:scale-95"
              >
                {t("header.signUp")}
              </a>
            </>
          )}

          {/* Language Toggle */}
          <button
            type="button"
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            className="flex items-center justify-center min-w-[48px] px-2 h-9 rounded-lg bg-white/5 border border-white/10 text-sm font-kobe font-bold text-white/80 tracking-wide transition-all duration-200 hover:bg-white/10 hover:text-white"
          >
            {lang === "en" ? "हिं" : "EN"}
          </button>
        </div>

        {/* Mobile actions */}
        <div className="flex sm:hidden items-center gap-2">
          {/* Mobile Language Toggle */}
          <button
            type="button"
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            className="flex items-center justify-center min-w-[40px] px-2 h-9 rounded-lg bg-white/5 border border-white/10 text-xs font-kobe font-bold text-white/80 tracking-wide transition-all duration-200 hover:bg-white/10 hover:text-white"
          >
            {lang === "en" ? "हिं" : "EN"}
          </button>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex flex-col justify-center items-center gap-1.5 w-9 h-9 rounded-lg bg-white/5 border border-white/10 cursor-pointer transition-all duration-200 hover:bg-white/10"
            aria-label="Toggle menu"
          >
            <span
              className={`block w-4.5 h-[2px] bg-white rounded-full transition-all duration-300 origin-center ${open ? "rotate-45 translate-y-[5px]" : ""
                }`}
            />
            <span
              className={`block w-4.5 h-[2px] bg-white rounded-full transition-all duration-300 ${open ? "opacity-0 scale-x-0" : ""
                }`}
            />
            <span
              className={`block w-4.5 h-[2px] bg-white rounded-full transition-all duration-300 origin-center ${open ? "-rotate-45 -translate-y-[5px]" : ""
                }`}
            />
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      <div
        className={`sm:hidden overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-60 opacity-100 mt-2" : "max-h-0 opacity-0 mt-0"
          }`}
      >
        <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl px-5 py-4 shadow-lg shadow-black/10">
          {/* Generate Report */}
          <button
            type="button"
            onClick={() => {
              generateReport();
              setOpen(false);
            }}
            disabled={isGeneratingReport}
            className="flex items-center gap-2 rounded-lg bg-hero-warm/10 border border-hero-warm/30 px-4 py-2.5 text-sm text-hero-warm font-kobe tracking-wide transition-all duration-200 hover:bg-hero-warm/20 disabled:opacity-50 text-left"
          >
            {isGeneratingReport ? (
              <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z" clipRule="evenodd" />
              </svg>
            )}
            {t("header.generateReport")}
          </button>

          {/* Chat */}
          <a
            href="/chat"
            className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white/70 font-kobe tracking-wide transition-all duration-200 hover:bg-white/10 hover:text-white"
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
            {t("header.chatWithPanditJi")}
          </a>

          {user ? (
            /* Logged-in: Profile link */
            <a
              href="/profile"
              className="flex items-center gap-3 rounded-lg px-4 py-2.5 transition-all duration-200 hover:bg-white/5"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-hero-accent/40 to-hero-warm/40 flex items-center justify-center">
                <span className="text-[10px] font-voyage font-bold text-white">
                  {initials}
                </span>
              </div>
              <span className="text-sm text-white/70 font-kobe tracking-wide">
                {t("header.myProfile")}
              </span>
            </a>
          ) : (
            <>
              {/* Login */}
              <a
                href="/login"
                className="rounded-lg px-4 py-2.5 text-sm font-bold text-white/80 font-kobe tracking-wide text-left transition-all duration-200 hover:text-white hover:bg-white/5"
              >
                {t("header.logIn")}
              </a>

              {/* Sign Up */}
              <a
                href="/login?mode=signup"
                className="rounded-lg bg-hero-accent px-4 py-2.5 text-sm font-bold text-inverse-surface font-kobe tracking-wide transition-all duration-300 active:scale-95 text-center"
              >
                {t("header.signUp")}
              </a>
            </>
          )}
        </div>
      </div>

      {/* Report toast notification */}
      {reportToast && (
        <div className={`absolute top-full mt-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl border backdrop-blur-xl text-sm font-kobe tracking-wide shadow-[0_0_30px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-top-2 duration-300 ${
          reportToast.type === "error"
            ? "bg-red-500/10 border-red-500/20 text-red-400"
            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
        }`}>
          {reportToast.message}
        </div>
      )}
    </header>
  );
}
