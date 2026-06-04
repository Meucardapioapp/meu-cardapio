"use client"

import Link from "next/link"

import {
  Check,
  Crown,
} from "lucide-react"

export default function Pricing() {
  return (
    <section
      id="precos"
      className="bg-[#F8F6F4] px-4 pb-24"
    >
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="text-center">

          <div className="inline-flex rounded-full bg-[#FFF1F4] px-4 py-2 text-sm font-bold text-[#6D1F2F]">
            Plano Premium
          </div>

          <h2 className="mt-6 text-4xl font-black leading-tight text-black md:text-6xl">
            Um preço simples
            <br />
            para crescer seu{" "}
            <span className="text-[#6D1F2F]">
              delivery
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600">
            Sem taxas escondidas, Apenas uma plataforma premium para seu negócio.
          </p>
        </div>

        {/* CARD */}
        <div className="mx-auto mt-16 max-w-5xl">

          <div className="grid overflow-hidden rounded-[2.5rem] border border-[#ECE7E3] bg-white shadow-xl lg:grid-cols-[1fr_420px]">

            {/* ESQUERDA */}
            <div className="p-8 md:p-12">

              <div className="flex flex-wrap items-center gap-4">

                <div className="rounded-full bg-[#FFF1F4] px-4 py-2 text-sm font-bold text-[#6D1F2F]">
                  Premium
                </div>

                <div className="rounded-full bg-[#6D1F2F] px-4 py-2 text-sm font-bold text-white">
                  Mais escolhido
                </div>
              </div>

              <div className="mt-8 flex items-end gap-2">

                <span className="text-6xl font-black text-black md:text-7xl">
                  R$59,90
                </span>

                <span className="mb-2 text-xl text-zinc-500">
                  /mês
                </span>
              </div>

              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600">
                Tenha um cardápio digital profissional com pagamentos online,
                dashboard completo e suporte premium para o seu delivery.
              </p>

              {/* BENEFÍCIOS */}
              <div className="mt-10 grid gap-5 md:grid-cols-2">

                {[
                  "Cardápio digital ilimitado",
                  "Pagamento online integrado",
                  "Aceita Pix e cartão",
                  "Dashboard financeiro",
                  "Personalização completa",
                  "Pedidos ilimitados",
                  "WhatsApp integrado",
                  "Suporte premium",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-4"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#6D1F2F] text-white">
                      <Check size={16} />
                    </div>

                    <span className="font-medium text-zinc-700">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* DIREITA */}
            <div className="bg-gradient-to-br from-[#6D1F2F] to-[#43111B] p-8 text-white md:p-12">

              <div className="flex items-center gap-3">

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                  <Crown size={28} />
                </div>

                <div>
                  <p className="text-sm uppercase tracking-widest text-zinc-300">
                    Plano
                  </p>

                  <h3 className="text-3xl font-black">
                    Premium
                  </h3>
                </div>
              </div>

              <div className="mt-10 space-y-5">

                {[
                  "Setup rápido",
                  "Domínio personalizado",
                  "Atualizações constantes",
                  "Mobile premium",
                  "Performance otimizada",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="h-3 w-3 rounded-full bg-green-400" />

                    <span className="font-medium">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <Link
  href="/cadastro"
  className="mt-10 flex w-full items-center justify-center rounded-2xl bg-white py-5 text-lg font-black text-[#6D1F2F] transition hover:scale-[1.02]"
>
  Criar Meu Cardápio
</Link>

              <p className="mt-5 text-center text-sm text-zinc-300">
                Comece hoje mesmo seu delivery profissional.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}