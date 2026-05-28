"use client"

import { useEffect, useState } from "react"

import { supabase } from "@/lib/supabase"

import { StatusBadge } from "@/app/components/StatusBadge"

import { Button } from "@/components/ui/button"

type Pedido = {
  id: string
  cliente: string
  total: number
  status: string
  created_at: string
  items: any[]
}

export default function DashboardPage() {

  const [loading, setLoading] =
    useState(true)

  const [faturamentoHoje, setFaturamentoHoje] =
    useState(0)

  const [pedidosHoje, setPedidosHoje] =
    useState(0)

  const [produtosTotal, setProdutosTotal] =
    useState(0)

  const [pedidosPendentes, setPedidosPendentes] =
    useState(0)

  const [ultimosPedidos, setUltimosPedidos] =
    useState<Pedido[]>([])

  useEffect(() => {
    carregarDashboard()
  }, [])

  async function carregarDashboard() {

    try {

      const restauranteId =
        localStorage.getItem(
          "restaurante_id"
        )

      if (!restauranteId) {

        window.location.href =
          "/login"

        return
      }

      // PEDIDOS

      const {
        data: pedidos,
      } = await supabase

        .from("pedidos")

        .select("*")

        .eq(
          "restaurante_id",
          restauranteId
        )

      // PRODUTOS

      const {
        data: produtos,
      } = await supabase

        .from("produtos")

        .select("*")

        .eq(
          "restaurante_id",
          restauranteId
        )

      if (produtos) {

        setProdutosTotal(
          produtos.length
        )
      }

      if (pedidos) {

        // PEDIDOS HOJE

        const hoje = new Date()

        const pedidosDoDia =
          pedidos.filter(
            (pedido) => {

              const dataPedido =
                new Date(
                  pedido.created_at
                )

              return (
                dataPedido.toDateString()
                ===
                hoje.toDateString()
              )
            }
          )

        setPedidosHoje(
          pedidosDoDia.length
        )

        // FATURAMENTO

        const total =
          pedidosDoDia.reduce(
            (
              acc,
              pedido
            ) => {

              return (
                acc +
                Number(
                  pedido.total
                )
              )
            },
            0
          )

        setFaturamentoHoje(total)

        // PENDENTES

        const pendentes =
          pedidos.filter(
            (pedido) =>
              pedido.status ===
              "pendente"
          )

        setPedidosPendentes(
          pendentes.length
        )

        // ÚLTIMOS PEDIDOS

        const ultimos =
          pedidos

            .sort(
              (
                a,
                b
              ) =>
                new Date(
                  b.created_at
                ).getTime()
                -
                new Date(
                  a.created_at
                ).getTime()
            )

            .slice(0, 5)

        setUltimosPedidos(
          ultimos
        )
      }

    } catch (error) {

      console.log(error)

    } finally {

      setLoading(false)
    }
  }

  function formatarTempo(
    data: string
  ) {

    const agora =
      new Date().getTime()

    const pedido =
      new Date(data).getTime()

    const diff =
      Math.floor(
        (agora - pedido)
        / 60000
      )

    if (diff < 1)
      return "agora"

    if (diff < 60)
      return `há ${diff} min`

    const horas =
      Math.floor(diff / 60)

    return `há ${horas}h`
  }

  if (loading) {

    return (

      <div className="
        min-h-screen
        bg-zinc-50
        flex
        items-center
        justify-center
      ">

        <p className="
          text-zinc-500
          text-lg
          font-medium
        ">
          Carregando dashboard...
        </p>

      </div>
    )
  }

  return (

    <div className="
      space-y-8
      bg-zinc-50
      min-h-screen
      p-6
    ">

      <div className="
        flex
        flex-col
        md:flex-row
        md:items-center
        md:justify-between
        gap-4
      ">

        <div>

          <h1 className="
            text-4xl
            font-black
            text-zinc-900
          ">
            Dashboard
          </h1>

          <p className="
            text-zinc-500
            mt-2
          ">
            Visão geral do restaurante
          </p>

        </div>

        <Button className="
          rounded-2xl
          h-11
          px-6
        ">
          Novo Pedido
        </Button>

      </div>

      <div className="
        flex
        flex-wrap
        gap-2
      ">

        <StatusBadge status="pendente" />

        <StatusBadge status="preparando" />

        <StatusBadge status="entrega" />

        <StatusBadge status="concluido" />

      </div>

      <div className="
        grid
        grid-cols-1
        md:grid-cols-2
        xl:grid-cols-4
        gap-4
      ">

        <div className="
          bg-white
          border
          border-zinc-200
          rounded-3xl
          p-6
          shadow-sm
          hover:shadow-md
          transition-all
        ">

          <p className="
            text-zinc-500
            text-sm
            font-medium
          ">
            Faturamento Hoje
          </p>

          <h2 className="
            text-3xl
            font-black
            mt-3
            text-emerald-600
          ">
            R$ {
              faturamentoHoje.toFixed(2)
            }
          </h2>

        </div>

        <div className="
          bg-white
          border
          border-zinc-200
          rounded-3xl
          p-6
          shadow-sm
          hover:shadow-md
          transition-all
        ">

          <p className="
            text-zinc-500
            text-sm
            font-medium
          ">
            Pedidos Hoje
          </p>

          <h2 className="
            text-3xl
            font-black
            mt-3
            text-zinc-900
          ">
            {pedidosHoje}
          </h2>

        </div>

        <div className="
          bg-white
          border
          border-zinc-200
          rounded-3xl
          p-6
          shadow-sm
          hover:shadow-md
          transition-all
        ">

          <p className="
            text-zinc-500
            text-sm
            font-medium
          ">
            Produtos
          </p>

          <h2 className="
            text-3xl
            font-black
            mt-3
            text-zinc-900
          ">
            {produtosTotal}
          </h2>

        </div>

        <div className="
          bg-white
          border
          border-zinc-200
          rounded-3xl
          p-6
          shadow-sm
          hover:shadow-md
          transition-all
        ">

          <p className="
            text-zinc-500
            text-sm
            font-medium
          ">
            Pedidos Pendentes
          </p>

          <h2 className="
            text-3xl
            font-black
            mt-3
            text-amber-500
          ">
            {pedidosPendentes}
          </h2>

        </div>

      </div>

      <div className="
        bg-white
        border
        border-zinc-200
        rounded-3xl
        p-8
        shadow-sm
      ">

        <div className="
          flex
          flex-col
          md:flex-row
          md:items-center
          md:justify-between
          gap-4
          mb-8
        ">

          <div>

            <h2 className="
              text-2xl
              font-black
              text-zinc-900
            ">
              Últimos pedidos
            </h2>

            <p className="
              text-zinc-500
              mt-1
            ">
              Pedidos recebidos recentemente
            </p>

          </div>

          <Button
            variant="outline"
            className="
              rounded-2xl
            "
          >
            Ver todos
          </Button>

        </div>

        <div className="
          space-y-4
        ">

          {ultimosPedidos.map(
            (pedido) => (

              <div
                key={pedido.id}
                className="
                  bg-zinc-50
                  border
                  border-zinc-200
                  rounded-3xl
                  p-5
                  flex
                  flex-col
                  md:flex-row
                  md:items-center
                  md:justify-between
                  gap-4
                  hover:bg-zinc-100
                  transition-all
                  cursor-pointer
                "
              >

                <div className="
                  space-y-3
                ">

                  <div className="
                    flex
                    items-center
                    gap-3
                    flex-wrap
                  ">

                    <p className="
                      font-bold
                      text-zinc-900
                    ">
                      Pedido #
                      {pedido.id}
                    </p>

                    <StatusBadge
                      status={
                        pedido.status
                      }
                    />

                  </div>

                  <div className="
                    space-y-1
                  ">

                    <p className="
                      text-zinc-600
                      text-sm
                      font-medium
                    ">
                      {pedido.cliente}
                    </p>

                    <p className="
                      text-zinc-500
                      text-sm
                    ">
                      {
                        pedido.items?.length
                      } itens
                    </p>

                  </div>

                </div>

                <div className="
                  text-left
                  md:text-right
                ">

                  <p className="
                    text-emerald-600
                    font-black
                    text-xl
                  ">
                    R$ {
                      Number(
                        pedido.total
                      ).toFixed(2)
                    }
                  </p>

                  <p className="
                    text-zinc-500
                    text-sm
                    mt-1
                  ">
                    {
                      formatarTempo(
                        pedido.created_at
                      )
                    }
                  </p>

                </div>

              </div>
            )
          )}

        </div>

      </div>

    </div>
  )
}