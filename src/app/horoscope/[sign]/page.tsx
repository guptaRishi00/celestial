import Image from "next/image";
import Link from "next/link";
import { getDetailedHoroscope } from "@/lib/horoscope";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

// We need a helper to get sign data (icon, element, date)
const getSignInfo = (signName: string) => {
  const signs = [
    { name: "Aries", date: "Mar 21 – Apr 19", element: "Fire", icon: "/2.png" },
    { name: "Taurus", date: "Apr 20 – May 20", element: "Earth", icon: "/1.png" },
    { name: "Gemini", date: "May 21 – Jun 20", element: "Air", icon: "/3.png" },
    { name: "Cancer", date: "Jun 21 – Jul 22", element: "Water", icon: "/4.png" },
    { name: "Leo", date: "Jul 23 – Aug 22", element: "Fire", icon: "/1.png" },
    { name: "Virgo", date: "Aug 23 – Sep 22", element: "Earth", icon: "/2.png" },
    { name: "Libra", date: "Sep 23 – Oct 22", element: "Air", icon: "/3.png" },
    { name: "Scorpio", date: "Oct 23 – Nov 21", element: "Water", icon: "/4.png" },
    { name: "Sagittarius", date: "Nov 22 – Dec 21", element: "Fire", icon: "/1.png" },
    { name: "Capricorn", date: "Dec 22 – Jan 19", element: "Earth", icon: "/2.png" },
    { name: "Aquarius", date: "Jan 20 – Feb 18", element: "Air", icon: "/3.png" },
    { name: "Pisces", date: "Feb 19 – Mar 20", element: "Water", icon: "/4.png" },
  ];
  return signs.find(s => s.name.toLowerCase() === signName.toLowerCase());
};

const elementColors: Record<string, string> = {
  Earth: "text-emerald-400",
  Fire: "text-orange-400",
  Air: "text-sky-400",
  Water: "text-blue-400",
};

export default async function DetailedHoroscopePage({ params }: { params: Promise<{ sign: string }> }) {
  const resolvedParams = await params;
  const signInfo = getSignInfo(resolvedParams.sign);
  
  if (!signInfo) {
    return <div className="text-white text-center py-20 font-kobe">Sign not found</div>;
  }

  const detailedData = await getDetailedHoroscope(resolvedParams.sign);

  return (
    <main className="w-full bg-black min-h-screen flex flex-col">
      <Header />
      
      <section className="relative w-full flex-grow py-24 sm:py-32">
        {/* Background */}
        <Image
          src="/bg2.png"
          alt="Starry background"
          fill
          priority
          quality={90}
          className="object-cover object-center opacity-50"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black via-black/80 to-black/95" />

        <div className="relative z-10 mx-auto w-full max-w-4xl px-6 sm:px-10 lg:px-16 pt-10">
          <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-10 transition-colors font-kobe text-sm uppercase tracking-widest">
            ← Back to Home
          </Link>

          {/* Hero Section of the specific sign */}
          <div className="flex flex-col sm:flex-row items-center gap-8 mb-16 border-b border-white/10 pb-16">
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 shrink-0">
              <Image
                src={signInfo.icon}
                alt={`${signInfo.name} symbol`}
                fill
                quality={90}
                className="object-contain drop-shadow-[0_0_30px_rgba(196,161,255,0.2)]"
              />
            </div>
            
            <div className="flex flex-col text-center sm:text-left gap-3">
              <span className={`inline-flex items-center gap-1.5 w-fit mx-auto sm:mx-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-kobe tracking-[0.15em] uppercase ${elementColors[signInfo.element]}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {signInfo.element}
              </span>
              
              <h1 className="font-voyage font-bold text-5xl sm:text-6xl text-white tracking-wide">
                {signInfo.name}
              </h1>
              
              <p className="font-kobe text-sm text-white/40 tracking-widest uppercase">
                {signInfo.date}
              </p>
            </div>
          </div>

          {/* Detailed Content */}
          <div className="flex flex-col gap-12">
            {!detailedData ? (
              <p className="text-white/50 font-kobe text-center">Reading is currently unavailable. Please try again later.</p>
            ) : (
              <>
                <div className="flex flex-col gap-4 bg-white/[0.02] border border-white/5 p-8 rounded-2xl backdrop-blur-sm">
                  <h2 className="font-voyage text-2xl text-hero-accent tracking-wide">Today's Overview</h2>
                  <p className="font-kobe text-white/70 leading-relaxed">
                    {detailedData.general}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-3 bg-white/[0.02] border border-white/5 p-8 rounded-2xl backdrop-blur-sm hover:border-white/10 transition-colors">
                    <h3 className="font-voyage text-xl text-white tracking-wide">Career & Finance</h3>
                    <p className="font-kobe text-sm text-white/60 leading-relaxed">
                      {detailedData.career}
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-3 bg-white/[0.02] border border-white/5 p-8 rounded-2xl backdrop-blur-sm hover:border-white/10 transition-colors">
                    <h3 className="font-voyage text-xl text-white tracking-wide">Love & Relationships</h3>
                    <p className="font-kobe text-sm text-white/60 leading-relaxed">
                      {detailedData.love}
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-3 md:col-span-2 bg-white/[0.02] border border-white/5 p-8 rounded-2xl backdrop-blur-sm hover:border-white/10 transition-colors">
                    <h3 className="font-voyage text-xl text-white tracking-wide">Health & Wellness</h3>
                    <p className="font-kobe text-sm text-white/60 leading-relaxed">
                      {detailedData.health}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mt-4">
                  <div className="flex-1 min-w-[200px] flex items-center justify-between bg-white/[0.02] border border-white/5 p-6 rounded-2xl hover:bg-white/[0.04] transition-colors">
                    <span className="font-voyage text-lg text-white/50">Lucky Color</span>
                    <span className="font-kobe text-hero-accent font-medium uppercase tracking-widest">{detailedData.luckyColor}</span>
                  </div>
                  <div className="flex-1 min-w-[200px] flex items-center justify-between bg-white/[0.02] border border-white/5 p-6 rounded-2xl hover:bg-white/[0.04] transition-colors">
                    <span className="font-voyage text-lg text-white/50">Lucky Number</span>
                    <span className="font-kobe text-hero-accent font-medium text-xl">{detailedData.luckyNumber}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  );
}
