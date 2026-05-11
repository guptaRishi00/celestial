import type { Metadata } from "next";
import Image from "next/image";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign In — Celestial",
  description:
    "Sign in or create an account to access personalized kundali readings and consultations with our Vedic astrologer.",
};

export default function LoginPage() {
  return (
    <main className="relative w-full min-h-screen overflow-hidden flex items-center justify-center">
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

      {/* ── Back to home ── */}
      <a
        href="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white/40 font-kobe text-sm tracking-wide transition-colors duration-200 hover:text-white"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4"
        >
          <path
            fillRule="evenodd"
            d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
            clipRule="evenodd"
          />
        </svg>
        Back to Home
      </a>

      {/* ── Login Card ── */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <LoginForm />
      </div>
    </main>
  );
}
