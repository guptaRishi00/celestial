"use client";

import React, { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  dob: string | null;
  birthTime: string | null;
  birthPlace: string | null;
  gender: string | null;
  createdAt: string | null;
}

export default function ProfileContent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Editable fields
  const [editName, setEditName] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editBirthTime, setEditBirthTime] = useState("");
  const [editBirthPlace, setEditBirthPlace] = useState("");
  const [editGender, setEditGender] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setEditName(data.user.name || "");
          setEditDob(data.user.dob || "");
          setEditBirthTime(data.user.birthTime || "");
          setEditBirthPlace(data.user.birthPlace || "");
          setEditGender(data.user.gender || "");
        } else {
          window.location.href = "/login";
        }
      })
      .catch(() => {
        window.location.href = "/login";
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage("");
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          dob: editDob,
          birthTime: editBirthTime,
          birthPlace: editBirthPlace,
          gender: editGender,
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser((prev) => (prev ? { ...prev, ...data.user } : prev));
        setEditing(false);
        setSaveMessage("Profile updated successfully! ✦");
        setTimeout(() => setSaveMessage(""), 3000);
      }
    } catch {
      setSaveMessage("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-lg flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-hero-accent/30 border-t-hero-accent animate-spin" />
          <span className="text-sm text-white/30 font-kobe tracking-wide">
            Loading your cosmic profile...
          </span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Not set";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return "Not set";
    try {
      const [h, m] = timeStr.split(":");
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      const h12 = hour % 12 || 12;
      return `${h12}:${m} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="w-full max-w-lg flex flex-col gap-6">
      {/* Success message */}
      {saveMessage && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-400 font-kobe text-center animate-in fade-in slide-in-from-top-2 duration-300">
          {saveMessage}
        </div>
      )}

      {/* ── Profile Card ── */}
      <div className="rounded-2xl border border-white/10 bg-[#0f0e0c]/90 backdrop-blur-2xl shadow-[0_0_60px_rgba(196,161,255,0.08)] overflow-hidden">
        {/* Top accent bar */}
        <div className="h-24 bg-gradient-to-r from-hero-accent/20 via-hero-warm/15 to-hero-cool/20 relative">
          <div className="absolute inset-0 bg-[url('/night8.png')] bg-cover bg-center opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0f0e0c]/90" />
        </div>

        {/* Avatar + Name */}
        <div className="px-8 -mt-10 relative flex items-end justify-between">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-hero-accent/40 to-hero-warm/40 border-4 border-[#0f0e0c] flex items-center justify-center shadow-[0_0_30px_rgba(196,161,255,0.2)]">
            <span className="font-voyage text-2xl font-bold text-white">
              {initials}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setEditing(!editing)}
            className="mb-2 flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white/50 font-kobe tracking-wide transition-all duration-200 hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="w-3 h-3"
            >
              <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.262a1.75 1.75 0 0 0 0-2.474Z" />
              <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0 1 14 9v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
            </svg>
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>

        <div className="px-8 pt-4 pb-8 flex flex-col gap-6">
          {/* Name & Email */}
          <div>
            {editing ? (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-name" className="text-xs text-white/40 font-kobe tracking-wide">Name</label>
                <input
                  id="edit-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white font-kobe outline-none transition-all duration-300 focus:border-hero-accent/40 focus:bg-white/[0.07]"
                />
              </div>
            ) : (
              <>
                <h1 className="font-voyage text-2xl font-bold text-white">
                  {user.name}
                </h1>
                <p className="font-kobe text-sm text-white/40 mt-0.5">
                  {user.email}
                </p>
              </>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-white/[0.03] border border-white/6 p-4 flex flex-col gap-1.5">
              <span className="text-[11px] text-white/25 font-kobe tracking-wider uppercase">
                Member Since
              </span>
              <span className="text-sm text-white/70 font-kobe">
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
                  : "Recently"}
              </span>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/6 p-4 flex flex-col gap-1.5">
              <span className="text-[11px] text-white/25 font-kobe tracking-wider uppercase">
                Gender
              </span>
              {editing ? (
                <select
                  value={editGender}
                  onChange={(e) => setEditGender(e.target.value)}
                  className="bg-transparent text-sm text-white/70 font-kobe outline-none cursor-pointer [color-scheme:dark]"
                >
                  <option value="" className="bg-[#1a1a1a]">Select</option>
                  <option value="Male" className="bg-[#1a1a1a]">Male</option>
                  <option value="Female" className="bg-[#1a1a1a]">Female</option>
                  <option value="Other" className="bg-[#1a1a1a]">Other</option>
                </select>
              ) : (
                <span className="text-sm text-white/70 font-kobe">
                  {user.gender || "Not set"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Birth Details Card ── */}
      <div className="rounded-2xl border border-white/10 bg-[#0f0e0c]/90 backdrop-blur-2xl overflow-hidden">
        <div className="px-8 py-5 border-b border-white/6 flex items-center gap-2">
          <span className="text-hero-accent">✧</span>
          <h2 className="font-voyage text-base font-bold text-white/80">
            Birth Details
          </h2>
          <span className="ml-auto text-[11px] text-white/20 font-kobe tracking-wide">
            For kundali readings
          </span>
        </div>

        <div className="px-8 py-6 flex flex-col gap-4">
          {/* Date of Birth */}
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div className="flex items-center gap-3">
              <span className="text-lg">📅</span>
              <div>
                <span className="text-[11px] text-white/25 font-kobe tracking-wider uppercase block">
                  Date of Birth
                </span>
                {editing ? (
                  <input
                    type="date"
                    value={editDob}
                    onChange={(e) => setEditDob(e.target.value)}
                    className="mt-1 bg-transparent text-sm text-white font-kobe outline-none [color-scheme:dark]"
                  />
                ) : (
                  <span className="text-sm text-white/70 font-kobe">
                    {formatDate(user.dob)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Birth Time */}
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div className="flex items-center gap-3">
              <span className="text-lg">🕐</span>
              <div>
                <span className="text-[11px] text-white/25 font-kobe tracking-wider uppercase block">
                  Birth Time
                </span>
                {editing ? (
                  <input
                    type="time"
                    value={editBirthTime}
                    onChange={(e) => setEditBirthTime(e.target.value)}
                    className="mt-1 bg-transparent text-sm text-white font-kobe outline-none [color-scheme:dark]"
                  />
                ) : (
                  <span className="text-sm text-white/70 font-kobe">
                    {formatTime(user.birthTime)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Birth Place */}
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div className="flex items-center gap-3">
              <span className="text-lg">📍</span>
              <div>
                <span className="text-[11px] text-white/25 font-kobe tracking-wider uppercase block">
                  Birth Place
                </span>
                {editing ? (
                  <input
                    type="text"
                    value={editBirthPlace}
                    onChange={(e) => setEditBirthPlace(e.target.value)}
                    placeholder="e.g., Mumbai, Maharashtra"
                    className="mt-1 bg-transparent text-sm text-white font-kobe placeholder:text-white/20 outline-none w-full"
                  />
                ) : (
                  <span className="text-sm text-white/70 font-kobe">
                    {user.birthPlace || "Not set"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Save button when editing */}
          {editing && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="mt-2 w-full rounded-xl bg-hero-accent px-6 py-3.5 text-sm font-bold text-inverse-surface font-kobe tracking-wide transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(196,161,255,0.4)] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Saving..." : "Save Changes ✦"}
            </button>
          )}

          {!editing && !user.dob && !user.birthTime && !user.birthPlace && (
            <p className="text-[11px] text-white/20 font-kobe tracking-wide text-center py-2">
              ✦ Add your birth details for personalized kundali readings from Pandit Ji
            </p>
          )}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="rounded-2xl border border-white/10 bg-[#0f0e0c]/90 backdrop-blur-2xl overflow-hidden">
        <div className="px-8 py-5 border-b border-white/6">
          <h2 className="font-voyage text-base font-bold text-white/80">
            Quick Actions
          </h2>
        </div>

        <div className="flex flex-col">
          <a
            href="/chat"
            className="flex items-center gap-4 px-8 py-4 transition-all duration-200 hover:bg-white/[0.03] group"
          >
            <div className="w-10 h-10 rounded-xl bg-hero-accent/10 border border-hero-accent/15 flex items-center justify-center text-lg group-hover:bg-hero-accent/15 transition-colors">
              🙏
            </div>
            <div className="flex-1">
              <span className="text-sm text-white/80 font-kobe block">
                Chat with Pandit Ji
              </span>
              <span className="text-[11px] text-white/25 font-kobe">
                Continue your astrology consultation
              </span>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4 text-white/15 group-hover:text-white/30 transition-colors"
            >
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                clipRule="evenodd"
              />
            </svg>
          </a>

          <div className="mx-8 h-px bg-white/5" />

          <a
            href="/"
            className="flex items-center gap-4 px-8 py-4 transition-all duration-200 hover:bg-white/[0.03] group"
          >
            <div className="w-10 h-10 rounded-xl bg-hero-cool/10 border border-hero-cool/15 flex items-center justify-center text-lg group-hover:bg-hero-cool/15 transition-colors">
              🌟
            </div>
            <div className="flex-1">
              <span className="text-sm text-white/80 font-kobe block">
                Explore Rashis
              </span>
              <span className="text-[11px] text-white/25 font-kobe">
                Daily rashi phal and nakshatra insights
              </span>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4 text-white/15 group-hover:text-white/30 transition-colors"
            >
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        </div>
      </div>

      {/* ── Logout ── */}
      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full rounded-2xl border border-red-500/10 bg-red-500/[0.04] px-8 py-4 text-sm text-red-400/70 font-kobe tracking-wide transition-all duration-300 hover:bg-red-500/[0.08] hover:border-red-500/20 hover:text-red-400 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4"
        >
          <path
            fillRule="evenodd"
            d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z"
            clipRule="evenodd"
          />
          <path
            fillRule="evenodd"
            d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-.943a.75.75 0 1 0-1.004-1.114l-2.5 2.25a.75.75 0 0 0 0 1.114l2.5 2.25a.75.75 0 1 0 1.004-1.114l-1.048-.943h9.546A.75.75 0 0 0 19 10Z"
            clipRule="evenodd"
          />
        </svg>
        {loggingOut ? "Signing out..." : "Sign Out"}
      </button>
    </div>
  );
}
