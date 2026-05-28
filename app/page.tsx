import Navbar from "./components/landing/Navbar"
import Hero from "./components/landing/Hero"
import Benefits from "./components/landing/Benefits"
import Features from "./components/landing/Features"
import DashboardPreview from "./components/landing/DashboardPreview"
import Testimonials from "./components/landing/Testimonials"
import Pricing from "./components/landing/Pricing"
import FAQ from "./components/landing/FAQ"
import Footer from "./components/landing/Footer"

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

      {/* DASHBOARD */}
      <DashboardPreview />

      {/* TESTIMONIALS */}
      <Testimonials />

      {/* PRICING */}
      <Pricing />

      {/* FAQ */}
      <FAQ />

      {/* FOOTER */}
      <Footer />
    </main>
  )
}