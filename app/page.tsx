import Navbar from "./components/landing/Navbar/Navbar";
import Hero from "./components/landing/hero/Hero";
import Benefits from "./components/landing/Benefits/Benefits";
import Features from "./components/landing/features/Features";
import FAQ from "./components/landing/faq/FAQ";
import Precos from "./components/landing/Precos";
import Footer from "./components/landing/Footer/Footer";
import WhatsAppFloating from "./components/WhatsAppFloating";
import PixelComConsentimento from "./components/PixelComConsentimento";
import { PIXEL_PLATAFORMA } from "@/lib/pixel-plataforma";

export default function Home() {
  return (
    <main className="overflow-x-hidden bg-[#F8F6F4] text-[#111111]">

      {/* NAVBAR */}
      <Navbar />

      {/* HERO */}
      <Hero />

      {/* BENEFITS / NICHES */}
      <Benefits />

      {/* FEATURES */}
      <Features />

      {/* PREÇOS */}
      <Precos />

      {/* FAQ */}
      <FAQ />

      {/* FOOTER */}
      <Footer />

      {/* META PIXEL DO MEUCARDÁPIOAPP (só depois de aceitar os cookies) */}
      {PIXEL_PLATAFORMA && <PixelComConsentimento pixelId={PIXEL_PLATAFORMA} />}

      {/* WHATSAPP FLUTUANTE */}
      <WhatsAppFloating />

    </main>
  );
}