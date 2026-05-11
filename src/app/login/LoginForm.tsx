"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const defaultMode = searchParams.get("mode") === "signup";

  const [isSignup, setIsSignup] = useState(defaultMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [gender, setGender] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";
      const body = isSignup
        ? { name, email, password, dob, birthTime, birthPlace, gender }
        : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      // Redirect to chat after successful login/signup
      window.location.href = "/chat";
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f0e0c]/95 backdrop-blur-2xl shadow-[0_0_60px_rgba(196,161,255,0.1)] overflow-hidden">
      {/* Decorative top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-hero-accent/60 to-transparent" />

      {/* Header */}
      <div className="px-8 pt-8 pb-4 text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-hero-accent/20 to-hero-warm/20 border border-hero-accent/30 flex items-center justify-center text-2xl mx-auto mb-4 shadow-[0_0_30px_rgba(196,161,255,0.15)]">
          {isSignup ? "✦" : "🙏"}
        </div>
        <h1 className="font-voyage text-2xl font-bold text-white mb-1">
          {isSignup ? "Begin Your Journey" : "Welcome Back"}
        </h1>
        <p className="font-kobe text-sm text-white/40">
          {isSignup
            ? "Create an account to consult with Pandit Ji"
            : "Sign in to continue your cosmic journey"}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-8 pb-8 pt-2 flex flex-col gap-4">
        {isSignup && (
          <>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-name" className="text-xs text-white/40 font-kobe tracking-wide">
                Full Name <span className="text-hero-accent">*</span>
              </label>
              <input
                id="login-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white font-kobe placeholder:text-white/20 outline-none transition-all duration-300 focus:border-hero-accent/40 focus:bg-white/[0.07]"
              />
            </div>

            {/* Birth details section */}
            <div className="mt-1 mb-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-hero-accent text-sm">✧</span>
                <span className="text-xs text-white/30 font-kobe tracking-wider uppercase">
                  Birth Details — for your kundali
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {/* DOB + Gender row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="login-dob" className="text-xs text-white/40 font-kobe tracking-wide">
                      Date of Birth
                    </label>
                    <input
                      id="login-dob"
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white font-kobe outline-none transition-all duration-300 focus:border-hero-accent/40 focus:bg-white/[0.07] [color-scheme:dark]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="login-gender" className="text-xs text-white/40 font-kobe tracking-wide">
                      Gender
                    </label>
                    <select
                      id="login-gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white font-kobe outline-none transition-all duration-300 focus:border-hero-accent/40 focus:bg-white/[0.07] appearance-none cursor-pointer [color-scheme:dark]"
                    >
                      <option value="" className="bg-[#1a1a1a]">Select</option>
                      <option value="Male" className="bg-[#1a1a1a]">Male</option>
                      <option value="Female" className="bg-[#1a1a1a]">Female</option>
                      <option value="Other" className="bg-[#1a1a1a]">Other</option>
                    </select>
                  </div>
                </div>

                {/* Birth time */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="login-birthtime" className="text-xs text-white/40 font-kobe tracking-wide">
                    Birth Time
                  </label>
                  <input
                    id="login-birthtime"
                    type="time"
                    value={birthTime}
                    onChange={(e) => setBirthTime(e.target.value)}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white font-kobe outline-none transition-all duration-300 focus:border-hero-accent/40 focus:bg-white/[0.07] [color-scheme:dark]"
                  />
                </div>

                {/* Birth place */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="login-birthplace" className="text-xs text-white/40 font-kobe tracking-wide">
                    Birth Place
                  </label>
                  <input
                    id="login-birthplace"
                    type="text"
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                    placeholder="e.g., Mumbai, Maharashtra"
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white font-kobe placeholder:text-white/20 outline-none transition-all duration-300 focus:border-hero-accent/40 focus:bg-white/[0.07]"
                  />
                </div>
              </div>

              <p className="text-[11px] text-white/15 font-kobe mt-2 tracking-wide">
                ✦ These details help Pandit Ji read your kundali accurately. You can add them later too.
              </p>
            </div>
          </>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-email" className="text-xs text-white/40 font-kobe tracking-wide">
            Email <span className="text-hero-accent">*</span>
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white font-kobe placeholder:text-white/20 outline-none transition-all duration-300 focus:border-hero-accent/40 focus:bg-white/[0.07]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-password" className="text-xs text-white/40 font-kobe tracking-wide">
            Password <span className="text-hero-accent">*</span>
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white font-kobe placeholder:text-white/20 outline-none transition-all duration-300 focus:border-hero-accent/40 focus:bg-white/[0.07]"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-xs text-red-400 font-kobe">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="mt-1 rounded-xl bg-hero-accent px-6 py-3.5 text-sm font-bold text-inverse-surface font-kobe tracking-wide transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(196,161,255,0.4)] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
        >
          {loading
            ? "Please wait..."
            : isSignup
            ? "Create Account ✦"
            : "Sign In ✦"}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-white/8" />
          <span className="text-[11px] text-white/20 font-kobe tracking-wider uppercase">or</span>
          <div className="flex-1 h-px bg-white/8" />
        </div>

        {/* Toggle */}
        <button
          type="button"
          onClick={() => {
            setIsSignup(!isSignup);
            setError("");
          }}
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3 text-sm text-white/50 font-kobe tracking-wide transition-all duration-200 hover:bg-white/[0.06] hover:text-white/70 cursor-pointer"
        >
          {isSignup
            ? "Already have an account? Sign in"
            : "Don't have an account? Sign up"}
        </button>

        {/* Chat link */}
        <a
          href="/chat"
          className="text-center text-xs text-white/25 font-kobe tracking-wide transition-colors duration-200 hover:text-hero-accent"
        >
          Or chat with Pandit Ji as guest →
        </a>
      </form>
    </div>
  );
}
