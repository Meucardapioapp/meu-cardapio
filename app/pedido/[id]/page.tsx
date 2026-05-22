"use client"

import { useEffect, useState } from "react"

import {
  useParams,
} from "next/navigation"

import { supabase } from "@/utils/supabase/client"

import { motion } from "framer-motion"

import {
  Clock3,
  ChefHat,
  Bike,
  CheckCircle2,
  House,
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

export default function PedidoPage() {

  const params = useParams()

  const [pedido, setPedido] =
    useState<Pedido | null>(null)

  const [loading, setLoading] =
    useState(true)

  async function buscarPedido() {

    const { data, error } =
      await supabase
        .from("pedidos")
        .select("*")
        .eq("id", params.id)
        .single()

    if (error) {

      console.log(error)

      return
    }

    setPedido(data)

    setLoading(false)
  }

  useEffect(() => {

    buscarPedido()

    const channel = supabase

      .channel(
        `pedido-${params.id}`
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pedidos",
          filter: `id=eq.${params.id}`,
        },
        () => {

          buscarPedido()
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

      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">

        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            repeat: Infinity,
            duration: 1,
            ease: "linear",
          }}
          className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full"
        />

      </div>
    )
  }

  if (!pedido) {

    return (

      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">

        Pedido não encontrado

      </div>
    )
  }

  const etapas = [

    {
      nome: "Pedido recebido",
      status: "pendente",
      icon: Clock3,
    },

    {
      nome: "Preparando",
      status: "preparando",
      icon: ChefHat,
    },

    {
      nome: "Entrega",
      status: "entrega",
      icon: Bike,
    },

    {
      nome: "Concluído",
      status: "concluido",
      icon: CheckCircle2,
    },
  ]

  const etapaAtual =
    etapas.findIndex(
      (etapa) =>
        etapa.status === pedido.status
    )

  return (

    <div className="min-h-screen bg-zinc-950 text-white px-5 py-10">

      <div className="max-w-md mx-auto">

        <motion.div
          initial={{
            opacity: 0,
            y: 30,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6"
        >

          <div className="text-center">

            <motion.div
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
              }}
              className="w-24 h-24 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center mx-auto mb-5"
            >

              <CheckCircle2
                size={50}
                className="text-green-400"
              />

            </motion.div>

            <h1 className="text-3xl font-bold">
              Pedido Confirmado
            </h1>

            <p className="text-zinc-400 mt-2">
              Acompanhe seu pedido
            </p>

          </div>

          <div className="mt-8 bg-zinc-800 rounded-2xl p-5">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-zinc-400 text-sm">
                  Pedido
                </p>

                <h2 className="text-2xl font-bold">
                  #{pedido.id}
                </h2>

              </div>

              <motion.div
                animate={{
                  opacity: [1, 0.5, 1],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                }}
                className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-bold capitalize"
              >
                {pedido.status}
              </motion.div>

            </div>

            <div className="mt-5 space-y-2 text-sm text-zinc-300">

              <p>
                👤 {pedido.cliente}
              </p>

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

          </div>

          <div className="mt-8">

            <div className="flex justify-between">

              {etapas.map(
                (
                  etapa,
                  index
                ) => {

                  const Icon =
                    etapa.icon

                  const ativo =
                    index <=
                    etapaAtual

                  return (

                    <div
                      key={
                        etapa.status
                      }
                      className="flex flex-col items-center flex-1 relative"
                    >

                      {index <
                        etapas.length -
                          1 && (

                        <div className="absolute top-5 left-1/2 w-full h-1 bg-zinc-700">

                          <motion.div
                            initial={{
                              width: 0,
                            }}
                            animate={{
                              width:
                                ativo
                                  ? "100%"
                                  : "0%",
                            }}
                            className="h-1 bg-green-500"
                          />

                        </div>
                      )}

                      <motion.div
                        animate={{
                          scale:
                            ativo
                              ? [1, 1.1, 1]
                              : 1,
                        }}
                        transition={{
                          repeat:
                            ativo
                              ? Infinity
                              : 0,
                          duration: 2,
                        }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                          ativo
                            ? "bg-green-500 text-white"
                            : "bg-zinc-800 text-zinc-500"
                        }`}
                      >

                        <Icon size={20} />

                      </motion.div>

                      <p
                        className={`text-[10px] text-center mt-2 ${
                          ativo
                            ? "text-white"
                            : "text-zinc-500"
                        }`}
                      >
                        {etapa.nome}
                      </p>

                    </div>
                  )
                }
              )}

            </div>

          </div>

          <div className="mt-8 bg-zinc-800 rounded-2xl p-5">

            <h3 className="font-bold text-lg mb-4">
              Itens do pedido
            </h3>

            <div className="space-y-4">

              {pedido.itens?.map(
                (
                  item,
                  index
                ) => (

                  <div
                    key={index}
                    className="border-b border-zinc-700 pb-4"
                  >

                    <div className="flex gap-3">

                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 rounded-2xl object-cover"
                      />

                      <div className="flex-1">

                        <div className="flex items-center justify-between">

                          <p className="font-semibold">
                            {item.quantity}x {item.name}
                          </p>

                          <p className="font-bold text-green-400">
                            R${" "}
                            {(
                              Number(item.price || 0) *
                              Number(item.quantity || 1)
                            ).toFixed(2)}
                          </p>

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

            <div className="mt-5 flex items-center justify-between">

              <span className="text-zinc-400">
                Total
              </span>

              <span className="text-3xl font-bold text-green-400">
                R$ {Number(pedido.total || 0).toFixed(2)}
              </span>

            </div>

          </div>

          <button
            onClick={() => {

              window.location.href = "/"
            }}
            className="w-full mt-6 bg-green-500 hover:bg-green-400 transition py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
          >

            <House size={20} />

            Voltar ao cardápio

          </button>

          <motion.div
            animate={{
              opacity: [1, 0.6, 1],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
            }}
            className="mt-6 text-center text-sm text-zinc-500"
          >
            Atualizando em tempo real...
          </motion.div>

        </motion.div>

      </div>

    </div>
  )
}