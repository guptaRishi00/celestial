"use client";

import Image from "next/image";
import { useLanguage } from "@/lib/LanguageContext";

const footerLinks = {
  Support: [
    { labelKey: "footer.privacyPolicy", href: "#" },
    { labelKey: "footer.termsOfService", href: "#" },
  ],
};

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer id="site-footer" className="relative w-full overflow-hidden">
      {/* ── Background ── */}
      <Image
        src="/bg2.png"
        alt="Starry background"
        fill
        quality={90}
        className="object-cover object-center"
      />

      {/* Dark gradient overlay — top blend */}
      <div className="absolute inset-0 bg-linear-to-b from-black via-black/80 to-black/95" />

      <div className="relative z-10">
        {/* ── Newsletter CTA ── */}
        <div className="mx-auto w-full  px-6 sm:px-10 lg:px-16 pt-24 pb-16">
          <div className="relative rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-sm p-8 sm:p-12 overflow-hidden">
            {/* Decorative glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-hero-accent/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-hero-cool/8 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="flex flex-col gap-3 text-center lg:text-left">
                <span className="inline-flex items-center gap-2 w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] tracking-[0.2em] uppercase text-hero-accent font-kobe mx-auto lg:mx-0">
                  {t("footer.stayConnected")}
                </span>
                <h3 className="font-voyage font-bold text-2xl sm:text-3xl text-white">
                  {t("footer.newsletterTitle1")}
                  <br className="hidden sm:block" />
                  {t("footer.newsletterTitle2")}
                </h3>
                <p className="font-kobe text-sm text-white/40 max-w-md">
                  {t("footer.newsletterDesc")}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <input
                  type="email"
                  placeholder={t("footer.emailPlaceholder")}
                  className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm px-5 py-3.5 text-sm text-white/80 font-kobe placeholder:text-white/25 outline-none transition-all duration-300 focus:border-hero-accent/40 focus:bg-white/[0.07] w-full sm:w-72"
                />
                <button
                  type="button"
                  className="rounded-xl bg-hero-accent px-6 py-3.5 text-sm font-bold text-inverse-surface font-kobe tracking-wide transition-all duration-300 hover:scale-105 hover:shadow-[0_0_24px_rgba(196,161,255,0.4)] active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  {t("footer.subscribe")}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="mx-auto px-6 sm:px-10 lg:px-16">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* ── Main Footer Grid ── */}
        <div className="mx-auto w-full  px-6 sm:px-10 lg:px-16 py-16">
          <div className="flex flex-col sm:flex-row justify-between gap-10 lg:gap-8">
            {/* Brand Column */}
            <div className="flex flex-col gap-5 mb-4 lg:mb-0">
              <a href="/" className="flex items-center gap-2 w-fit">
                {/* <span className="text-hero-accent text-2xl">✦</span> */}
                <span className="font-voyage text-2xl font-bold text-hero-accent tracking-wide">
                  Future Dekho
                </span>
              </a>
              <p className="font-kobe text-sm leading-relaxed text-white/40 max-w-xs">
                {t("footer.brandDesc")}
              </p>
            </div>

            {/* Link Columns */}
            {Object.entries(footerLinks).map(([title, links]) => {
              const titleKey = `footer.${title.toLowerCase()}` as any;
              return (
                <div key={title} className="flex flex-col gap-4">
                  <h4 className="font-voyage text-xl font-bold text-white tracking-wide">
                    {t(titleKey)}
                  </h4>
                  <ul className="flex flex-col gap-2.5">
                    {links.map((link) => (
                      <li key={link.labelKey}>
                        <a
                          href={link.href}
                          className="font-kobe text-sm text-white/35 transition-all duration-300 hover:text-hero-accent"
                        >
                          {t(link.labelKey as any)}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="mx-auto px-6 sm:px-10 lg:px-16">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* ── Bottom Bar ── */}
        <div className="mx-auto w-full  px-6 sm:px-10 lg:px-16 py-8 flex flex-col lg:flex-row gap-3 items-center justify-between">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="font-kobe text-xs text-white/25 tracking-wide">
              © {new Date().getFullYear()} {t("footer.copyright")}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="font-kobe text-xs text-white/25 tracking-wide">
              Made by Softexedge
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
