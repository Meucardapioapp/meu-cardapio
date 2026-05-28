"use client"

import {
  Smartphone,
  CreditCard,
  Palette,
  BarChart3,
  MessageCircle,
  Globe,
} from "lucide-react"

export default function Features() {
  return (
    <section className="bg-[#F8F6F4] px-4 pb-24">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="text-center">

          <div className="inline-flex rounded-full bg-[#FFF1F4] px-4 py-2 text-sm font-bold text-[#6D1F2F]">
            Recursos Premium
          </div>

          <h2 className="mt-6 text-4xl font-black leading-tight text-black md:text-6xl">
            Tudo que você precisa
            <br />
            para um delivery{" "}
            <span className="text-[#6D1F2F]">
              profissional
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-zinc-600">
            Uma plataforma moderna para transformar seu delivery
            em uma marca forte e profissional.
          </p>
        </div>

        {/* GRID */}
        <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-3">

          {[
            {
              icon: Smartphone,
              title: "Cardápio Digital",
              desc: "Layout moderno e totalmente responsivo para qualquer dispositivo.",
            },
            {
              icon: CreditCard,
              title: "Pagamento Online",
              desc: "Aceite Pix, crédito e débito diretamente pelo site.",
            },
            {
              icon: Palette,
              title: "Personalização",
              desc: "Altere cores, imagens e identidade visual do restaurante.",
            },
            {
              icon: BarChart3,
              title: "Dashboard Completo",
              desc: "Controle vendas, pedidos e crescimento em tempo real.",
            },
            {
              icon: MessageCircle,
              title: "WhatsApp Integrado",
              desc: "Receba pedidos automaticamente pelo WhatsApp.",
            },
            {
              icon: Globe,
              title: "Site Profissional",
              desc: "Tenha um delivery premium igual grandes marcas.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[2rem] border border-[#ECE7E3] bg-white p-8 shadow-sm transition hover:-translate-y-2 hover:shadow-xl"
            >

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF1F4] text-[#6D1F2F]">
                <item.icon size={30} />
              </div>

              <h3 className="mt-8 text-3xl font-black text-black">
                {item.title}
              </h3>

              <p className="mt-5 leading-relaxed text-zinc-600">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}