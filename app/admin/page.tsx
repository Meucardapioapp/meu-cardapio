"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  ShoppingBag,
  Package,
  Clock3,
  ArrowRight,
  CalendarDays,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function DashboardPage() {
  const [restaurante, setRestaurante] = useState<any>(null);
  const [faturamentoHoje, setFaturamentoHoje] = useState(0);
const [pedidosHoje, setPedidosHoje] = useState(0);
const [produtosVendidos, setProdutosVendidos] = useState(0);
const [pedidosPendentes, setPedidosPendentes] = useState(0);
const [periodo, setPeriodo] = useState(() => {
  if (typeof window === "undefined") return 1;

  const periodoSalvo = localStorage.getItem("dashboard_periodo");

  return periodoSalvo ? Number(periodoSalvo) : 1;
});

const [grafico, setGrafico] = useState<
  {
    data: string;
    valor: number;
  }[]
>([]);

const [totalPeriodo, setTotalPeriodo] = useState(0);

useEffect(() => {
  carregarDashboard();
}, [periodo]);

useEffect(() => {
  carregarRestaurante();
}, []);

async function carregarRestaurante() {
  const res = await fetch("/api/admin/restaurante");

  const data = await res.json();

  setRestaurante(data);
}

async function carregarDashboard() {
 
const restauranteId = localStorage.getItem("restaurante_id");

if (!restauranteId) return;

  const hoje = new Date();

  hoje.setHours(0, 0, 0, 0);

  const amanha = new Date(hoje);

  amanha.setDate(amanha.getDate() + 1);

const inicioPeriodo = new Date();

inicioPeriodo.setHours(0, 0, 0, 0);

inicioPeriodo.setDate(
  inicioPeriodo.getDate() - (periodo - 1)
);

const fimPeriodo = new Date();
fimPeriodo.setHours(23, 59, 59, 999);

const { data: pedidos, error } = await supabase
  .from("pedidos")
  .select("*")
  .eq("restaurante_id", restauranteId)
  .neq("status", "cancelado")
  .or(
    "payment_method.eq.cash,payment_method.eq.card_delivery,payment_status.eq.approved"
  )
  .gte("created_at", inicioPeriodo.toISOString())
  .lte("created_at", fimPeriodo.toISOString())
  .order("created_at");

if (error) {
  console.error("Erro ao carregar dashboard:", error);
  return;
}

if (!pedidos) return;

console.log("PERÍODO:", {
  periodo,
  inicioPeriodo: inicioPeriodo.toISOString(),
  fimPeriodo: fimPeriodo.toISOString(),
});

console.log(
  "PEDIDOS RETORNADOS:",
  pedidos.map((p: any) => ({
    id: p.id,
    created_at: p.created_at,
    status: p.status,
    total: p.total,
  }))
);

// TODOS OS CARDS USAM O PERÍODO SELECIONADO

setPedidosHoje(pedidos.length);

setPedidosPendentes(
  pedidos.filter(
    (p: any) =>
      p.status !== "concluido" &&
      p.status !== "cancelado"
  ).length
);

let faturamento = 0;
let produtos = 0;

pedidos.forEach((pedido: any) => {
  faturamento += Number(pedido.total || 0);

  if (Array.isArray(pedido.itens)) {
    pedido.itens.forEach((item: any) => {
      produtos += Number(item.quantidade || 1);
    });
  }
});

setFaturamentoHoje(faturamento);
setProdutosVendidos(produtos);

 const mapaDias: Record<string, number> = {};

pedidos.forEach((pedido: any) => {
  const chave = new Date(pedido.created_at)
    .toISOString()
    .slice(0, 10);

  mapaDias[chave] =
    (mapaDias[chave] || 0) +
    Number(pedido.total || 0);
});

const resultado = [];

for (let i = periodo - 1; i >= 0; i--) {
  const data = new Date();

  data.setHours(0, 0, 0, 0);
  data.setDate(data.getDate() - i);

  const chave = data.toISOString().slice(0, 10);

  resultado.push({
    data: data.toLocaleDateString("pt-BR"),
    valor: mapaDias[chave] || 0,
  });
}

if (periodo === 1 && resultado.length === 1) {
  const valorHoje = resultado[0].valor;

  setGrafico([
    {
      data: "Início do dia",
      valor: valorHoje,
    },
    {
      data: "Hoje",
      valor: valorHoje,
    },
  ]);
} else {
  setGrafico(resultado);
}

const total = resultado.reduce(
  (acc, item) => acc + item.valor,
  0
);

setTotalPeriodo(total);

}

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-[32px] font-black tracking-tight text-[#22181C]">
            Boas vendas hoje 👋
          </h1>

          <p className="text-zinc-500 mt-1 text-sm">
            Aqui está o que está acontecendo no seu restaurante hoje.
          </p>

        </div>

        <div className="flex items-center gap-4">

          <button
            className="
            h-11
            px-5
            rounded-2xl
            bg-white
            border
            border-zinc-200
            shadow-sm
            flex
            items-center
            gap-3
            font-semibold
            hover:border-[#7A1F3D]
            transition
            "
          >
            <CalendarDays size={20} />

            {new Date().toLocaleDateString("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
})}
          </button>


        </div>

      </div>

      {/* SELETOR DE PERÍODO */}

      <div className="bg-white rounded-[22px] border border-zinc-100 shadow-sm p-4">

        <p className="font-bold text-[#22181C] mb-4">
          Período
        </p>

        <div className="flex flex-wrap items-center gap-3">

          {[
            { valor: 1, label: "Hoje" },
            { valor: 7, label: "Últimos 7 dias" },
            { valor: 30, label: "Últimos 30 dias" },
            { valor: 90, label: "Últimos 90 dias" },
            { valor: 365, label: "Últimos 365 dias" },
          ].map((item) => (
            <button
              key={item.valor}
              onClick={() => {
  setPeriodo(item.valor);
  localStorage.setItem(
    "dashboard_periodo",
    String(item.valor)
  );
}}
              className={`
                h-10 px-5 rounded-xl border text-sm font-semibold transition-all
                ${
                  periodo === item.valor
                    ? "bg-[#7A1F3D] text-white border-[#7A1F3D] shadow-sm"
                    : "bg-[#FAFAFA] text-[#22181C] border-zinc-200 hover:border-[#7A1F3D]"
                }
              `}
            >
              {item.label}
            </button>
          ))}

        </div>

      </div>

      {/* CARDS */}

      <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-4">

        {/* FATURAMENTO */}

        <div className="bg-white rounded-[22px] border border-zinc-100 shadow-sm p-5">

          <div className="flex items-center justify-between">

            <div
              className="
              w-12
              h-12
              rounded-full
              bg-[#FDECEE]
              flex
              items-center
              justify-center
              "
            >
              <DollarSign
                className="text-[#B4234A]"
                size={30}
              />
            </div>

          </div>

          <p className="mt-3 text-sm text-zinc-500 text-sm font-medium">
             Faturamento no período
          </p>

          <h2 className="text-xl font-black mt-1">
            {faturamentoHoje.toLocaleString("pt-BR", {
  style: "currency",
  currency: "BRL",
})}
          </h2>


        </div>

        {/* PEDIDOS */}

        <div className="bg-white rounded-[28px] border border-zinc-100 shadow-sm p-5">

          <div
            className="
            w-12
            h-12
            rounded-full
            bg-[#F2EBFF]
            flex
            items-center
            justify-center
            "
          >
            <ShoppingBag
              className="text-[#7A1F3D]"
              size={28}
            />
          </div>

          <p className="mt-3 text-sm text-zinc-500 text-sm font-medium">
             Pedidos no período
          </p>

          <h2 className="text-xl font-black mt-1">
            {pedidosHoje}
          </h2>

        </div>

        {/* PENDENTES */}

        <div className="bg-white rounded-[28px] border border-zinc-100 shadow-sm p-5">

          <div
            className="
            w-12
            h-12
            rounded-full
            bg-[#FFF2EC]
            flex
            items-center
            justify-center
            "
          >
            <Clock3
              className="text-orange-500"
              size={28}
            />
          </div>

          <p className="mt-3 text-sm text-zinc-500 text-sm font-medium">
            Pedidos pendentes
          </p>

          <h2 className="text-xl font-black mt-1">
            {pedidosPendentes}

          </h2>

          <div className="mt-3 text-sm">

            <span className="text-orange-500 font-semibold">
              Aguardando preparo
            </span>

          </div>

        </div>

      </div>

      {/* GRID PRINCIPAL */}

      <div>

                {/* GRÁFICO */}

        <div className="col-span-1"> 

          <div className="bg-white rounded-[30px] border border-zinc-100 shadow-sm p-5 h-full">

            <div className="flex items-center justify-between mb-5">

              <div>

                <h2 className="text-xl font-bold text-[#22181C]">
  Faturamento nos últimos {periodo} dias
</h2>

                <p className="text-zinc-500 text-sm mt-1">
                  Acompanhe a evolução do faturamento.
                </p>

              </div>



            </div>

            {/* PLACEHOLDER DO GRÁFICO */}

            <div className="h-[280px]">
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={grafico}>
      <defs>
        <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#7A1F3D" stopOpacity={0.25} />
          <stop offset="95%" stopColor="#7A1F3D" stopOpacity={0} />
        </linearGradient>
      </defs>

      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />

      <XAxis
        dataKey="data"
        tick={{ fontSize: 12 }}
      />

<YAxis
  width={75}
  tick={{ fontSize: 11 }}
  tickFormatter={(value) => {
    const v = Number(value);

    if (v >= 1000000) {
      return `R$ ${(v / 1000000).toLocaleString("pt-BR", {
        maximumFractionDigits: 1,
      })} mi`;
    }

    if (v >= 1000) {
      return `R$ ${(v / 1000).toLocaleString("pt-BR", {
        maximumFractionDigits: 1,
      })} mil`;
    }

    return `R$ ${v.toLocaleString("pt-BR")}`;
  }}
/>

  <Tooltip
  formatter={(value) => [
    Number(value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    }),
    "Faturamento",
  ]}
/>

      <Area
        type="monotone"
        dataKey="valor"
        stroke="#7A1F3D"
        strokeWidth={4}
        fill="url(#colorValor)"
      />
    </AreaChart>
  </ResponsiveContainer>
</div>
</div>
</div>

            {/* AÇÕES RÁPIDAS */}

      <div
        className="
        mt-5
        bg-white
        rounded-[30px]
        border
        border-zinc-100
        shadow-sm
        p-5
        "
      >

        <div className="flex items-center justify-between mb-5">

          <div>

            <h2
              className="
              text-xl
              font-bold
              text-[#22181C]
              "
            >
              Ações rápidas
            </h2>

            <p
              className="
              text-zinc-500
              mt-2
              "
            >
              Acesse rapidamente as áreas mais utilizadas.
            </p>

          </div>

        </div>

        <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-4">

          <Link
            href="/admin/produtos"
            className="
            group
            bg-[#FAFAFA]
            rounded-[18px]
            border
            border-zinc-100
            p-4
            hover:border-[#7A1F3D]
            hover:shadow-md
            transition-all
            "
          >

            <div
              className="
              w-10
              h-11
              rounded-2xl
              bg-[#FDECEE]
              flex
              items-center
              justify-center
              "
            >

              <Package
                className="text-[#B4234A]"
              />

            </div>

            <h3 className="font-bold text-base mt-4">
              Produtos
            </h3>

            <p className="text-zinc-500 text-sm mt-1">
              Cadastre e gerencie os produtos.
            </p>

            <ArrowRight
              className="
              mt-4
              group-hover:translate-x-1
              transition
              "
            />

          </Link>

          <Link
            href="/admin/pedidos"
            className="
            group
            bg-[#FAFAFA]
            rounded-[18px]
            border
            border-zinc-100
            p-4
            hover:border-[#7A1F3D]
            hover:shadow-md
            transition-all
            "
          >

            <div
              className="
              w-10
              h-11
              rounded-2xl
              bg-[#F2EBFF]
              flex
              items-center
              justify-center
              "
            >

              <ShoppingBag
                className="text-[#7A1F3D]"
              />

            </div>

            <h3 className="font-bold text-base mt-4">
              Pedidos
            </h3>

            <p className="text-zinc-500 text-sm mt-1">
              Acompanhe os pedidos em tempo real.
            </p>

            <ArrowRight
              className="
              mt-4
              group-hover:translate-x-1
              transition
              "
            />

          </Link>

          <Link
            href="/admin/link-cardapio"
            className="
            group
            bg-[#FAFAFA]
            rounded-[18px]
            border
            border-zinc-100
            p-4
            hover:border-[#7A1F3D]
            hover:shadow-md
            transition-all
            "
          >

            <div
              className="
              w-10
              h-11
              rounded-2xl
              bg-[#ECFFF2]
              flex
              items-center
              justify-center
              "
            >

              <ArrowRight
                className="text-green-600"
              />

            </div>

            <h3 className="font-bold text-base mt-4">
              Link do Cardápio
            </h3>

            <p className="text-zinc-500 text-sm mt-1">
              Compartilhe seu cardápio digital.
            </p>

            <ArrowRight
              className="
              mt-4
              group-hover:translate-x-1
              transition
              "
            />

          </Link>

          <Link
            href="/admin/aparencia"
            className="
            group
            bg-[#FAFAFA]
            rounded-[18px]
            border
            border-zinc-100
            p-4
            hover:border-[#7A1F3D]
            hover:shadow-md
            transition-all
            "
          >

            <div
              className="
              w-10
              h-11
              rounded-2xl
              bg-[#FFF2EC]
              flex
              items-center
              justify-center
              "
            >

              <Clock3
                className="text-orange-500"
              />

            </div>

            <h3 className="font-bold text-base mt-4">
              Aparência
            </h3>

            <p className="text-zinc-500 text-sm mt-1">
              Personalize o visual do cardápio.
            </p>

            <ArrowRight
              className="
              mt-4
              group-hover:translate-x-1
              transition
              "
            />

          </Link>

        </div>

      </div>

    </div>

  </div>
  );
}