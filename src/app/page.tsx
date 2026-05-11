import Header from "./components/Header/Header";
import HeroSection from "./components/HeroSection/HeroSection";
import ZodiacSection from "./components/ZodiacSection/ZodiacSection";
import DestinySection from "./components/DestinySection/DestinySection";
import { GlobeDemo } from "./components/globe/GlobeDemo";
import Footer from "./components/Footer/Footer";

export default function Home() {
  return (
    <main className="w-full">
      <Header />
      <HeroSection />
      <ZodiacSection />
      <DestinySection />
      <GlobeDemo />
      <Footer />
    </main>
  );
}
