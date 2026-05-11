"use client";

import React, { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import LoginModal from "./LoginModal";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check auth on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => { });
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setShowWelcome(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();

      if (data.requiresLogin) {
        setShowLogin(true);
        setIsLoading(false);
        return;
      }

      if (data.reply) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.reply,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "🙏 Kshama karein beta, abhi thoda vyast hoon. Kripya thodi der mein phir prayaas karein.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleLoginSuccess = (userData: { name: string; email: string }) => {
    setUser(userData);
    setShowLogin(false);
    // Resend the last message automatically after login
    if (messages.length > 0) {
      retryAfterLogin();
    }
  };

  const retryAfterLogin = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const data = await res.json();
      if (data.reply) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.reply,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          {/* Welcome state */}
          {showWelcome && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center">
              {/* Pandit Avatar */}
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-hero-accent/30 to-hero-warm/30 border-2 border-hero-accent/40 flex items-center justify-center text-4xl shadow-[0_0_40px_rgba(196,161,255,0.2)]">
                  🙏
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-400 border-2 border-black" />
              </div>

              <h2 className="font-voyage text-2xl sm:text-3xl font-bold text-white mb-3">
                Pandit Shastri Ji
              </h2>
              <p className="font-kobe text-sm sm:text-base text-white/40 max-w-md mb-8 leading-relaxed">
                Namaste! I am a Vedic astrologer with 35 years of experience.
                Ask me about your kundali, rashifal, career, relationships, or
                any life guidance.
              </p>

              {/* Suggestion chips */}
              <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                {[
                  "🌟 Tell me about my kundali",
                  "💼 Career guidance",
                  "💕 Marriage & relationships",
                  "🔮 Today's rashifal",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                    className="rounded-full border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-2 text-xs sm:text-sm text-white/60 font-kobe tracking-wide transition-all duration-300 hover:bg-white/10 hover:text-white hover:border-hero-accent/30 hover:shadow-[0_0_15px_rgba(196,161,255,0.1)] cursor-pointer"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex items-start gap-3 max-w-[85%]">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-hero-accent/30 to-hero-warm/30 border border-hero-accent/30 flex items-center justify-center text-base flex-shrink-0">
                🙏
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-white/[0.06] border border-white/8 backdrop-blur-sm px-5 py-3.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-hero-accent/60 animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 rounded-full bg-hero-accent/60 animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 rounded-full bg-hero-accent/60 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-white/8 bg-black/30 backdrop-blur-xl px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Pandit Ji anything..."
              disabled={isLoading}
              className="w-full rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur-sm px-5 py-3.5 pr-12 text-sm text-white font-kobe placeholder:text-white/25 outline-none transition-all duration-300 focus:border-hero-accent/40 focus:bg-white/[0.08] focus:shadow-[0_0_20px_rgba(196,161,255,0.08)] disabled:opacity-50"
              id="chat-input"
            />
          </div>
          <button
            type="button"
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="flex items-center justify-center w-12 h-12 rounded-xl bg-hero-accent text-inverse-surface transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(196,161,255,0.4)] active:scale-95 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:shadow-none cursor-pointer"
            id="send-button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z" />
            </svg>
          </button>
        </div>
        {!user && (
          <p className="max-w-3xl mx-auto mt-2 text-[11px] text-white/20 font-kobe tracking-wide text-center">
            ✦ Free consultation for first 2 messages • Sign up for unlimited access
          </p>
        )}
      </div>

      {/* Login Modal */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={handleLoginSuccess}
        />
      )}
    </>
  );
}
