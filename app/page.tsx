import Navbar from "./components/landing/Navbar/Navbar";
import Hero from "./components/landing/hero/Hero";
import Benefits from "./components/landing/Benefits/Benefits";
import Features from "./components/landing/features/Features";
import FAQ from "./components/landing/faq/FAQ";
import Footer from "./components/landing/Footer/Footer";
import WhatsAppFloating from "./components/WhatsAppFloating";

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

      {/* FAQ */}
      <FAQ />

      {/* FOOTER */}
      <Footer />

      {/* WHATSAPP FLUTUANTE */}
      <WhatsAppFloating />

    </main>
  );
}