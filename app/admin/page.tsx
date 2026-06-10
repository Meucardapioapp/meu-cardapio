"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  DollarSign,
  ShoppingBag,
  Package,
  Clock3,
  ArrowRight,
} from "lucide-react"

export default function DashboardPage() {

  const [restauranteId, setRestauranteId] =
    useState("")

  useEffect(() => {
    const id =
      localStorage.getItem(
        "restaurante_id"
      ) || ""

    setRestauranteId(id)
  }, [])

  return (
    <div className="space-y-8">

      {/* HEADER */}

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-5xl font-black text-[#1F1720]">
            Dashboard
          </h1>

          <p className="text-zinc-500 mt-2 text-lg">
            Visão geral do restaurante
          </p>
        </div>

        <button
          className="
          bg-gradient-to-r
          from-[#7A1F3D]
          to-[#542129]
          text-white
          px-6
          py-4
          rounded-2xl
          font-bold
          shadow-lg
          hover:scale-[1.02]
          transition
          "
        >
          Novo Pedido
        </button>

      </div>

      {/* CARDS */}

      <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-5">

        <div className="bg-white rounded-3xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-zinc-500 font-medium">
              Faturamento Hoje
            </p>

            <DollarSign
              className="text-[#7A1F3D]"
            />
          </div>

          <h2 className="text-4xl font-black mt-4">
            R$ 0,00
          </h2>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-zinc-500 font-medium">
              Pedidos Hoje
            </p>

            <ShoppingBag
              className="text-[#7A1F3D]"
            />
          </div>

          <h2 className="text-4xl font-black mt-4">
            0
          </h2>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-zinc-500 font-medium">
              Produtos
            </p>

            <Package
              className="text-[#7A1F3D]"
            />
          </div>

          <h2 className="text-4xl font-black mt-4">
            0
          </h2>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <p className="text-zinc-500 font-medium">
              Pendentes
            </p>

            <Clock3
              className="text-[#7A1F3D]"
            />
          </div>

          <h2 className="text-4xl font-black mt-4">
            0
          </h2>
        </div>

      </div>

      {/* SEGUNDA LINHA */}

      <div className="grid lg:grid-cols-2 gap-6">

        <div className="bg-white rounded-3xl p-8 border shadow-sm">

          <div className="flex items-center justify-between mb-6">

            <div>
              <h2 className="text-2xl font-bold">
                Últimos Pedidos
              </h2>

              <p className="text-zinc-500 mt-1">
                Pedidos recebidos recentemente
              </p>
            </div>

          </div>

          <div className="h-[300px] flex flex-col items-center justify-center">

            <ShoppingBag
              size={60}
              className="text-zinc-300"
            />

            <p className="font-bold text-xl mt-4">
              Nenhum pedido ainda
            </p>

            <p className="text-zinc-500 mt-2">
              Os pedidos aparecerão aqui
            </p>

          </div>

        </div>

        <div className="bg-white rounded-3xl p-8 border shadow-sm">

          <h2 className="text-2xl font-bold">
            Resumo de Pedidos
          </h2>

          <p className="text-zinc-500 mt-1">
            Últimos 7 dias
          </p>

          <div className="mt-8 space-y-5">

            <div className="flex justify-between">
              <span>Total</span>
              <span className="font-bold">
                0
              </span>
            </div>

            <div className="flex justify-between">
              <span>Concluídos</span>
              <span className="font-bold text-green-600">
                0
              </span>
            </div>

            <div className="flex justify-between">
              <span>Pendentes</span>
              <span className="font-bold text-amber-500">
                0
              </span>
            </div>

            <div className="flex justify-between">
              <span>Cancelados</span>
              <span className="font-bold text-red-500">
                0
              </span>
            </div>

          </div>

        </div>

      </div>

      {/* AÇÕES RÁPIDAS */}

      <div className="bg-white rounded-3xl p-8 border shadow-sm">

       <h2 className="text-2xl font-bold mb-6">
  Ações Rápidas
</h2>

<div className="mb-6">

  <a
    href={`/api/mercadopago/connect?restaurante_id=${restauranteId}`}
    className="
      inline-flex
      items-center
      rounded-2xl
      bg-[#009EE3]
      px-6
      py-4
      font-bold
      text-white
      hover:opacity-90
      transition
    "
  >
    Conectar Mercado Pago
  </a>

</div>

<div className="grid md:grid-cols-4 gap-4">

          <Link
            href="/admin/produtos"
            className="
            bg-zinc-50
            border
            rounded-2xl
            p-5
            hover:border-[#7A1F3D]
            transition
            "
          >
            <p className="font-bold">
              Produtos
            </p>

            <ArrowRight
              className="mt-3"
            />
          </Link>

          <Link
            href="/admin/pedidos"
            className="
            bg-zinc-50
            border
            rounded-2xl
            p-5
            hover:border-[#7A1F3D]
            transition
            "
          >
            <p className="font-bold">
              Pedidos
            </p>

            <ArrowRight
              className="mt-3"
            />
          </Link>

          <Link
            href="/admin/link-cardapio"
            className="
            bg-zinc-50
            border
            rounded-2xl
            p-5
            hover:border-[#7A1F3D]
            transition
            "
          >
            <p className="font-bold">
              Link do Cardápio
            </p>

            <ArrowRight
              className="mt-3"
            />
          </Link>

          <Link
            href="/admin/aparencia"
            className="
            bg-zinc-50
            border
            rounded-2xl
            p-5
            hover:border-[#7A1F3D]
            transition
            "
          >
            <p className="font-bold">
              Aparência
            </p>

            <ArrowRight
              className="mt-3"
            />
          </Link>

        </div>

      </div>

    </div>
  )
}