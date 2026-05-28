"use client"

import {
  BarChart3,
  ShoppingBag,
  Users,
  DollarSign,
  TrendingUp,
  Clock3,
} from "lucide-react"

export default function DashboardPreview() {
  return (
    <section className="bg-[#F8F6F4] px-4 py-24">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="text-center">

          <div className="inline-flex rounded-full bg-[#FFF1F4] px-4 py-2 text-sm font-bold text-[#6D1F2F]">
            Dashboard Premium
          </div>

          <h2 className="mt-6 text-4xl font-black leading-tight text-black md:text-6xl">
            Controle total do seu{" "}
            <span className="text-[#6D1F2F]">
              delivery
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-zinc-600">
            Acompanhe pedidos, faturamento, crescimento e clientes
            em tempo real através de um dashboard moderno.
          </p>
        </div>

        {/* DASHBOARD */}
        <div className="mt-16 overflow-hidden rounded-[2.8rem] border border-zinc-800 bg-[#09090B] p-5 shadow-[0_25px_80px_rgba(0,0,0,0.35)] md:p-10">

          {/* TOP */}
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <h3 className="text-3xl font-black text-white md:text-5xl">
                Dashboard Financeiro
              </h3>

              <p className="mt-2 text-zinc-400">
                Visão geral do restaurante
              </p>
            </div>

            <div className="flex flex-wrap gap-3">

              <div className="rounded-2xl bg-green-500/15 px-5 py-3 text-sm font-bold text-green-400">
                +32% crescimento
              </div>

              <div className="rounded-2xl border border-zinc-700 bg-[#111114] px-5 py-3 text-sm font-medium text-zinc-300">
                Últimos 30 dias
              </div>

            </div>

          </div>

          {/* CARDS */}
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">

            {[
              {
                icon: DollarSign,
                title: "Faturamento",
                value: "R$ 48.920",
                growth: "+18%",
              },
              {
                icon: ShoppingBag,
                title: "Pedidos",
                value: "1.284",
                growth: "+12%",
              },
              {
                icon: Users,
                title: "Clientes",
                value: "842",
                growth: "+27%",
              },
              {
                icon: TrendingUp,
                title: "Ticket Médio",
                value: "R$ 69,00",
                growth: "+9%",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-[2rem] border border-zinc-800 bg-gradient-to-b from-[#141418] to-[#101014] p-6 shadow-xl"
              >

                <div className="flex items-center justify-between">

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6D1F2F]/20 text-[#D14A61]">
                    <card.icon size={28} />
                  </div>

                  <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm font-bold text-green-400">
                    {card.growth}
                  </span>

                </div>

                <p className="mt-6 text-zinc-500">
                  {card.title}
                </p>

                <h4 className="mt-3 text-4xl font-black text-white">
                  {card.value}
                </h4>

              </div>
            ))}
          </div>

          {/* GRID */}
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">

            {/* GRÁFICO */}
            <div className="rounded-[2rem] border border-zinc-800 bg-gradient-to-b from-[#111114] to-[#0E0E11] p-6">

              <div className="mb-10 flex items-center justify-between">

                <div>

                  <h4 className="text-2xl font-black text-white">
                    Evolução de vendas
                  </h4>

                  <p className="mt-1 text-zinc-500">
                    Últimos 6 meses
                  </p>

                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6D1F2F]/20 text-[#D14A61]">
                  <BarChart3 size={28} />
                </div>

              </div>

              {/* ÁREA DO GRÁFICO */}
              <div className="relative h-[320px] w-full overflow-hidden rounded-[1.5rem] border border-zinc-800 bg-[#0A0A0D] p-6">

                {/* LINHAS */}
                <div className="absolute inset-0 flex flex-col justify-between px-6 py-6">

                  {[1,2,3,4,5].map((i) => (
                    <div
                      key={i}
                      className="border-t border-zinc-800/70"
                    />
                  ))}

                </div>

                {/* BARRAS */}
                <div className="relative z-10 flex h-full items-end gap-4">

                  {[
                    25,
                    40,
                    55,
                    72,
                    90,
                    100,
                  ].map((item, i) => (

                    <div
                      key={i}
                      className="flex h-full flex-1 flex-col items-center justify-end"
                    >

                      <div
                        className="w-full rounded-t-[1.5rem] bg-gradient-to-t from-[#6D1F2F] via-[#9D3047] to-[#D14A61] shadow-[0_0_25px_rgba(209,74,97,0.4)] transition-all duration-1000"
                        style={{
                          height: `${item}%`,
                          minHeight: "40px",
                        }}
                      />

                      <span className="mt-4 text-sm font-medium text-zinc-500">
                        {
                          [
                            "Jan",
                            "Fev",
                            "Mar",
                            "Abr",
                            "Mai",
                            "Jun",
                          ][i]
                        }
                      </span>

                    </div>

                  ))}

                </div>

              </div>

            </div>

            {/* PEDIDOS */}
            <div className="rounded-[2rem] border border-zinc-800 bg-gradient-to-b from-[#111114] to-[#0E0E11] p-6">

              <div className="mb-8 flex items-center justify-between">

                <div>

                  <h4 className="text-2xl font-black text-white">
                    Pedidos
                  </h4>

                  <p className="mt-1 text-zinc-500">
                    Recentes
                  </p>

                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6D1F2F]/20 text-[#D14A61]">
                  <Clock3 size={28} />
                </div>

              </div>

              <div className="space-y-4">

                {[
                  {
                    id: "#1254",
                    price: "R$ 89,90",
                  },
                  {
                    id: "#1253",
                    price: "R$ 64,90",
                  },
                  {
                    id: "#1252",
                    price: "R$ 102,90",
                  },
                  {
                    id: "#1251",
                    price: "R$ 48,90",
                  },
                ].map((item) => (

                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-[#18181C] p-4 transition hover:border-[#6D1F2F]"
                  >

                    <div>

                      <p className="font-bold text-white">
                        Pedido {item.id}
                      </p>

                      <span className="text-sm text-zinc-500">
                        Hoje • 13:45
                      </span>

                    </div>

                    <span className="font-black text-green-400">
                      {item.price}
                    </span>

                  </div>

                ))}

              </div>

              <button className="mt-6 w-full rounded-2xl bg-[#6D1F2F] py-4 text-lg font-black text-white transition hover:scale-[1.01] hover:bg-[#531723]">
                Ver todos os pedidos
              </button>

            </div>

          </div>

        </div>

      </div>
    </section>
  )
}