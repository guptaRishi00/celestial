"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import {
  createPaymentOrder,
  openRazorpayCheckout,
  verifyRazorpayPayment,
} from "@/lib/razorpay";

interface HeaderUser {
  id: string;
  name: string;
  email: string;
  chatTokens: number;
  unlockedReports?: string[];
}

type IconProps = { className?: string };

// ── Icon set (Heroicons, inline so no runtime dependency) ──
function IconSparkle({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576L4.04 12.72a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 9.462 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5Z" />
    </svg>
  );
}

function IconReport({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M5.625 1.5H9a3.75 3.75 0 0 1 3.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 0 1 3.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 0 1-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875Zm6 16.5v-3a.75.75 0 0 0-1.5 0v3a.75.75 0 0 0 1.5 0Zm2.25-6.75a.75.75 0 0 0-.75.75v6a.75.75 0 0 0 1.5 0v-6a.75.75 0 0 0-.75-.75Zm-4.5 3.75a.75.75 0 0 0-1.5 0v2.25a.75.75 0 0 0 1.5 0v-2.25Z" />
      <path d="M14.25 5.25a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963A5.23 5.23 0 0 0 16.5 7.5h-1.875a.375.375 0 0 1-.375-.375V5.25Z" />
    </svg>
  );
}

function IconChat({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 0 0-1.032-.211 50.89 50.89 0 0 0-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 0 0 2.433 3.984L7.28 21.53A.75.75 0 0 1 6 21v-4.03a48.527 48.527 0 0 1-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.98Z" />
      <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 0 0 1.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0 0 15.75 7.5Z" />
    </svg>
  );
}

function IconUser({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" />
    </svg>
  );
}

function IconChevron({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" />
    </svg>
  );
}

function IconLogin({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" />
      <path d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-.943a.75.75 0 1 0-1.004-1.114l-2.5 2.25a.75.75 0 0 0 0 1.114l2.5 2.25a.75.75 0 1 0 1.004-1.114l-1.048-.943h9.546A.75.75 0 0 0 19 10Z" />
    </svg>
  );
}

function IconSpinner({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<HeaderUser | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportToast, setReportToast] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);
  const { lang, setLang, t } = useLanguage();

  const downloadReport = async (unlockId?: string | null) => {
    const params = new URLSearchParams({ lang });
    if (unlockId) params.set("unlockId", unlockId);

    const res = await fetch(`/api/report?${params.toString()}`);
    if (!res.ok) {
      if (res.status === 401) {
        window.location.href = "/login";
        throw new Error(t("chat.reportSignIn"));
      }
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || t("chat.reportFailed"));
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
  };

  const generateReport = async () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    setIsGeneratingReport(true);
    setReportToast(null);
    try {
      const order = await createPaymentOrder("report", 10);
      const checkoutResponse = await openRazorpayCheckout({
        order,
        name: "Future Dekho",
        description: "Detailed Kundli Report",
      });
      const verification = await verifyRazorpayPayment(
        checkoutResponse,
        "report",
        user.id,
      );

      setUser((prev) =>
        prev
          ? {
              ...prev,
              unlockedReports:
                verification.unlockedReports || prev.unlockedReports,
            }
          : prev,
      );
      await downloadReport(verification.reportUnlockId);
      setReportToast({ message: t("chat.reportSuccess"), type: "success" });
    } catch (error) {
      setReportToast({
        message:
          error instanceof Error ? error.message : t("chat.networkError"),
        type: "error",
      });
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
      .catch(() => {});
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
      <nav className="relative flex items-center justify-between overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.09] to-white/[0.02] px-4 py-2.5 shadow-[0_10px_36px_-10px_rgba(0,0,0,0.65)] backdrop-blur-2xl sm:px-5 sm:py-3">
        {/* Glass sheen — thin highlight along the top edge */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
        />
        {/* Logo — full detailed icon is the favicon/app-icon; here it's cropped to its
            central star so the mark stays legible at header size */}
        <a href="/" className="flex items-center gap-2.5">
          <span className="relative block h-9 w-9 shrink-0 overflow-hidden rounded-[10px] shadow-[0_0_16px_-4px_rgba(196,161,255,0.6)] ring-1 ring-inset ring-white/12">
            <Image
              src="/logo.png"
              alt="Future Dekho"
              width={66}
              height={66}
              priority
              className="absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
            />
          </span>
          <span className="font-voyage text-lg font-bold tracking-wide text-hero-accent sm:text-xl">
            Future Dekho
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
              <svg
                aria-hidden="true"
                className="w-4 h-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-90"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z"
                  clipRule="evenodd"
                />
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
              aria-hidden="true"
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
            aria-label="Toggle language"
            className="flex h-10 min-w-[40px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] px-2 text-xs font-bold tracking-wide text-white/80 transition-colors duration-200 hover:bg-white/10 hover:text-white"
          >
            {lang === "en" ? "हिं" : "EN"}
          </button>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex h-10 w-10 cursor-pointer flex-col items-center justify-center gap-[5px] rounded-xl border border-white/10 bg-white/[0.06] transition-colors duration-200 hover:bg-white/10"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <span
              className={`block h-[2px] w-[18px] origin-center rounded-full bg-white transition-all duration-300 ${
                open ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`block h-[2px] w-[18px] rounded-full bg-white transition-all duration-300 ${
                open ? "scale-x-0 opacity-0" : ""
              }`}
            />
            <span
              className={`block h-[2px] w-[18px] origin-center rounded-full bg-white transition-all duration-300 ${
                open ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      <div
        className={`sm:hidden overflow-hidden transition-all duration-300 ease-out ${
          open ? "max-h-[38rem] opacity-100 mt-2.5" : "max-h-0 opacity-0 mt-0"
        }`}
      >
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#17111f]/95 to-[#0c0912]/95 p-3 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.75)] backdrop-blur-2xl">
          {/* Glass sheen — accent highlight along the top edge */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-hero-accent/40 to-transparent"
          />

          <div className="flex flex-col gap-2">
            {/* Kundli Report */}
            <button
              type="button"
              onClick={() => {
                generateReport();
                setOpen(false);
              }}
              disabled={isGeneratingReport}
              className="group flex items-center gap-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-2.5 text-left transition-colors duration-200 hover:bg-white/[0.06] disabled:opacity-50"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-hero-warm/25 to-amber-200/5 text-hero-warm ring-1 ring-inset ring-hero-warm/20">
                {isGeneratingReport ? (
                  <IconSpinner className="h-5 w-5 animate-spin" />
                ) : (
                  <IconReport className="h-[22px] w-[22px]" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-kobe text-[15px] font-semibold tracking-wide text-white">
                  {t("header.generateReport")}
                </span>
                <span className="mt-0.5 block font-kobe text-xs text-white/45">
                  {t("header.reportSubtitle")}
                </span>
              </span>
              <IconChevron className="h-5 w-5 shrink-0 text-white/25 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-white/55" />
            </button>

            {/* Chat with Pandit Ji */}
            <a
              href="/chat"
              onClick={() => setOpen(false)}
              className="group flex items-center gap-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-2.5 transition-colors duration-200 hover:bg-white/[0.06]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-hero-accent/25 to-hero-cool/10 text-hero-accent ring-1 ring-inset ring-hero-accent/20">
                <IconChat className="h-[22px] w-[22px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-kobe text-[15px] font-semibold tracking-wide text-white">
                  {t("header.chatWithPanditJi")}
                </span>
                <span className="mt-0.5 block font-kobe text-xs text-white/45">
                  {t("header.chatSubtitle")}
                </span>
              </span>
              <IconChevron className="h-5 w-5 shrink-0 text-white/25 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-white/55" />
            </a>

            {/* Divider */}
            <div className="my-1 flex items-center gap-3 px-1">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
              <IconSparkle className="h-3 w-3 text-white/20" />
              <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
            </div>

            {user ? (
              /* Logged-in: Profile card */
              <a
                href="/profile"
                onClick={() => setOpen(false)}
                className="group flex items-center gap-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-2.5 transition-colors duration-200 hover:bg-white/[0.06]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-hero-cool/25 to-hero-accent/10 ring-1 ring-inset ring-hero-cool/20">
                  <span className="font-voyage text-xs font-bold text-white">
                    {initials || (
                      <IconUser className="h-5 w-5 text-hero-cool" />
                    )}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-kobe text-[15px] font-semibold tracking-wide text-white">
                    {user.name.split(" ")[0]}
                  </span>
                  <span className="mt-0.5 block font-kobe text-xs text-white/45">
                    {t("header.profileSubtitle")}
                  </span>
                </span>
                <IconChevron className="h-5 w-5 shrink-0 text-white/25 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-white/55" />
              </a>
            ) : (
              <>
                <p className="px-1.5 font-kobe text-xs text-white/40">
                  {t("header.menuAuthPrompt")}
                </p>
                <div className="flex gap-2.5">
                  {/* Login */}
                  <a
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.05] font-kobe text-sm font-bold tracking-wide text-white/85 transition-colors duration-200 hover:bg-white/10 hover:text-white"
                  >
                    <IconLogin className="h-4 w-4" />
                    {t("header.logIn")}
                  </a>

                  {/* Sign Up */}
                  <a
                    href="/login?mode=signup"
                    onClick={() => setOpen(false)}
                    className="flex h-12 flex-[1.4] items-center justify-center rounded-2xl bg-gradient-to-r from-hero-accent to-[#a983ff] font-kobe text-sm font-bold tracking-wide text-inverse-surface shadow-[0_6px_22px_-6px_rgba(196,161,255,0.7)] transition-transform duration-200 active:scale-[0.98]"
                  >
                    {t("header.signUp")}
                  </a>
                </div>
              </>
            )}

            {/* Trust footer */}
            <div className="mt-1.5 flex items-center justify-center gap-1.5 font-kobe text-[11px] tracking-wide text-white/35">
              <IconSparkle className="h-3 w-3 text-hero-accent/60" />
              {t("header.menuTrust")}
            </div>
          </div>
        </div>
      </div>

      {/* Report toast notification */}
      {reportToast && (
        <div
          className={`absolute top-full mt-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl border backdrop-blur-xl text-sm font-kobe tracking-wide shadow-[0_0_30px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-top-2 duration-300 ${
            reportToast.type === "error"
              ? "bg-red-500/10 border-red-500/20 text-red-400"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          }`}
        >
          {reportToast.message}
        </div>
      )}
    </header>
  );
}
