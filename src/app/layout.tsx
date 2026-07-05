import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Geist } from "next/font/google";
import { LanguageProvider } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const voyage = localFont({
  src: [
    {
      path: "../../public/fonts/voyage/voyage-regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/voyage/voyage-bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-voyage",
  display: "swap",
});

const kobe = localFont({
  src: [
    {
      path: "../../public/fonts/kobe/Kobe-regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/kobe/Kobe-oblique.otf",
      weight: "400",
      style: "oblique",
    },
    {
      path: "../../public/fonts/kobe/Kobe-bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/kobe/Kobe-boldoblique.otf",
      weight: "700",
      style: "oblique",
    },
    {
      path: "../../public/fonts/kobe/Kobe-black.otf",
      weight: "900",
      style: "normal",
    },
    {
      path: "../../public/fonts/kobe/Kobe-blackoblique.otf",
      weight: "900",
      style: "oblique",
    },
  ],
  variable: "--font-kobe",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Future Dekho — Vedic Astrology & Kundli",
  description:
    "Discover the cosmic blueprint in your birth chart. Vedic kundli reports, dasha timing, and guidance from Pandit Ji.",
  openGraph: {
    title: "Future Dekho — Vedic Astrology & Kundli",
    description:
      "Discover the cosmic blueprint in your birth chart. Vedic kundli reports, dasha timing, and guidance from Pandit Ji.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        voyage.variable,
        kobe.variable,
        "font-sans",
        geist.variable,
      )}
    >
      <body className="min-h-screen bg-surface text-on-surface font-kobe antialiased">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
