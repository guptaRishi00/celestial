"use client";

import { Eye, EyeOff } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";

interface LoginModalProps {
  onClose: () => void;
  onSuccess: (user: {
    id: string;
    name: string;
    email: string;
    chatTokens: number;
    unlockedReports?: string[];
  }) => void;
}

export default function LoginModal({ onClose, onSuccess }: LoginModalProps) {
  const [isSignup, setIsSignup] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [gender, setGender] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { t } = useLanguage();

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

      onSuccess(data.user);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-400">
        <div className="rounded-2xl border border-white/10 bg-[#0f0e0c]/95 backdrop-blur-2xl shadow-[0_0_60px_rgba(196,161,255,0.1)] overflow-hidden">
          {/* Decorative top glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-hero-accent/60 to-transparent" />

          {/* Header */}
          <div className="px-8 pt-8 pb-4 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-hero-accent/20 to-hero-warm/20 border border-hero-accent/30 flex items-center justify-center text-2xl mx-auto mb-4 shadow-[0_0_30px_rgba(196,161,255,0.15)]">
              🙏
            </div>
            <h2 className="font-voyage text-2xl font-bold text-white mb-1">
              {isSignup ? t("login.joinTitle") : t("login.welcomeBack")}
            </h2>
            <p className="font-kobe text-sm text-white/40">
              {isSignup ? t("login.joinDesc") : t("login.signInDesc")}
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="px-8 pb-8 pt-2 flex flex-col gap-4"
          >
            {isSignup && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="modal-name"
                    className="text-xs text-white/40 font-kobe tracking-wide"
                  >
                    {t("login.fullName")}{" "}
                    <span className="text-hero-accent">*</span>
                  </label>
                  <input
                    id="modal-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("login.enterName")}
                    required
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white font-kobe placeholder:text-white/20 outline-none transition-all duration-300 focus:border-hero-accent/40 focus:bg-white/[0.07]"
                  />
                </div>

                {/* Birth details */}
                <div className="mt-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-hero-accent text-sm">✧</span>
                    <span className="text-xs text-white/30 font-kobe tracking-wider uppercase">
                      {t("login.birthDetails")}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="modal-dob"
                          className="text-xs text-white/40 font-kobe tracking-wide"
                        >
                          {t("login.dateOfBirth")}
                        </label>
                        <input
                          id="modal-dob"
                          type="date"
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white font-kobe outline-none transition-all duration-300 focus:border-hero-accent/40 focus:bg-white/[0.07] [color-scheme:dark]"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="modal-gender"
                          className="text-xs text-white/40 font-kobe tracking-wide"
                        >
                          {t("login.gender")}
                        </label>
                        <select
                          id="modal-gender"
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white font-kobe outline-none transition-all duration-300 focus:border-hero-accent/40 focus:bg-white/[0.07] appearance-none cursor-pointer [color-scheme:dark]"
                        >
                          <option value="" className="bg-[#1a1a1a]">
                            {t("login.select")}
                          </option>
                          <option value="Male" className="bg-[#1a1a1a]">
                            {t("login.male")}
                          </option>
                          <option value="Female" className="bg-[#1a1a1a]">
                            {t("login.female")}
                          </option>
                          <option value="Other" className="bg-[#1a1a1a]">
                            {t("login.other")}
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="modal-birthtime"
                        className="text-xs text-white/40 font-kobe tracking-wide"
                      >
                        {t("login.birthTime")}
                      </label>
                      <input
                        id="modal-birthtime"
                        type="time"
                        value={birthTime}
                        onChange={(e) => setBirthTime(e.target.value)}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white font-kobe outline-none transition-all duration-300 focus:border-hero-accent/40 focus:bg-white/[0.07] [color-scheme:dark]"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="modal-birthplace"
                        className="text-xs text-white/40 font-kobe tracking-wide"
                      >
                        {t("login.birthPlace")}
                      </label>
                      <input
                        id="modal-birthplace"
                        type="text"
                        value={birthPlace}
                        onChange={(e) => setBirthPlace(e.target.value)}
                        placeholder={t("login.birthPlacePlaceholder")}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white font-kobe placeholder:text-white/20 outline-none transition-all duration-300 focus:border-hero-accent/40 focus:bg-white/[0.07]"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-white/15 font-kobe mt-2 tracking-wide">
                    {t("login.optionalNote")}
                  </p>
                </div>
              </>
            )}

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="modal-email"
                className="text-xs text-white/40 font-kobe tracking-wide"
              >
                {t("login.email")} <span className="text-hero-accent">*</span>
              </label>
              <input
                id="modal-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white font-kobe placeholder:text-white/20 outline-none transition-all duration-300 focus:border-hero-accent/40 focus:bg-white/[0.07]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="modal-password"
                className="text-xs text-white/40 font-kobe tracking-wide"
              >
                {t("login.password")}{" "}
                <span className="text-hero-accent">*</span>
              </label>
              <div className="relative">
                <input
                  id="modal-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-10 text-sm text-white font-kobe placeholder:text-white/20 outline-none transition-all duration-300 focus:border-hero-accent/40 focus:bg-white/[0.07]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
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
                ? t("login.pleaseWait")
                : isSignup
                  ? t("login.createAccount")
                  : t("login.signInBtn")}
            </button>

            {/* Toggle */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError("");
                }}
                className="text-xs text-white/30 font-kobe tracking-wide transition-colors duration-200 hover:text-hero-accent cursor-pointer"
              >
                {isSignup
                  ? t("login.alreadyHaveAccount")
                  : t("login.dontHaveAccount")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
