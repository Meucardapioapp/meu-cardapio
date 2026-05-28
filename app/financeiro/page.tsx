"use client"

import {
  DollarSign,
  ShoppingBag,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
} from "lucide-react"

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
} from "recharts"

import { getThemeSettings } from "@/app/lib/theme"

const vendas = [
  { dia: "Seg", total: 120 },
  { dia: "Ter", total: 280 },
  { dia: "Qua", total: 180 },
  { dia: "Qui", total: 350 },
  { dia: "Sex", total: 490 },
  { dia: "Sab", total: 620 },
  { dia: "Dom", total: 430 },
]

const pedidosRecentes = [
  {
    cliente: "Carlos Henrique",
    valor: "R$ 84,90",
    status: "Pago",
  },
  {
    cliente: "Mariana Souza",
    valor: "R$ 42,00",
    status: "Pago",
  },
  {
    cliente: "Pedro Lucas",
    valor: "R$ 129,90",
    status: "Pendente",
  },
  {
    cliente: "Fernanda Lima",
    valor: "R$ 64,50",
    status: "Pago",
  },
]

export default function FinanceiroPage() {
  const { lightMode, selectedColor } = getThemeSettings()

  const bgPage = lightMode ? "#F6F3EE" : "#09090B"
  const cardBg = lightMode ? "#FFFFFF" : "#18181B"
  const borderColor = lightMode ? "#E7E5E4" : "#27272A"

  const textPrimary = lightMode ? "#18181B" : "#FFFFFF"
  const textSecondary = lightMode ? "#71717A" : "#A1A1AA"

  return (
    <div
      className="min-h-screen p-6 md:p-10"
      style={{
        backgroundColor: bgPage,
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
          <div>
            <h1
              className="text-4xl font-black tracking-tight"
              style={{
                color: textPrimary,
              }}
            >
              Financeiro
            </h1>

            <p
              className="mt-2 text-base"
              style={{
                color: textSecondary,
              }}
            >
              Controle financeiro e desempenho do restaurante
            </p>
          </div>

          <div className="flex gap-3">
            <button
              className="px-5 py-3 rounded-2xl font-semibold transition hover:scale-[1.02]"
              style={{
                backgroundColor: cardBg,
                border: `1px solid ${borderColor}`,
                color: textPrimary,
              }}
            >
              Últimos 7 dias
            </button>

            <button
              className="px-5 py-3 rounded-2xl font-bold transition hover:scale-[1.02]"
              style={{
                backgroundColor: selectedColor,
                color: "#fff",
              }}
            >
              Exportar Relatório
            </button>
          </div>
        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          <MetricCard
            title="Faturamento"
            value="R$ 12.480"
            growth="+18%"
            icon={<DollarSign size={22} />}
            color={selectedColor}
            cardBg={cardBg}
            borderColor={borderColor}
            textPrimary={textPrimary}
            textSecondary={textSecondary}
          />

          <MetricCard
            title="Pedidos"
            value="328"
            growth="+12%"
            icon={<ShoppingBag size={22} />}
            color={selectedColor}
            cardBg={cardBg}
            borderColor={borderColor}
            textPrimary={textPrimary}
            textSecondary={textSecondary}
          />

          <MetricCard
            title="Clientes"
            value="184"
            growth="+7%"
            icon={<Users size={22} />}
            color={selectedColor}
            cardBg={cardBg}
            borderColor={borderColor}
            textPrimary={textPrimary}
            textSecondary={textSecondary}
          />

          <MetricCard
            title="Ticket Médio"
            value="R$ 38"
            growth="-2%"
            negative
            icon={<Wallet size={22} />}
            color={selectedColor}
            cardBg={cardBg}
            borderColor={borderColor}
            textPrimary={textPrimary}
            textSecondary={textSecondary}
          />
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* GRAFICO */}
          <div
            className="xl:col-span-2 rounded-3xl p-6"
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${borderColor}`,
            }}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2
                  className="text-2xl font-bold"
                  style={{
                    color: textPrimary,
                  }}
                >
                  Vendas da Semana
                </h2>

                <p
                  className="mt-1 text-sm"
                  style={{
                    color: textSecondary,
                  }}
                >
                  Comparativo diário de faturamento
                </p>
              </div>

              <div
                className="flex items-center gap-2 px-4 py-2 rounded-2xl"
                style={{
                  backgroundColor: `${selectedColor}20`,
                  color: selectedColor,
                }}
              >
                <TrendingUp size={18} />
                <span className="font-bold">+18%</span>
              </div>
            </div>

            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={vendas}>
                  <defs>
                    <linearGradient
                      id="color"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={selectedColor}
                        stopOpacity={0.4}
                      />

                      <stop
                        offset="100%"
                        stopColor={selectedColor}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <XAxis
                    dataKey="dia"
                    tick={{
                      fill: textSecondary,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip />

                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke={selectedColor}
                    fill="url(#color)"
                    strokeWidth={4}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* PEDIDOS RECENTES */}
          <div
            className="rounded-3xl p-6"
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${borderColor}`,
            }}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2
                  className="text-2xl font-bold"
                  style={{
                    color: textPrimary,
                  }}
                >
                  Pedidos Recentes
                </h2>

                <p
                  className="mt-1 text-sm"
                  style={{
                    color: textSecondary,
                  }}
                >
                  Últimos pedidos realizados
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {pedidosRecentes.map((pedido, index) => (
                <div
                  key={index}
                  className="rounded-2xl p-4 transition hover:scale-[1.01]"
                  style={{
                    backgroundColor: lightMode
                      ? "#FAFAF9"
                      : "#09090B",
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className="font-bold"
                        style={{
                          color: textPrimary,
                        }}
                      >
                        {pedido.cliente}
                      </p>

                      <p
                        className="text-sm mt-1"
                        style={{
                          color: textSecondary,
                        }}
                      >
                        {pedido.valor}
                      </p>
                    </div>

                    <div
                      className="px-3 py-1 rounded-xl text-sm font-bold"
                      style={{
                        backgroundColor:
                          pedido.status === "Pago"
                            ? `${selectedColor}20`
                            : "#F59E0B20",

                        color:
                          pedido.status === "Pago"
                            ? selectedColor
                            : "#F59E0B",
                      }}
                    >
                      {pedido.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  title,
  value,
  growth,
  icon,
  color,
  cardBg,
  borderColor,
  textPrimary,
  textSecondary,
  negative,
}: any) {
  return (
    <div
      className="
        rounded-3xl
        p-6
        transition-all
        hover:scale-[1.02]
        hover:-translate-y-1
      "
      style={{
        backgroundColor: cardBg,
        border: `1px solid ${borderColor}`,
      }}
    >
      <div className="flex items-start justify-between">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{
            backgroundColor: color,
            color: "#fff",
          }}
        >
          {icon}
        </div>

        <div
          className="flex items-center gap-1 text-sm font-bold"
          style={{
            color: negative ? "#EF4444" : "#22C55E",
          }}
        >
          {negative ? (
            <ArrowDownRight size={16} />
          ) : (
            <ArrowUpRight size={16} />
          )}

          {growth}
        </div>
      </div>

      <div className="mt-8">
        <p
          className="text-sm"
          style={{
            color: textSecondary,
          }}
        >
          {title}
        </p>

        <h3
          className="text-4xl font-black mt-2 tracking-tight"
          style={{
            color: textPrimary,
          }}
        >
          {value}
        </h3>
      </div>
    </div>
  )
}