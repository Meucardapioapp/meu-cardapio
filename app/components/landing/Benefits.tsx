"use client"

import {
  Pizza,
  Beef,
  Soup,
  CakeSlice,
  Drumstick,
  CookingPot,
  Store,
  Sandwich,
  BarChart3,
  CreditCard,
  Palette,
  Smartphone,
  TrendingUp,
} from "lucide-react"

export default function Benefits() {
  return (
    <section
      id="beneficios"
      className="bg-[#F8F6F4] px-4 pb-24"
    >
      <div className="mx-auto max-w-7xl">

        {/* CARDÁPIO IDEAL */}
        <div className="rounded-[2.5rem] border border-[#ECE7E3] bg-white p-6 shadow-sm md:p-10">

          <h2 className="text-center text-3xl font-black text-black md:text-5xl">
            Cardápio{" "}
            <span className="text-[#6D1F2F]">
              ideal
            </span>{" "}
            para:
          </h2>

          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">

            {[
              {
                icon: Beef,
                label: "Hamburguerias",
              },
              {
                icon: Pizza,
                label: "Pizzarias",
              },
              {
                icon: Soup,
                label: "Açaíterias",
                active: true,
              },
              {
                icon: Sandwich,
                label: "Sushi",
              },
              {
                icon: CakeSlice,
                label: "Doces / Bolos",
              },
              {
                icon: CookingPot,
                label: "Marmitarias",
              },
              {
                icon: Drumstick,
                label: "Churrascarias",
              },
              {
                icon: Store,
                label: "E muito mais",
              },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex flex-col items-center justify-center rounded-3xl border p-5 text-center transition hover:-translate-y-1 ${
                  item.active
                    ? "border-[#6D1F2F] bg-[#FFF8FA] shadow-lg"
                    : "border-zinc-200 bg-white shadow-sm"
                }`}
              >
                <div
                  className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${
                    item.active
                      ? "bg-[#6D1F2F] text-white"
                      : "bg-[#F8F6F4] text-[#6D1F2F]"
                  }`}
                >
                  <item.icon size={28} />
                </div>

                <p className="text-sm font-bold text-zinc-800">
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-lg text-zinc-500">
            E qualquer outro tipo de empresa de delivery!
          </p>
        </div>

        {/* DASHBOARD */}
        <div
          id="dashboard"
          className="mt-12 grid gap-10 rounded-[2.5rem] border border-[#ECE7E3] bg-white p-6 shadow-sm lg:grid-cols-[0.9fr_1.4fr] lg:p-10"
        >

          {/* TEXTO */}
          <div className="flex flex-col justify-center">

            <div className="mb-6 inline-flex w-fit items-center rounded-full bg-[#6D1F2F] px-4 py-2 text-sm font-bold text-white">
              BÔNUS EXCLUSIVO
            </div>

            <h2 className="text-4xl font-black leading-tight text-black md:text-5xl">
              Controle total do
              <br />
              seu{" "}
              <span className="text-[#6D1F2F]">
                negócio
              </span>
            </h2>

            <p className="mt-6 text-lg leading-relaxed text-zinc-600">
              Acompanhe vendas, pedidos e crescimento em
              tempo real com um dashboard completo e intuitivo.
            </p>

            <div className="mt-8 space-y-5">

              {[
                "Relatórios de vendas",
                "Pedidos em tempo real",
                "Clientes e histórico",
                "Gráficos de crescimento",
                "E muito mais...",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-4"
                >
                  <div className="h-3 w-3 rounded-full bg-[#6D1F2F]" />

                  <span className="text-lg font-medium text-zinc-700">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* DASHBOARD */}
          <div className="overflow-hidden rounded-[2.5rem] bg-[#09090B] p-5 text-white shadow-2xl">

            {/* HEADER */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>
                <h3 className="text-3xl font-black">
                  Dashboard
                </h3>

                <p className="text-zinc-400">
                  Visão geral do restaurante
                </p>
              </div>

              <div className="flex items-center gap-3">

                <div className="rounded-2xl bg-green-500/20 px-4 py-2 text-sm font-bold text-green-400">
                  +32%
                </div>

                <div className="rounded-2xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300">
                  Últimos 30 dias
                </div>

              </div>
            </div>

            {/* CARDS */}
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

              {[
                {
                  title: "Faturamento",
                  value: "R$ 48.920",
                  growth: "+18%",
                },
                {
                  title: "Pedidos",
                  value: "1.284",
                  growth: "+12%",
                },
                {
                  title: "Clientes",
                  value: "842",
                  growth: "+27%",
                },
                {
                  title: "Ticket Médio",
                  value: "R$ 69,00",
                  growth: "+9%",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="rounded-3xl border border-zinc-800 bg-[#111114] p-5"
                >
                  <p className="text-sm text-zinc-500">
                    {card.title}
                  </p>

                  <h4 className="mt-3 text-4xl font-black">
                    {card.value}
                  </h4>

                  <span className="mt-3 inline-block font-bold text-green-400">
                    {card.growth}
                  </span>
                </div>
              ))}
            </div>

            {/* GRÁFICO + PEDIDOS */}
            <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">

              {/* GRÁFICO */}
              <div className="rounded-3xl border border-zinc-800 bg-[#111114] p-6">

                <div className="mb-8 flex items-center justify-between">

                  <div>

                    <h4 className="text-2xl font-black">
                      Evolução de vendas
                    </h4>

                    <p className="mt-1 text-zinc-500">
                      Últimos 6 meses
                    </p>

                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6D1F2F]/20">
                    <TrendingUp className="text-[#D14A61]" />
                  </div>

                </div>

                {/* LINHA */}
                <div className="relative h-[320px] overflow-hidden rounded-[2rem] border border-zinc-800 bg-[#0A0A0D] p-6">

                  {/* GRID */}
                  <div className="absolute inset-0 flex flex-col justify-between px-6 py-6">

                    {[1,2,3,4,5].map((i) => (
                      <div
                        key={i}
                        className="border-t border-zinc-800/70"
                      />
                    ))}

                  </div>

                  {/* SVG */}
                  <svg
                    className="absolute inset-0 h-full w-full"
                    viewBox="0 0 600 320"
                    preserveAspectRatio="none"
                  >

                    {/* ÁREA */}
                    <path
                      d="
                        M 40 250
                        C 90 220, 120 210, 160 190
                        C 220 160, 250 140, 300 130
                        C 360 110, 390 90, 450 80
                        C 500 70, 530 55, 560 40
                        L 560 320
                        L 40 320
                        Z
                      "
                      fill="url(#gradientArea)"
                      opacity="0.25"
                    />

                    {/* LINHA */}
                    <path
                      d="
                        M 40 250
                        C 90 220, 120 210, 160 190
                        C 220 160, 250 140, 300 130
                        C 360 110, 390 90, 450 80
                        C 500 70, 530 55, 560 40
                      "
                      fill="none"
                      stroke="#D14A61"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />

                    {/* PONTOS */}
                    {[
                      [40,250],
                      [160,190],
                      [300,130],
                      [450,80],
                      [560,40],
                    ].map((point, i) => (
                      <circle
                        key={i}
                        cx={point[0]}
                        cy={point[1]}
                        r="8"
                        fill="#D14A61"
                      />
                    ))}

                    <defs>
                      <linearGradient
                        id="gradientArea"
                        x1="0"
                        x2="0"
                        y1="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#D14A61"
                        />

                        <stop
                          offset="100%"
                          stopColor="#D14A61"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>

                  </svg>

                  {/* MESES */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-around px-8 text-sm text-zinc-500">

                    <span>Jan</span>
                    <span>Fev</span>
                    <span>Mar</span>
                    <span>Abr</span>
                    <span>Mai</span>

                  </div>

                </div>

              </div>

              {/* PEDIDOS */}
              <div className="rounded-3xl border border-zinc-800 bg-[#111114] p-6">

                <h4 className="mb-6 text-2xl font-black">
                  Pedidos recentes
                </h4>

                <div className="space-y-4">

                  {[
                    "Pedido #1254",
                    "Pedido #1253",
                    "Pedido #1252",
                  ].map((pedido, i) => (
                    <div
                      key={pedido}
                      className="flex items-center justify-between rounded-2xl bg-[#1A1A1E] p-4"
                    >

                      <div>

                        <p className="font-semibold">
                          {pedido}
                        </p>

                        <span className="text-sm text-zinc-500">
                          Hoje, 13:{40 + i}
                        </span>

                      </div>

                      <span className="font-bold text-green-400">
                        R$ {89 - i * 12},90
                      </span>

                    </div>
                  ))}

                </div>

                <button className="mt-6 w-full rounded-2xl bg-[#6D1F2F] py-4 font-bold transition hover:bg-[#531723]">
                  Ver todos os pedidos
                </button>

              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  )
}