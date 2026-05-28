"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Pedido = {
  id: number

  cliente: string

  telefone: string

  bairro: string

  rua: string

  numero: string

  observacoes: string

  pagamento: string

  total: number

  status: string

  items: any[]

  created_at: string

  restaurante_id: string
}

export default function PedidosPage() {

  const [pedidos, setPedidos] =
    useState<Pedido[]>([])

  const [loading, setLoading] =
    useState(true)

  async function buscarPedidos() {

    try {

      const restauranteId =
        localStorage.getItem(
          "restaurante_id"
        )

      if (!restauranteId) {

        alert(
          "Restaurante não encontrado"
        )

        return
      }

      const {
        data,
        error,
      } = await supabase

        .from("pedidos")

        .select("*")

        .eq(
          "restaurante_id",
          restauranteId
        )

        .order(
          "created_at",
          {
            ascending: false,
          }
        )

      if (error) {

        console.log(
          "ERRO PEDIDOS:",
          error
        )

        alert(
          "Erro ao buscar pedidos"
        )

        return
      }

      if (data) {

        setPedidos(data)
      }

    } catch (error) {

      console.log(error)

    } finally {

      setLoading(false)
    }
  }

  async function atualizarStatus(
    id: number,
    status: string
  ) {

    try {

      const restauranteId =
        localStorage.getItem(
          "restaurante_id"
        )

      const { error } =
        await supabase

          .from("pedidos")

          .update({
            status,
          })

          .eq("id", id)

          .eq(
            "restaurante_id",
            restauranteId
          )

      if (error) {

        console.log(error)

        alert(
          "Erro ao atualizar status"
        )

        return
      }

      setPedidos((oldPedidos) =>

        oldPedidos.map((pedido) =>

          pedido.id === id

            ? {
                ...pedido,
                status,
              }

            : pedido
        )
      )

    } catch (error) {

      console.log(error)
    }
  }

  async function excluirPedido(
    id: number
  ) {

    try {

      const restauranteId =
        localStorage.getItem(
          "restaurante_id"
        )

      const confirmar =
        confirm(
          "Tem certeza que deseja excluir este pedido?"
        )

      if (!confirmar) return

      const { error } =
        await supabase

          .from("pedidos")

          .delete()

          .eq("id", id)

          .eq(
            "restaurante_id",
            restauranteId
          )

      if (error) {

        console.log(error)

        alert(
          "Erro ao excluir pedido"
        )

        return
      }

      setPedidos((oldPedidos) =>

        oldPedidos.filter(
          (pedido) =>
            pedido.id !== id
        )
      )

    } catch (error) {

      console.log(error)
    }
  }

  useEffect(() => {

    buscarPedidos()

    const channel = supabase

      .channel(
        "pedidos-realtime"
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pedidos",
        },
        () => {

          buscarPedidos()
        }
      )

      .subscribe()

    return () => {

      supabase.removeChannel(
        channel
      )
    }

  }, [])

  if (loading) {

    return (

      <div className="
        min-h-screen
        bg-black
        text-white
        flex
        items-center
        justify-center
      ">

        Carregando pedidos...

      </div>
    )
  }

  return (

    <main className="
      min-h-screen
      bg-black
      text-white
      p-6
    ">

      <div className="
        max-w-7xl
        mx-auto
      ">

        <h1 className="
          text-4xl
          font-bold
          mb-8
        ">
          Pedidos
        </h1>

        {pedidos.length === 0 ? (

          <div className="
            bg-zinc-900
            rounded-2xl
            p-10
            text-center
            text-zinc-400
          ">

            Nenhum pedido encontrado

          </div>

        ) : (

          <div className="
            grid
            gap-6
            md:grid-cols-2
            xl:grid-cols-3
          ">

            {pedidos.map((pedido) => (

              <div
                key={pedido.id}
                className="
                  bg-zinc-900
                  rounded-2xl
                  p-5
                  border
                  border-zinc-800
                "
              >

                <div className="
                  flex
                  items-center
                  justify-between
                  mb-4
                ">

                  <h2 className="
                    text-2xl
                    font-bold
                  ">
                    Pedido #{pedido.id}
                  </h2>

                  <span className="
                    bg-green-500/20
                    text-green-400
                    px-3
                    py-1
                    rounded-full
                    text-sm
                  ">

                    {pedido.status}

                  </span>

                </div>

                <div className="
                  space-y-2
                  text-sm
                  text-zinc-300
                  mb-5
                ">

                  <p>
                    <strong>
                      Cliente:
                    </strong>{" "}

                    {pedido.cliente}
                  </p>

                  <p>
                    <strong>
                      Telefone:
                    </strong>{" "}

                    {pedido.telefone}
                  </p>

                  <p>
                    <strong>
                      Endereço:
                    </strong>{" "}

                    {pedido.rua},{" "}
                    {pedido.numero} -{" "}
                    {pedido.bairro}
                  </p>

                  <p>
                    <strong>
                      Pagamento:
                    </strong>{" "}

                    {pedido.pagamento}
                  </p>

                  <p>
                    <strong>
                      Observação:
                    </strong>{" "}

                    {pedido.observacoes
                      || "Nenhuma"}
                  </p>

                </div>

                <div className="
                  border-t
                  border-zinc-800
                  pt-4
                  mb-4
                ">

                  <h3 className="
                    font-semibold
                    mb-3
                  ">
                    Itens
                  </h3>

                  <div className="
                    space-y-2
                  ">

                    {pedido.items?.map(
                      (
                        item: any,
                        index: number
                      ) => (

                        <div
                          key={index}
                          className="
                            flex
                            justify-between
                            text-sm
                          "
                        >

                          <span>

                            {item.quantity}x{" "}
                            {item.name}

                          </span>

                          <span>

                            R$ {
                              Number(
                                item.price
                              ).toFixed(2)
                            }

                          </span>

                        </div>
                      )
                    )}

                  </div>

                </div>

                <div className="
                  flex
                  items-center
                  justify-between
                  mb-4
                ">

                  <span className="
                    text-zinc-400
                  ">
                    Total
                  </span>

                  <span className="
                    text-2xl
                    font-bold
                    text-green-400
                  ">

                    R$ {
                      Number(
                        pedido.total
                      ).toFixed(2)
                    }

                  </span>

                </div>

                <div className="
                  grid
                  grid-cols-2
                  gap-2
                ">

                  <button
                    onClick={() =>
                      atualizarStatus(
                        pedido.id,
                        "preparando"
                      )
                    }
                    className="
                      bg-yellow-500
                      hover:bg-yellow-400
                      text-black
                      font-bold
                      py-2
                      rounded-xl
                      transition-colors
                    "
                  >
                    Preparando
                  </button>

                  <button
                    onClick={() =>
                      atualizarStatus(
                        pedido.id,
                        "entrega"
                      )
                    }
                    className="
                      bg-blue-500
                      hover:bg-blue-400
                      font-bold
                      py-2
                      rounded-xl
                      transition-colors
                    "
                  >
                    Entrega
                  </button>

                  <button
                    onClick={() =>
                      atualizarStatus(
                        pedido.id,
                        "concluido"
                      )
                    }
                    className="
                      bg-green-500
                      hover:bg-green-400
                      text-black
                      font-bold
                      py-2
                      rounded-xl
                      col-span-2
                      transition-colors
                    "
                  >
                    Concluir Pedido
                  </button>

                  <button
                    onClick={() =>
                      excluirPedido(
                        pedido.id
                      )
                    }
                    className="
                      bg-red-500
                      hover:bg-red-600
                      text-white
                      font-bold
                      py-2
                      rounded-xl
                      col-span-2
                      transition-colors
                    "
                  >
                    Excluir Pedido
                  </button>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>

    </main>
  )
}