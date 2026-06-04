"use client"

import Link from "next/link"

import {
  Star,
  MessageCircle,
  Mail,
  ArrowUpRight,
} from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-[#0B0B0D] px-4 pt-24 pb-10 text-white">
      <div className="mx-auto max-w-7xl">

        {/* TOP CTA */}
        <div className="overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#6D1F2F] via-[#7B2335] to-[#43111B] p-8 md:p-14">

          <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">

            <div>
              <div className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur">
                Delivery Premium
              </div>

              <h2 className="mt-6 text-4xl font-black leading-tight md:text-6xl">
                Transforme seu delivery
                <br />
                em uma marca{" "}
                <span className="text-[#FFD6DF]">
                  profissional
                </span>
              </h2>

              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80">
                Tenha um cardápio digital moderno com pagamentos online,
                dashboard completo e uma experiência premium para seus clientes.
              </p>
            </div>

            {/* BOTÃO */}
            <div>
              <Link
  href="/cadastro"
  className="flex items-center gap-3 rounded-2xl bg-white px-8 py-5 text-lg font-black text-[#6D1F2F] shadow-2xl transition hover:scale-[1.03]"
>
  Criar Meu Cardápio

  <ArrowUpRight size={24} />
</Link>
            </div>
          </div>
        </div>

        {/* GRID */}
        <div className="mt-20 grid gap-14 border-b border-white/10 pb-14 md:grid-cols-2 lg:grid-cols-4">

          {/* LOGO */}
          <div>

            <div className="flex items-center gap-4">

              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#6D1F2F] text-3xl font-black">
                V
              </div>

              <div>
                <h3 className="text-2xl font-black">
                  MeuCardapioApp
                </h3>

                <p className="text-zinc-500">
                  Cardápio Digital Premium
                </p>
              </div>
            </div>

            <p className="mt-6 leading-relaxed text-zinc-400">
              Plataforma profissional para restaurantes,
              pizzarias, hamburguerias, açaíterias e qualquer delivery.
            </p>
          </div>

          {/* LINKS */}
          <div>

            <h4 className="text-xl font-black">
              Navegação
            </h4>

            <div className="mt-6 space-y-4">

              {[
                "Benefícios",
                "Dashboard",
                "Depoimentos",
                "Preços",
                "FAQ",
              ].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="block text-zinc-400 transition hover:text-white"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>

          {/* RECURSOS */}
          <div>

            <h4 className="text-xl font-black">
              Recursos
            </h4>

            <div className="mt-6 space-y-4">

              {[
                "Pagamento Online",
                "Cardápio Digital",
                "WhatsApp",
                "Dashboard",
                "Pedidos",
              ].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="block text-zinc-400 transition hover:text-white"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>

          {/* CONTATO */}
          <div>

            <h4 className="text-xl font-black">
              Contato
            </h4>

            <div className="mt-6 space-y-5">

              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
                 <Star size={22} />
                </div>

                <span className="text-zinc-400">
                  @meucardapio.App
                </span>
              </div>

              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
                  <MessageCircle size={22} />
                </div>

                <span className="text-zinc-400">
                  (92) 99233-8863
                </span>
              </div>

              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
                  <Mail size={22} />
                </div>

                <span className="text-zinc-400">
                  contatomeucardapio@gmail.com
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="mt-10 flex flex-col items-center justify-between gap-5 text-center md:flex-row md:text-left">

          <p className="text-zinc-500">
            © 2026 MeuCardapioApp. Todos os direitos reservados.
          </p>

          <div className="flex items-center gap-6 text-zinc-500">

            <a
              href="#"
              className="transition hover:text-white"
            >
              Termos
            </a>

            <a
              href="#"
              className="transition hover:text-white"
            >
              Privacidade
            </a>

            <a
              href="#"
              className="transition hover:text-white"
            >
              Suporte
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}