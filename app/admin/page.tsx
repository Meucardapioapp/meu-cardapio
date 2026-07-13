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
  Plus,
  TrendingUp,
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
const [periodo, setPeriodo] = useState(30);

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

inicioPeriodo.setDate(
  inicioPeriodo.getDate() - periodo
);

const { data: pedidos } = await supabase
  .from("pedidos")
  .select("*")
  .eq("restaurante_id", restauranteId)
  .or(
  "payment_method.eq.cash,payment_status.eq.approved"
)
  .gte(
    "created_at",
    inicioPeriodo.toISOString()
  )
  .order("created_at");

  if (!pedidos) return;

  const pedidosHojeLista = pedidos.filter((pedido: any) => {
  const dataPedido = new Date(pedido.created_at);

  return dataPedido >= hoje && dataPedido < amanha;
});

  setPedidosHoje(pedidosHojeLista.length);

  setPedidosPendentes(
  pedidosHojeLista.filter(
    (p: any) =>
      p.status !== "concluido" &&
      p.status !== "cancelado"
  ).length
);

  let faturamento = 0;
  let produtos = 0;

  pedidosHojeLista.forEach((pedido: any) => {
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

setGrafico(resultado);

const total = resultado.reduce(
  (acc, item) => acc + item.valor,
  0
);

setTotalPeriodo(total);

}

  return (
    <div className="space-y-10">

      {/* HEADER */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-[44px] font-black tracking-tight text-[#22181C]">
            Boas vendas hoje 👋
          </h1>

          <p className="text-zinc-500 mt-2 text-lg">
            Aqui está o que está acontecendo no seu restaurante hoje.
          </p>

        </div>

        <div className="flex items-center gap-4">

          <button
            className="
            h-14
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

          <button
            className="
            h-14
            px-7
            rounded-2xl
            bg-gradient-to-r
            from-[#7A1F3D]
            to-[#5A1B33]
            text-white
            font-bold
            flex
            items-center
            gap-2
            shadow-lg
            hover:scale-[1.02]
            transition
            "
          >
            <Plus size={20} />

            Novo Pedido
          </button>

        </div>

      </div>

      {/* CARDS */}

      <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-6">

        {/* FATURAMENTO */}

        <div className="bg-white rounded-[28px] border border-zinc-100 shadow-sm p-7">

          <div className="flex items-center justify-between">

            <div
              className="
              w-16
              h-16
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

          <p className="mt-6 text-zinc-500 font-medium">
            Faturamento hoje
          </p>

          <h2 className="text-5xl font-black mt-2">
            {faturamentoHoje.toLocaleString("pt-BR", {
  style: "currency",
  currency: "BRL",
})}
          </h2>

          <div className="flex items-center gap-2 mt-4">

            <TrendingUp
              size={18}
              className="text-green-600"
            />

            <span className="text-green-600 font-bold">
              0%
            </span>

            <span className="text-zinc-400">
              vs ontem
            </span>

          </div>

        </div>

        {/* PEDIDOS */}

        <div className="bg-white rounded-[28px] border border-zinc-100 shadow-sm p-7">

          <div
            className="
            w-16
            h-16
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

          <p className="mt-6 text-zinc-500 font-medium">
            Pedidos hoje
          </p>

          <h2 className="text-5xl font-black mt-2">
            {pedidosHoje}
          </h2>

          <div className="flex items-center gap-2 mt-4">

            <TrendingUp
              size={18}
              className="text-green-600"
            />

            <span className="text-green-600 font-bold">
              0%
            </span>

            <span className="text-zinc-400">
              vs ontem
            </span>

          </div>

        </div>

        {/* PRODUTOS */}

        <div className="bg-white rounded-[28px] border border-zinc-100 shadow-sm p-7">

          <div
            className="
            w-16
            h-16
            rounded-full
            bg-[#ECFFF2]
            flex
            items-center
            justify-center
            "
          >
            <Package
              className="text-green-600"
              size={28}
            />
          </div>

          <p className="mt-6 text-zinc-500 font-medium">
            Produtos vendidos
          </p>

          <h2 className="text-5xl font-black mt-2">
            {produtosVendidos}
          </h2>

          <div className="flex items-center gap-2 mt-4">

            <TrendingUp
              size={18}
              className="text-green-600"
            />

            <span className="text-green-600 font-bold">
              0%
            </span>

            <span className="text-zinc-400">
              vs ontem
            </span>

          </div>

        </div>

        {/* PENDENTES */}

        <div className="bg-white rounded-[28px] border border-zinc-100 shadow-sm p-7">

          <div
            className="
            w-16
            h-16
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

          <p className="mt-6 text-zinc-500 font-medium">
            Pedidos pendentes
          </p>

          <h2 className="text-5xl font-black mt-2">
            {pedidosPendentes}

          </h2>

          <div className="mt-4">

            <span className="text-orange-500 font-semibold">
              Aguardando preparo
            </span>

          </div>

        </div>

      </div>

      {/* GRID PRINCIPAL */}

      <div className="grid xl:grid-cols-[1fr_340px] gap-6"> 

                {/* GRÁFICO */}

        <div className="col-span-1"> 

          <div className="bg-white rounded-[30px] border border-zinc-100 shadow-sm p-8 h-full">

            <div className="flex items-center justify-between mb-10">

              <div>

                <h2 className="text-3xl font-bold text-[#22181C]">
  Faturamento nos últimos {periodo} dias
</h2>

                <p className="text-zinc-500 mt-2">
                  Acompanhe a evolução do faturamento.
                </p>

              </div>

<select
  value={periodo}
  onChange={(e) => setPeriodo(Number(e.target.value))}
  className="
  h-11
  px-4
  rounded-xl
  border
  border-zinc-200
  bg-white
  text-sm
  "
>
  <option value={7}>Últimos 7 dias</option>
  <option value={30}>Últimos 30 dias</option>
  <option value={90}>Últimos 90 dias</option>
  <option value={365}>Últimos 365 dias</option>
</select>

            </div>

            {/* PLACEHOLDER DO GRÁFICO */}

            <div className="h-[430px]">
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
  tickFormatter={(v) => `R$ ${Number(v)}`}
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
                {/* COLUNA DIREITA */}

       <div className="space-y-6"> 

          {/* TOTAL DO PERÍODO */}

          <div
            className="
            bg-white
            rounded-[30px]
            border
            border-zinc-100
            shadow-sm
            p-7
            "
          >

            <p className="text-zinc-500 font-medium">
              Total do período
            </p>

<h2
  className="
  text-5xl
  font-black
  mt-3
  tracking-tight
  "
>
  {totalPeriodo.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })}
</h2>

            <div
              className="
              mt-6
              flex
              items-center
              gap-2
              "
            >

              <div
                className="
                w-9
                h-9
                rounded-full
                bg-green-100
                flex
                items-center
                justify-center
                "
              >

                <TrendingUp
                  size={18}
                  className="text-green-600"
                />

              </div>

              <div>

                <p
                  className="
                  font-bold
                  text-green-600
                  "
                >
                  +0%
                </p>

                <p
                  className="
                  text-xs
                  text-zinc-400
                  "
                >
                  Comparado ao período anterior
                </p>

              </div>

            </div>

          </div>
          </div>
</div>

            {/* AÇÕES RÁPIDAS */}

      <div
        className="
        bg-white
        rounded-[30px]
        border
        border-zinc-100
        shadow-sm
        p-8
        "
      >

        <div className="flex items-center justify-between mb-8">

          <div>

            <h2
              className="
              text-3xl
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

        <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-6">

          <Link
            href="/admin/produtos"
            className="
            group
            bg-[#FAFAFA]
            rounded-[24px]
            border
            border-zinc-100
            p-7
            hover:border-[#7A1F3D]
            hover:shadow-md
            transition-all
            "
          >

            <div
              className="
              w-14
              h-14
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

            <h3 className="font-bold text-xl mt-6">
              Produtos
            </h3>

            <p className="text-zinc-500 mt-2">
              Cadastre e gerencie os produtos.
            </p>

            <ArrowRight
              className="
              mt-8
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
            rounded-[24px]
            border
            border-zinc-100
            p-7
            hover:border-[#7A1F3D]
            hover:shadow-md
            transition-all
            "
          >

            <div
              className="
              w-14
              h-14
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

            <h3 className="font-bold text-xl mt-6">
              Pedidos
            </h3>

            <p className="text-zinc-500 mt-2">
              Acompanhe os pedidos em tempo real.
            </p>

            <ArrowRight
              className="
              mt-8
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
            rounded-[24px]
            border
            border-zinc-100
            p-7
            hover:border-[#7A1F3D]
            hover:shadow-md
            transition-all
            "
          >

            <div
              className="
              w-14
              h-14
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

            <h3 className="font-bold text-xl mt-6">
              Link do Cardápio
            </h3>

            <p className="text-zinc-500 mt-2">
              Compartilhe seu cardápio digital.
            </p>

            <ArrowRight
              className="
              mt-8
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
            rounded-[24px]
            border
            border-zinc-100
            p-7
            hover:border-[#7A1F3D]
            hover:shadow-md
            transition-all
            "
          >

            <div
              className="
              w-14
              h-14
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

            <h3 className="font-bold text-xl mt-6">
              Aparência
            </h3>

            <p className="text-zinc-500 mt-2">
              Personalize o visual do cardápio.
            </p>

            <ArrowRight
              className="
              mt-8
              group-hover:translate-x-1
              transition
              "
            />

          </Link>

        </div>

      </div>

    </div>
  );
}