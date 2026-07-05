"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLanguage } from "@/lib/LanguageContext";
import PanditAvatar from "./PanditAvatar";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const { t } = useLanguage();

  // User: right-aligned bubble (clean, no avatar — modern AI-chat convention)
  if (isUser) {
    return (
      <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="max-w-[85%] sm:max-w-[80%] rounded-2xl rounded-tr-md bg-hero-accent/15 border border-hero-accent/20 px-4 py-2.5 text-[15px] sm:text-base leading-relaxed font-kobe tracking-wide text-white/90 whitespace-pre-wrap break-words">
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant: avatar + name label + flowing text (reads like a real reply, not a box)
  return (
    <div className="flex items-start gap-2.5 sm:gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Avatar */}
      <PanditAvatar className="mt-0.5 w-8 h-8 sm:w-9 sm:h-9" imgPx={72} />

      <div className="min-w-0 flex-1">
        {/* Name label — reinforces "a real pandit is replying" */}
        <div className="mb-1 flex items-center gap-1.5">
          <span className="font-voyage text-sm text-white/85 tracking-wide">
            {t("chat.panditShastri")}
          </span>
          <span className="w-1 h-1 rounded-full bg-emerald-400" />
        </div>

        {/* Message body — borderless flowing text */}
        <div className="text-[15px] sm:text-base leading-relaxed font-kobe tracking-wide text-white/80">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ node, ...props }) => (
                <p className="mb-3 last:mb-0 whitespace-pre-wrap" {...props} />
              ),
              ul: ({ node, ...props }) => (
                <ul
                  className="list-disc pl-5 mb-3 space-y-1 text-white/90"
                  {...props}
                />
              ),
              ol: ({ node, ...props }) => (
                <ol
                  className="list-decimal pl-5 mb-3 space-y-1 text-white/90"
                  {...props}
                />
              ),
              li: ({ node, ...props }) => <li className="mb-0.5" {...props} />,
              strong: ({ node, ...props }) => (
                <strong
                  className="font-bold text-hero-accent drop-shadow-[0_0_10px_rgba(196,161,255,0.15)]"
                  {...props}
                />
              ),
              em: ({ node, ...props }) => (
                <em className="italic text-hero-warm" {...props} />
              ),

              // Clean section break headers
              h1: ({ node, ...props }) => (
                <h1
                  className="text-xl font-bold mt-5 mb-2.5 text-white border-b border-white/5 pb-1 font-voyage tracking-wider text-hero-accent"
                  {...props}
                />
              ),
              h2: ({ node, ...props }) => (
                <h2
                  className="text-lg font-bold mt-4 mb-2 text-white/95 font-voyage tracking-wide border-b border-white/5 pb-0.5"
                  {...props}
                />
              ),
              h3: ({ node, ...props }) => (
                <h3
                  className="text-base font-semibold mt-3 mb-1.5 text-white/90"
                  {...props}
                />
              ),

              // Beautiful stylized blockquote container for blessings & mantras
              blockquote: ({ node, ...props }) => (
                <blockquote
                  className="border-l-2 border-hero-accent bg-hero-accent/5 px-4 py-2.5 my-3 rounded-r-lg italic text-white/90 shadow-[inset_0_0_10px_rgba(196,161,255,0.02)]"
                  {...props}
                />
              ),

              // Subtle separation line
              hr: ({ node, ...props }) => (
                <hr className="my-4 border-white/10" {...props} />
              ),

              // Premium structure for tables if generated
              table: ({ node, ...props }) => (
                <div className="overflow-x-auto my-3.5 rounded-lg border border-white/10">
                  <table
                    className="w-full text-left text-xs sm:text-sm border-collapse"
                    {...props}
                  />
                </div>
              ),
              thead: ({ node, ...props }) => (
                <thead
                  className="bg-white/5 text-white/90 font-semibold border-b border-white/10"
                  {...props}
                />
              ),
              tbody: ({ node, ...props }) => (
                <tbody
                  className="divide-y divide-white/5 bg-white/[0.01]"
                  {...props}
                />
              ),
              tr: ({ node, ...props }) => (
                <tr
                  className="hover:bg-white/[0.02] transition-colors"
                  {...props}
                />
              ),
              th: ({ node, ...props }) => (
                <th className="p-2.5 sm:p-3" {...props} />
              ),
              td: ({ node, ...props }) => (
                <td className="p-2.5 sm:p-3 text-white/70" {...props} />
              ),

              a: ({ node, ...props }) => (
                <a
                  className="text-hero-accent underline hover:text-hero-accent/80 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  {...props}
                />
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
