import Image from "next/image";

const footerLinks = {
  Explore: [
    { label: "Birth Chart", href: "#" },
    { label: "Daily Horoscope", href: "#" },
    { label: "Zodiac Signs", href: "#" },
    { label: "Tarot Reading", href: "#" },
    { label: "Compatibility", href: "#" },
  ],
  Learn: [
    { label: "Astrology 101", href: "#" },
    { label: "Planetary Transits", href: "#" },
    { label: "Moon Phases", href: "#" },
    { label: "Houses & Signs", href: "#" },
    { label: "Blog", href: "#" },
  ],
  Company: [
    { label: "About Us", href: "#" },
    { label: "Our Astrologers", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Press", href: "#" },
    { label: "Contact", href: "#" },
  ],
  Support: [
    { label: "Help Center", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
  ],
};

const socialLinks = [
  {
    label: "Instagram",
    href: "#",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    ),
  },
  {
    label: "Twitter",
    href: "#",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "#",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
        <path d="m10 15 5-3-5-3z" />
      </svg>
    ),
  },
  {
    label: "TikTok",
    href: "#",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z" />
      </svg>
    ),
  },
];

export default function Footer() {
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
                  ✦ Stay Connected
                </span>
                <h3 className="font-voyage font-bold text-2xl sm:text-3xl text-white">
                  Receive Your Daily
                  <br className="hidden sm:block" />
                  Cosmic Insights
                </h3>
                <p className="font-kobe text-sm text-white/40 max-w-md">
                  Join thousands of seekers who start their day with celestial guidance delivered straight to their inbox.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm px-5 py-3.5 text-sm text-white/80 font-kobe placeholder:text-white/25 outline-none transition-all duration-300 focus:border-hero-accent/40 focus:bg-white/[0.07] w-full sm:w-72"
                />
                <button
                  type="button"
                  className="rounded-xl bg-hero-accent px-6 py-3.5 text-sm font-bold text-inverse-surface font-kobe tracking-wide transition-all duration-300 hover:scale-105 hover:shadow-[0_0_24px_rgba(196,161,255,0.4)] active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  Subscribe ✦
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-10 lg:gap-8">
            {/* Brand Column */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-1 flex flex-col gap-5 mb-4 lg:mb-0">
              <a href="/" className="flex items-center gap-2 w-fit">
                <span className="text-hero-accent text-2xl">✦</span>
                <span className="font-voyage text-2xl font-bold text-white tracking-wide">
                  Celestial
                </span>
              </a>
              <p className="font-kobe text-sm leading-relaxed text-white/40 max-w-xs">
                Bridging ancient celestial wisdom with modern insight to illuminate your path through the cosmos.
              </p>

              {/* Decorative zodiac symbols */}
              <div className="flex items-center gap-3 text-white/15 text-lg font-voyage select-none">
                <span>♈</span>
                <span>♉</span>
                <span>♊</span>
                <span>♋</span>
                <span>♌</span>
                <span>♍</span>
                <span>♎</span>
                <span>♏</span>
                <span>♐</span>
                <span>♑</span>
                <span>♒</span>
                <span>♓</span>
              </div>
            </div>

            {/* Link Columns */}
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title} className="flex flex-col gap-4">
                <h4 className="font-voyage text-sm font-bold text-white tracking-wide">
                  {title}
                </h4>
                <ul className="flex flex-col gap-2.5">
                  {links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="font-kobe text-sm text-white/35 transition-all duration-300 hover:text-hero-accent"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="mx-auto px-6 sm:px-10 lg:px-16">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* ── Bottom Bar ── */}
        <div className="mx-auto w-full  px-6 sm:px-10 lg:px-16 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="font-kobe text-xs text-white/25 tracking-wide">
              © {new Date().getFullYear()} Celestial Editorial. All rights reserved.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-1">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex items-center justify-center w-9 h-9 rounded-lg text-white/30 transition-all duration-300 hover:text-hero-accent hover:bg-white/5"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
