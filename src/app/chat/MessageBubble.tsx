"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex items-start gap-2 sm:gap-2.5 md:gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
        isUser
          ? "flex-row-reverse ml-auto max-w-[92%] sm:max-w-[85%] md:max-w-[80%] xl:max-w-[70%]"
          : "mr-auto max-w-[92%] sm:max-w-[85%] md:max-w-[80%] xl:max-w-[75%]"
      }`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-hero-accent/30 to-hero-warm/30 border border-hero-accent/30 flex items-center justify-center text-sm sm:text-base flex-shrink-0 shadow-[0_0_15px_rgba(196,161,255,0.15)]">
          🙏
        </div>
      )}
      {isUser && (
        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-hero-cool/30 to-secondary/30 border border-hero-cool/30 flex items-center justify-center text-sm sm:text-base flex-shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/60"
          >
            <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
          </svg>
        </div>
      )}

      {/* Bubble with custom readable configurations */}
      <div
        className={`rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 text-[15px] sm:text-base leading-relaxed font-kobe tracking-wide ${
          isUser
            ? "rounded-tr-sm bg-hero-accent/15 border border-hero-accent/20 text-white/90"
            : "rounded-tl-sm bg-white/[0.06] border border-white/8 text-white/80 shadow-[0_2px_20px_rgba(196,161,255,0.05)]"
        }`}
      >
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
  );
}
