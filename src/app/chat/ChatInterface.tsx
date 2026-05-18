"use client";

import {
  Coins,
  FileText,
  MessageSquare,
  PlusCircle,
  Trash2,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import {
  createPaymentOrder,
  openRazorpayCheckout,
  verifyRazorpayPayment,
} from "@/lib/razorpay";
import LoginModal from "./LoginModal";
import MessageBubble from "./MessageBubble";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatSession {
  _id: string;
  title: string;
  updatedAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  chatTokens: number;
  unlockedReports?: string[];
}

type StoredMessage = Partial<Message> & Pick<Message, "role" | "content">;

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);

  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isRecharging, setIsRecharging] = useState(false);
  const [reportToast, setReportToast] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);

  const { t, lang } = useLanguage();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Optimistically add or update a chat session in the sidebar
  const upsertChatSession = (chatId: string, title: string) => {
    setChatSessions((prev) => {
      const exists = prev.some((c) => c._id === chatId);
      if (exists) return prev;
      return [
        { _id: chatId, title, updatedAt: new Date().toISOString() },
        ...prev,
      ];
    });
  };

  const fetchChatSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/history");
      const data = await res.json();
      if (data.chats) {
        setChatSessions(data.chats);
      }
    } catch {}
  }, []);

  const updateChatTokens = (chatTokens: unknown) => {
    if (typeof chatTokens !== "number") return;
    setUser((prev) => (prev ? { ...prev, chatTokens } : prev));
  };

  // Check auth on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          fetchChatSessions();
        }
      })
      .catch(() => {});
  }, [fetchChatSessions]);

  // Auto-scroll to bottom
  // biome-ignore lint/correctness/useExhaustiveDependencies: Scroll whenever chat content or loading state changes.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setShowWelcome(true);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const loadChat = async (chatId: string) => {
    setIsLoading(true);
    setCurrentChatId(chatId);
    if (window.innerWidth < 768) setIsSidebarOpen(false);

    try {
      const res = await fetch(`/api/chat/history?chatId=${chatId}`);
      const data = await res.json();
      if (data.messages) {
        const messagesWithIds = (data.messages as StoredMessage[]).map(
          (m, idx) => ({
            ...m,
            id: m.id || `msg-${idx}-${Date.now()}`,
          }),
        );
        setMessages(messagesWithIds);
        setShowWelcome(messagesWithIds.length === 0);
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const deleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    try {
      await fetch(`/api/chat/history?chatId=${chatId}`, { method: "DELETE" });
      setChatSessions((prev) => prev.filter((c) => c._id !== chatId));
      if (currentChatId === chatId) {
        startNewChat();
      }
    } catch {}
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    if (user && user.chatTokens <= 0) {
      setReportToast({
        message: "Recharge tokens to continue your consultation.",
        type: "error",
      });
      setTimeout(() => setReportToast(null), 5000);
      return;
    }

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
            id: m.id,
            role: m.role,
            content: m.content,
          })),
          chatId: currentChatId,
          lang,
        }),
      });

      const contentType = res.headers.get("content-type") || "";

      if (res.status === 402) {
        const data = await res.json().catch(() => null);
        updateChatTokens(data?.chatTokens ?? 0);
        setReportToast({
          message: "Recharge tokens to continue your consultation.",
          type: "error",
        });
        setTimeout(() => setReportToast(null), 5000);
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "Your chat tokens are over. Please recharge to continue your consultation.",
        };
        setMessages((prev) => [...prev, assistantMessage]);
        return;
      }

      // Server returned an error page (HTML) — bail out with a friendly message
      // instead of rendering Next.js's error markup into the chat bubble.
      if (!res.ok || contentType.includes("text/html")) {
        throw new Error(`Chat API returned ${res.status}`);
      }

      // Handle JSON responses (fallback, login required, errors)
      if (contentType.includes("application/json")) {
        const data = await res.json();
        updateChatTokens(data.chatTokens);

        if (data.requiresLogin) {
          setShowLogin(true);
          setIsLoading(false);
          return;
        }

        if (data.chatId && currentChatId !== data.chatId) {
          setCurrentChatId(data.chatId);
          const firstMsg = updatedMessages.find((m) => m.role === "user");
          const title = firstMsg
            ? firstMsg.content.substring(0, 40) +
              (firstMsg.content.length > 40 ? "..." : "")
            : t("chat.newConsultation");
          upsertChatSession(data.chatId, title);
        }

        if (data.reply) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: data.reply,
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
      } else {
        // Handle streaming text response
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No reader");

        const decoder = new TextDecoder();
        const assistantId = (Date.now() + 1).toString();
        let fullText = "";
        let isFirstChunk = true;

        // Add empty assistant message that we'll update
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: "assistant", content: "" },
        ]);
        setIsLoading(false);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });

          if (isFirstChunk) {
            // First chunk contains JSON with chatId followed by newline
            const newlineIdx = text.indexOf("\n");
            if (newlineIdx !== -1) {
              try {
                const meta = JSON.parse(text.substring(0, newlineIdx));
                if (meta.chatId && currentChatId !== meta.chatId) {
                  setCurrentChatId(meta.chatId);
                  const firstMsg = updatedMessages.find(
                    (m) => m.role === "user",
                  );
                  const title = firstMsg
                    ? firstMsg.content.substring(0, 40) +
                      (firstMsg.content.length > 40 ? "..." : "")
                    : t("chat.newConsultation");
                  upsertChatSession(meta.chatId, title);
                }
                updateChatTokens(meta.chatTokens);
              } catch {}
              fullText += text.substring(newlineIdx + 1);
            } else {
              // Entire first chunk is metadata, skip
              try {
                const meta = JSON.parse(text);
                updateChatTokens(meta.chatTokens);
              } catch {
                fullText += text;
              }
            }
            isFirstChunk = false;
          } else {
            fullText += text;
          }

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: fullText } : m,
            ),
          );
        }
      }
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: t("chat.errorMessage"),
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

  const downloadReport = async (unlockId?: string | null) => {
    const params = new URLSearchParams({ lang });
    if (unlockId) params.set("unlockId", unlockId);

    const res = await fetch(`/api/report?${params.toString()}`);
    if (!res.ok) {
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
      setShowLogin(true);
      setReportToast({ message: t("chat.reportSignIn"), type: "error" });
      setTimeout(() => setReportToast(null), 5000);
      return;
    }

    setIsGeneratingReport(true);
    setReportToast(null);
    try {
      const order = await createPaymentOrder("report", 10);
      const checkoutResponse = await openRazorpayCheckout({
        order,
        name: "Celestial AI",
        description: "Detailed Astrology Report",
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

  const handleRecharge = async () => {
    if (!user) {
      setShowLogin(true);
      return;
    }

    setIsRecharging(true);
    setReportToast(null);
    try {
      const order = await createPaymentOrder("tokens", 50);
      const checkoutResponse = await openRazorpayCheckout({
        order,
        name: "Celestial AI",
        description: "Chat Token Refill",
      });
      const verification = await verifyRazorpayPayment(
        checkoutResponse,
        "tokens",
        user.id,
      );

      updateChatTokens(verification.chatTokens);
      setReportToast({
        message: "Tokens refilled successfully.",
        type: "success",
      });
    } catch (error) {
      setReportToast({
        message:
          error instanceof Error ? error.message : t("chat.networkError"),
        type: "error",
      });
    } finally {
      setIsRecharging(false);
      setTimeout(() => setReportToast(null), 5000);
    }
  };

  const handleLoginSuccess = async (userData: User) => {
    setUser(userData);
    setShowLogin(false);
    await fetchChatSessions();
    if (messages.length > 0) {
      retryAfterLogin(messages);
    }
  };

  const retryAfterLogin = async (currentMessages: Message[] = messages) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: currentMessages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
          })),
          chatId: currentChatId,
          lang,
        }),
      });
      const data = await res.json();
      if (data.chatId) {
        setCurrentChatId(data.chatId);
        const firstMsg = currentMessages.find((m) => m.role === "user");
        const title = firstMsg
          ? firstMsg.content.substring(0, 40) +
            (firstMsg.content.length > 40 ? "..." : "")
          : t("chat.newConsultation");
        upsertChatSession(data.chatId, title);
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
      // silently fail
    } finally {
      setIsLoading(false);
    }
  };

  const hasNoTokens = Boolean(user && user.chatTokens <= 0);

  return (
    <div className="flex flex-1 h-full w-full relative overflow-hidden">
      {/* Sidebar overlay — shown when drawer is open below `lg` breakpoint */}
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close consultations menu"
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar
          - Mobile / Tablet (< 1024px): drawer, off-canvas, slides in on hamburger tap
          - Desktop (>= 1024px): permanent column, never animates
          - Large desktop (>= 1280px): wider for better title readability */}
      <aside
        className={`fixed lg:relative z-50 inset-y-0 left-0 h-full
          w-72 sm:w-80 lg:w-64 xl:w-72 2xl:w-80
          flex flex-col bg-[#080808]/95 backdrop-blur-xl border-r border-white/5
          transition-transform duration-300
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="p-4">
          <button
            type="button"
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-hero-accent/10 border border-hero-accent/30 text-hero-accent px-4 py-3 hover:bg-hero-accent/20 transition-all font-kobe tracking-wide text-sm cursor-pointer shadow-[0_0_15px_rgba(196,161,255,0.1)]"
          >
            <PlusCircle size={18} />
            {t("chat.newConsultation")}
          </button>
        </div>

        <div className="px-4 pb-2">
          <h3 className="text-[10px] text-white/30 uppercase tracking-widest font-kobe mb-1">
            {t("chat.previousSessions")}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 flex flex-col gap-1">
          {chatSessions.length === 0 ? (
            <div className="text-center text-xs text-white/20 font-kobe py-6">
              {t("chat.noPreviousChats")}
            </div>
          ) : (
            chatSessions.map((chat) => (
              <div
                key={chat._id}
                className={`flex items-center gap-2 p-1.5 rounded-xl transition-all group ${currentChatId === chat._id ? "bg-white/10" : "hover:bg-white/5"}`}
              >
                <button
                  type="button"
                  onClick={() => loadChat(chat._id)}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1.5 text-left"
                >
                  <MessageSquare
                    size={14}
                    className={
                      currentChatId === chat._id
                        ? "text-hero-accent"
                        : "text-white/40"
                    }
                  />
                  <span className="flex-1 truncate text-xs font-kobe text-white/80">
                    {chat.title}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={(e) => deleteChat(e, chat._id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title={t("chat.deleteChat")}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>

        {!user && (
          <div className="p-4 border-t border-white/5">
            <div className="rounded-xl bg-white/5 p-4 text-center border border-white/10">
              <p className="text-xs text-white/40 font-kobe mb-3">
                {t("chat.signInToSave")}
              </p>
              <button
                type="button"
                onClick={() => setShowLogin(true)}
                className="w-full rounded-lg bg-white/10 px-3 py-2 text-xs text-white font-kobe hover:bg-white/20 transition-colors"
              >
                {t("chat.signIn")}
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Chat Area — flex column so header / messages / input lay out naturally */}
      <section className="flex-1 flex flex-col h-full bg-transparent overflow-hidden relative min-w-0">
        {/* Mobile/Tablet header (< lg) — sidebar toggle + label. Hidden on desktop
            where the sidebar is always visible. Now a real flow item rather than
            absolutely positioned, so it can't overlap scrolling content. */}
        <div className="lg:hidden flex items-center gap-2 px-3 sm:px-4 py-2 border-b border-white/5 bg-black/30 backdrop-blur-md flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="text-white/60 p-1.5 hover:text-white transition-colors cursor-pointer rounded-md hover:bg-white/5"
            aria-label="Open consultations menu"
          >
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
          <span className="font-kobe text-xs sm:text-sm text-white/50 truncate">
            {t("chat.panditShastri")}
          </span>
        </div>

        {/* Messages container */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-5 md:px-6 lg:px-8 py-3 sm:py-5 md:py-6">
          <div className="max-w-3xl xl:max-w-4xl 2xl:max-w-5xl mx-auto flex flex-col gap-2.5 sm:gap-3.5 md:gap-4">
            {/* Welcome state */}
            {showWelcome && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 sm:py-24 text-center px-2">
                {/* Pandit Avatar */}
                <div className="relative mb-4 sm:mb-6">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-hero-accent/30 to-hero-warm/30 border-2 border-hero-accent/40 flex items-center justify-center text-2xl sm:text-4xl shadow-[0_0_40px_rgba(196,161,255,0.2)]">
                    🙏
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-emerald-400 border-2 border-black" />
                </div>

                <h2 className="font-voyage text-xl sm:text-3xl font-bold text-white mb-2 sm:mb-3">
                  {t("chat.panditShastri")}
                </h2>
                <p className="font-kobe text-xs sm:text-base text-white/40 max-w-md mb-5 sm:mb-8 leading-relaxed px-2">
                  {t("chat.welcomeDesc")}
                </p>

                {/* Suggestion chips */}
                <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 max-w-lg">
                  {[
                    t("chat.suggestion1"),
                    t("chat.suggestion2"),
                    t("chat.suggestion3"),
                    t("chat.suggestion4"),
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        setInput(suggestion);
                        inputRef.current?.focus();
                      }}
                      className="rounded-full border border-white/10 bg-white/5 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-sm text-white/60 font-kobe tracking-wide transition-all duration-300 hover:bg-white/10 hover:text-white hover:border-hero-accent/30 hover:shadow-[0_0_15px_rgba(196,161,255,0.1)] cursor-pointer"
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
              <div className="flex items-start gap-2 sm:gap-3 max-w-[90%] sm:max-w-[85%]">
                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-hero-accent/30 to-hero-warm/30 border border-hero-accent/30 flex items-center justify-center text-sm sm:text-base flex-shrink-0">
                  🙏
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-white/[0.06] border border-white/8 backdrop-blur-sm px-3.5 py-2.5 sm:px-5 sm:py-3.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-hero-accent/60 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-hero-accent/60 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-hero-accent/60 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Report toast notification */}
        {reportToast && (
          <div
            className={`absolute top-16 md:top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl border backdrop-blur-xl text-sm font-kobe tracking-wide shadow-[0_0_30px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-top-2 duration-300 ${
              reportToast.type === "error"
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            }`}
          >
            {reportToast.message}
          </div>
        )}

        {/* Input bar
            - pb adds safe-area-inset for iPhone home indicator
            - flex-shrink-0 so it never gets squeezed by the scroll area */}
        <div
          className="flex-shrink-0 border-t border-white/8 bg-black/30 backdrop-blur-xl px-3 sm:px-5 md:px-6 lg:px-8 py-2.5 sm:py-3 md:py-4 relative z-10"
          style={{
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.625rem)",
          }}
        >
          <div className="max-w-3xl xl:max-w-4xl 2xl:max-w-5xl mx-auto flex items-center gap-2 sm:gap-2.5 md:gap-3">
            <div className="flex-1 relative min-w-0">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("chat.inputPlaceholder")}
                disabled={isLoading}
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur-sm px-3.5 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-3.5 text-sm text-white font-kobe placeholder:text-white/25 outline-none transition-all duration-300 focus:border-hero-accent/40 focus:bg-white/[0.08] focus:shadow-[0_0_20px_rgba(196,161,255,0.08)] disabled:opacity-50"
                id="chat-input"
              />
            </div>
            <button
              type="button"
              onClick={generateReport}
              disabled={isGeneratingReport}
              className={`group relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl transition-all duration-300 flex-shrink-0 border ${
                isGeneratingReport
                  ? "bg-hero-warm/20 border-hero-warm/30 cursor-not-allowed"
                  : "bg-white/[0.04] border-white/10 hover:bg-hero-warm/15 hover:border-hero-warm/40 hover:scale-105 hover:shadow-[0_0_20px_rgba(255,169,142,0.2)] active:scale-95 cursor-pointer"
              }`}
              id="generate-report-button"
              title="Generate Kundali Report (PDF)"
            >
              {isGeneratingReport ? (
                <svg
                  aria-hidden="true"
                  className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-hero-warm"
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
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white/50 group-hover:text-hero-warm transition-colors duration-300" />
              )}
              {/* Tooltip */}
              <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-[#1a1a1a] border border-white/10 text-[10px] text-white/70 font-kobe tracking-wide whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg">
                {t("chat.generateReport")}
              </span>
            </button>
            {hasNoTokens && (
              <button
                type="button"
                onClick={handleRecharge}
                disabled={isRecharging}
                className="group relative flex items-center justify-center gap-1.5 h-10 sm:h-12 rounded-xl px-3 sm:px-4 transition-all duration-300 flex-shrink-0 border bg-hero-accent/10 border-hero-accent/30 text-hero-accent hover:bg-hero-accent/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                title="Recharge chat tokens"
              >
                {isRecharging ? (
                  <svg
                    aria-hidden="true"
                    className="w-4 h-4 sm:w-5 sm:h-5 animate-spin"
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
                  <Coins className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
                <span className="hidden sm:inline text-xs font-kobe tracking-wide">
                  Recharge
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={sendMessage}
              disabled={
                (!input.trim() && !isLoading) || isLoading || hasNoTokens
              }
              className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl transition-all duration-300 flex-shrink-0 ${
                isLoading
                  ? "bg-hero-accent/40 cursor-not-allowed"
                  : "bg-hero-accent hover:scale-105 hover:shadow-[0_0_20px_rgba(196,161,255,0.4)] active:scale-95 cursor-pointer"
              } text-inverse-surface disabled:opacity-30 disabled:hover:scale-100 disabled:hover:shadow-none`}
              id="send-button"
            >
              {isLoading ? (
                <svg
                  aria-hidden="true"
                  className="w-4 h-4 sm:w-5 sm:h-5 animate-spin"
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
                  className="w-4 h-4 sm:w-5 sm:h-5"
                >
                  <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z" />
                </svg>
              )}
            </button>
          </div>
          {user ? (
            <p className="max-w-3xl xl:max-w-4xl mx-auto mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-white/25 font-kobe tracking-wide text-center">
              Tokens: {user.chatTokens}
            </p>
          ) : (
            <p className="max-w-3xl xl:max-w-4xl mx-auto mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-white/20 font-kobe tracking-wide text-center">
              {t("chat.freeMessages")}
            </p>
          )}
        </div>
      </section>

      {/* Login Modal */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}
