"use client";

import React, { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import LoginModal from "./LoginModal";
import { PlusCircle, MessageSquare, Trash2 } from "lucide-react";

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

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);

  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);


  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Optimistically add or update a chat session in the sidebar
  const upsertChatSession = (chatId: string, title: string) => {
    setChatSessions((prev) => {
      const exists = prev.some(c => c._id === chatId);
      if (exists) return prev;
      return [{ _id: chatId, title, updatedAt: new Date().toISOString() }, ...prev];
    });
  };

  const fetchChatSessions = async () => {
    try {
      const res = await fetch("/api/chat/history");
      const data = await res.json();
      if (data.chats) {
        setChatSessions(data.chats);
      }
    } catch (e) { }
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
      .catch(() => { });
  }, []);

  // Auto-scroll to bottom
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
        setMessages(data.messages);
        setShowWelcome(data.messages.length === 0);
      }
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  };

  const deleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    try {
      await fetch(`/api/chat/history?chatId=${chatId}`, { method: "DELETE" });
      setChatSessions((prev) => prev.filter(c => c._id !== chatId));
      if (currentChatId === chatId) {
        startNewChat();
      }
    } catch (e) { }
  };

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
          chatId: currentChatId,
        }),
      });

      const contentType = res.headers.get("content-type") || "";

      // Server returned an error page (HTML) — bail out with a friendly message
      // instead of rendering Next.js's error markup into the chat bubble.
      if (!res.ok || contentType.includes("text/html")) {
        throw new Error(`Chat API returned ${res.status}`);
      }

      // Handle JSON responses (fallback, login required, errors)
      if (contentType.includes("application/json")) {
        const data = await res.json();

        if (data.requiresLogin) {
          setShowLogin(true);
          setIsLoading(false);
          return;
        }

        if (data.chatId && currentChatId !== data.chatId) {
          setCurrentChatId(data.chatId);
          const firstMsg = updatedMessages.find(m => m.role === "user");
          const title = firstMsg ? firstMsg.content.substring(0, 40) + (firstMsg.content.length > 40 ? "..." : "") : "New Consultation";
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
        setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);
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
                  const firstMsg = updatedMessages.find(m => m.role === "user");
                  const title = firstMsg ? firstMsg.content.substring(0, 40) + (firstMsg.content.length > 40 ? "..." : "") : "New Consultation";
                  upsertChatSession(meta.chatId, title);
                }
              } catch { }
              fullText += text.substring(newlineIdx + 1);
            } else {
              // Entire first chunk is metadata, skip
              try { JSON.parse(text); } catch { fullText += text; }
            }
            isFirstChunk = false;
          } else {
            fullText += text;
          }

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: fullText } : m
            )
          );
        }
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

  const handleLoginSuccess = async (userData: { name: string; email: string }) => {
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
            role: m.role,
            content: m.content,
          })),
          chatId: currentChatId,
        }),
      });
      const data = await res.json();
      if (data.chatId) {
        setCurrentChatId(data.chatId);
        const firstMsg = currentMessages.find(m => m.role === "user");
        const title = firstMsg ? firstMsg.content.substring(0, 40) + (firstMsg.content.length > 40 ? "..." : "") : "New Consultation";
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

  return (
    <div className="flex flex-1 h-full w-full relative overflow-hidden">
      {/* Mobile Sidebar Toggle overlay */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed md:absolute md:relative z-50 inset-y-0 left-0 md:inset-auto h-full w-64 flex flex-col bg-[#080808]/95 backdrop-blur-xl border-r border-white/5 transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="p-4">
          <button
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-hero-accent/10 border border-hero-accent/30 text-hero-accent px-4 py-3 hover:bg-hero-accent/20 transition-all font-kobe tracking-wide text-sm cursor-pointer shadow-[0_0_15px_rgba(196,161,255,0.1)]"
          >
            <PlusCircle size={18} />
            New Consultation
          </button>
        </div>

        <div className="px-4 pb-2">
          <h3 className="text-[10px] text-white/30 uppercase tracking-widest font-kobe mb-1">Previous Sessions</h3>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 flex flex-col gap-1">
          {chatSessions.length === 0 ? (
            <div className="text-center text-xs text-white/20 font-kobe py-6">
              No previous chats
            </div>
          ) : (
            chatSessions.map((chat) => (
              <div
                key={chat._id}
                onClick={() => loadChat(chat._id)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all group ${currentChatId === chat._id ? "bg-white/10" : "hover:bg-white/5"}`}
              >
                <MessageSquare size={14} className={currentChatId === chat._id ? "text-hero-accent" : "text-white/40"} />
                <div className="flex-1 truncate text-xs font-kobe text-white/80">
                  {chat.title}
                </div>
                <button
                  onClick={(e) => deleteChat(e, chat._id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Delete chat"
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
              <p className="text-xs text-white/40 font-kobe mb-3">Sign in to save your consultations</p>
              <button
                onClick={() => setShowLogin(true)}
                className="w-full rounded-lg bg-white/10 px-3 py-2 text-xs text-white font-kobe hover:bg-white/20 transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-transparent overflow-hidden relative">
        {/* Mobile header for sidebar toggle */}
        <div className="md:hidden flex items-center px-2 py-2 border-b border-white/5 bg-black/40 backdrop-blur-md absolute top-0 w-full z-30">
          <button onClick={() => setIsSidebarOpen(true)} className="text-white/60 p-1.5 hover:text-white transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <span className="font-kobe text-xs text-white/40 ml-1">Pandit Shastri Ji</span>
        </div>

        {/* Messages container */}
        <div className="flex-1 overflow-y-auto px-2.5 sm:px-6 py-3 sm:py-6 pt-14 md:pt-6">
          <div className="max-w-3xl mx-auto flex flex-col gap-2.5 sm:gap-4">
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
                  Pandit Shastri Ji
                </h2>
                <p className="font-kobe text-xs sm:text-base text-white/40 max-w-md mb-5 sm:mb-8 leading-relaxed px-2">
                  Namaste! I am a Vedic astrologer with 35 years of experience.
                  Ask me about your kundali, rashifal, career, relationships, or
                  any life guidance.
                </p>

                {/* Suggestion chips */}
                <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 max-w-lg">
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

        {/* Input bar */}
        <div className="border-t border-white/8 bg-black/30 backdrop-blur-xl px-2.5 sm:px-6 py-2.5 sm:py-4 relative z-10">
          <div className="max-w-3xl mx-auto flex items-center gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Pandit Ji anything..."
                disabled={isLoading}
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur-sm px-3.5 py-2.5 sm:px-5 sm:py-3.5 text-sm text-white font-kobe placeholder:text-white/25 outline-none transition-all duration-300 focus:border-hero-accent/40 focus:bg-white/[0.08] focus:shadow-[0_0_20px_rgba(196,161,255,0.08)] disabled:opacity-50"
                id="chat-input"
              />
            </div>
            <button
              type="button"
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-hero-accent text-inverse-surface transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(196,161,255,0.4)] active:scale-95 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:shadow-none cursor-pointer flex-shrink-0"
              id="send-button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4 sm:w-5 sm:h-5"
              >
                <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z" />
              </svg>
            </button>
          </div>
          {!user && (
            <p className="max-w-3xl mx-auto mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-white/20 font-kobe tracking-wide text-center">
              ✦ Free for 2 messages • Sign up for unlimited
            </p>
          )}
        </div>
      </div>

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
