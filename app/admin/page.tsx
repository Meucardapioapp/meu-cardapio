"use client"

import { useEffect, useState } from "react"

import { supabase } from "@/utils/supabase/client"

import { motion } from "framer-motion"

import {
  Clock3,
  ChefHat,
  Bike,
  CheckCircle2,
  Trash2,
} from "lucide-react"

interface Adicional {
  nome: string
  preco: number
}

interface ItemPedido {
  name: string
  image: string
  quantity: number
  price: number
  observation?: string

  adicionaisSelecionados?: Adicional[]
}

interface Pedido {
  id: number

  cliente: string

  telefone: string

  endereco: string

  pagamento: string

  itens: ItemPedido[]

  total: number

  status: string
}

export default function AdminPage() {

  const [pedidos, setPedidos] =
    useState<Pedido[]>([])

  const [novoPedido, setNovoPedido] =
    useState(false)

  async function buscarPedidos() {

    const { data, error } =
      await supabase
        .from("pedidos")
        .select("*")
        .order("id", {
          ascending: false,
        })

    if (error) {

      console.log(error)

      return
    }

    if (data) {

      setPedidos(data)
    }
  }

  useEffect(() => {

    buscarPedidos()

    const audio = new Audio(
      "/notification.mp3"
    )

    const channel = supabase
      .channel("admin-pedidos")

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pedidos",
        },
        (payload) => {

          buscarPedidos()

          if (
            payload.eventType ===
            "INSERT"
          ) {

            audio.play()

            setNovoPedido(true)

            setTimeout(() => {

              setNovoPedido(false)

            }, 3000)
          }
        }
      )

      .subscribe()

    return () => {

      supabase.removeChannel(
        channel
      )
    }

  }, [])

  async function alterarStatus(
    id: number,
    status: string
  ) {

    await supabase
      .from("pedidos")
      .update({ status })
      .eq("id", id)

    buscarPedidos()
  }

  async function deletarPedido(
    id: number
  ) {

    await supabase
      .from("pedidos")
      .delete()
      .eq("id", id)

    buscarPedidos()
  }

  const pendentes = pedidos.filter(
    (pedido) =>
      pedido.status === "pendente"
  )

  const preparando = pedidos.filter(
    (pedido) =>
      pedido.status ===
      "preparando"
  )

  const entrega = pedidos.filter(
    (pedido) =>
      pedido.status === "entrega"
  )

  const concluidos = pedidos.filter(
    (pedido) =>
      pedido.status ===
      "concluido"
  )

  return (

    <div className="min-h-screen bg-zinc-950 text-white p-5">

      <div className="max-w-7xl mx-auto">

        <div className="flex items-center justify-between mb-8">

          <div>

            <h1 className="text-4xl font-black">
              Painel Admin
            </h1>

            <p className="text-zinc-400 mt-2">
              MeuCardapioApp
            </p>

          </div>

          <motion.div
            animate={{
              scale:
                novoPedido
                  ? [1, 1.1, 1]
                  : 1,
            }}
            className={`px-5 py-3 rounded-2xl font-bold ${
              novoPedido
                ? "bg-red-500"
                : "bg-zinc-800"
            }`}
          >

            {pedidos.length} pedidos

          </motion.div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

          <Coluna
            titulo="Pendentes"
            icon={<Clock3 />}
            pedidos={pendentes}
            cor="border-yellow-500"
            alterarStatus={
              alterarStatus
            }
            deletarPedido={
              deletarPedido
            }
          />

          <Coluna
            titulo="Preparando"
            icon={<ChefHat />}
            pedidos={preparando}
            cor="border-blue-500"
            alterarStatus={
              alterarStatus
            }
            deletarPedido={
              deletarPedido
            }
          />

          <Coluna
            titulo="Entrega"
            icon={<Bike />}
            pedidos={entrega}
            cor="border-orange-500"
            alterarStatus={
              alterarStatus
            }
            deletarPedido={
              deletarPedido
            }
          />

          <Coluna
            titulo="Concluídos"
            icon={<CheckCircle2 />}
            pedidos={concluidos}
            cor="border-green-500"
            alterarStatus={
              alterarStatus
            }
            deletarPedido={
              deletarPedido
            }
          />

        </div>

      </div>

    </div>
  )
}

function Coluna({
  titulo,
  icon,
  pedidos,
  cor,
  alterarStatus,
  deletarPedido,
}: any) {

  return (

    <div
      className={`bg-zinc-900 border ${cor} rounded-3xl p-4`}
    >

      <div className="flex items-center gap-2 mb-5">

        {icon}

        <h2 className="text-xl font-bold">
          {titulo}
        </h2>

        <div className="ml-auto bg-zinc-800 px-3 py-1 rounded-full text-sm">

          {pedidos.length}

        </div>

      </div>

      <div className="space-y-4">

        {pedidos.map(
          (pedido: Pedido) => (

            <motion.div
              key={pedido.id}
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="bg-zinc-800 border border-zinc-700 rounded-2xl p-4"
            >

              <div className="flex items-start justify-between">

                <div>

                  <h3 className="font-bold text-lg">
                    {pedido.cliente}
                  </h3>

                  <p className="text-sm text-zinc-400">
                    Pedido #{pedido.id}
                  </p>

                </div>

                <button
                  onClick={() =>
                    deletarPedido(
                      pedido.id
                    )
                  }
                  className="text-red-500"
                >

                  <Trash2 size={18} />

                </button>

              </div>

              <div className="mt-4 space-y-2 text-sm text-zinc-300">

                <p>
                  📞 {pedido.telefone}
                </p>

                <p>
                  📍 {pedido.endereco}
                </p>

                <p>
                  💳 {pedido.pagamento}
                </p>

              </div>

              <div className="mt-5">

                <h4 className="font-bold mb-3">
                  Itens do pedido
                </h4>

                <div className="space-y-4">

                  {pedido.itens?.map(
                    (
                      item,
                      index
                    ) => (

                      <div
                        key={index}
                        className="bg-zinc-900 rounded-2xl p-3 border border-zinc-700"
                      >

                        <div className="flex gap-3">

                          <img
                            src={
                              item.image
                            }
                            alt={
                              item.name
                            }
                            className="w-20 h-20 rounded-xl object-cover"
                          />

                          <div className="flex-1">

                            <div className="flex items-center justify-between">

                              <h5 className="font-bold">
                                {item.quantity}x {item.name}
                              </h5>

                              <span className="text-green-400 font-bold">
                                R$ {" "}
                                {(
                                  Number(
                                    item.price || 0
                                  ) *
                                  Number(
                                    item.quantity || 1
                                  )
                                ).toFixed(2)}
                              </span>

                            </div>

                            {item.adicionaisSelecionados &&
                              item.adicionaisSelecionados.length > 0 && (

                                <div className="mt-2 space-y-1">

                                  {item.adicionaisSelecionados.map(
                                    (
                                      extra,
                                      idx
                                    ) => (

                                      <div
                                        key={idx}
                                        className="text-sm text-green-400"
                                      >
                                        + {extra.nome}
                                      </div>

                                    )
                                  )}

                                </div>

                              )}

                            {item.observation && (

                              <div className="mt-2 text-sm text-yellow-400">

                                Obs: {item.observation}

                              </div>

                            )}

                          </div>

                        </div>

                      </div>

                    )
                  )}

                </div>

              </div>

              <div className="mt-5 flex items-center justify-between">

                <span className="text-2xl font-black text-green-400">

                  R$ {" "}
                  {Number(
                    pedido.total || 0
                  ).toFixed(2)}

                </span>

                <select
                  value={
                    pedido.status
                  }
                  onChange={(e) =>
                    alterarStatus(
                      pedido.id,
                      e.target.value
                    )
                  }
                  className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2"
                >

                  <option value="pendente">
                    Pendente
                  </option>

                  <option value="preparando">
                    Preparando
                  </option>

                  <option value="entrega">
                    Entrega
                  </option>

                  <option value="concluido">
                    Concluído
                  </option>

                </select>

              </div>

            </motion.div>

          )
        )}

      </div>

    </div>
  )
}