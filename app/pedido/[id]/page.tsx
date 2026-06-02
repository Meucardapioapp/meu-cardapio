"use client"

import { useEffect, useState } from "react"

import { useParams, useRouter } from "next/navigation"

import { motion } from "framer-motion"

import {
  CheckCircle,
  Clock,
  ChefHat,
  Bike,
  Home,
  Loader2,
} from "lucide-react"

import { supabase } from "@/lib/supabase"

import { getThemeSettings } from "../../lib/theme"

interface ItemPedido {
  nome: string
  quantidade: number
  preco: number
  imagem?: string
}

interface Pedido {
  id: number
  cliente_nome: string
  cliente_telefone: string
  endereco: string
  status: string
  total: number
  itens: ItemPedido[]
  created_at: string
}

export default function PedidoPage() {

  const params = useParams()

  const router = useRouter()

  const {
    lightMode,
    selectedColor,
  } = getThemeSettings()

  const bgPage = lightMode
    ? "bg-[#F6F1E7]"
    : "bg-black"

  const cardBg = lightMode
    ? "bg-white border border-zinc-200"
    : "bg-zinc-900 border border-zinc-800"

  const innerCard = lightMode
    ? "bg-zinc-100"
    : "bg-zinc-800"

  const textPrimary = lightMode
    ? "text-zinc-900"
    : "text-white"

  const textSecondary = lightMode
    ? "text-zinc-500"
    : "text-zinc-400"

  const borderColor = lightMode
    ? "border-zinc-200"
    : "border-zinc-700"

  const [pedido, setPedido] =
    useState<Pedido | null>(null)

  const [loading, setLoading] =
    useState(true)

  async function buscarPedido() {

    try {

      console.log(
        "BUSCANDO PEDIDO:",
        params.id
      )

      const { data, error } =
        await supabase
          .from("pedidos")
          .select("*")
          .eq("id", Number(params.id))
          .single()

      if (error) {

        console.log(
          "ERRO AO BUSCAR:",
          error
        )

        return
      }

      console.log(
        "PEDIDO ENCONTRADO:",
        data
      )

      setPedido(data)

    } catch (error) {

      console.log(
        "ERRO GERAL:",
        error
      )

    } finally {

      setLoading(false)
    }
  }

  useEffect(() => {

    if (!params.id) return

    buscarPedido()

    const channel = supabase
      .channel(
        `pedido-${params.id}`
      )

      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pedidos",
        },
        async (payload) => {

          console.log(
            "REALTIME RECEBIDO:",
            payload
          )

          const novoPedido =
            payload.new as Pedido

          if (
            Number(novoPedido.id) ===
            Number(params.id)
          ) {

            console.log(
              "ATUALIZANDO CLIENTE:",
              novoPedido.status
            )

            setPedido({
              ...novoPedido,
            })
          }
        }
      )

      .subscribe((status) => {

        console.log(
          "STATUS REALTIME:",
          status
        )
      })

    return () => {

      supabase.removeChannel(
        channel
      )
    }

  }, [params.id])

  const etapas = [
    {
      nome: "Pedido",
      status: "pendente",
      icon: Clock,
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
      icon: CheckCircle,
    },
  ]

  function etapaAtiva(
    statusEtapa: string
  ) {

    const ordem = [
      "pendente",
      "preparando",
      "entrega",
      "concluido",
    ]

    const atual = ordem.indexOf(
      pedido?.status || "pendente"
    )

    const etapa =
      ordem.indexOf(statusEtapa)

    return etapa <= atual
  }

  function corStatus(status: string) {

    switch (status) {

      case "pendente":
        return "bg-yellow-500"

      case "preparando":
        return "bg-orange-500"

      case "entrega":
        return "bg-blue-500"

      case "concluido":
        return "bg-green-500"

      default:
        return "bg-zinc-500"
    }
  }

  if (loading) {

    return (

      <div className={`
        min-h-screen
        ${bgPage}
        flex
        items-center
        justify-center
      `}>

        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            repeat: Infinity,
            duration: 1,
            ease: "linear",
          }}
        >

          <Loader2
            size={60}
            style={{
              color: selectedColor,
            }}
          />

        </motion.div>

      </div>
    )
  }

  if (!pedido) {

    return (

      <div className={`
        min-h-screen
        ${bgPage}
        flex
        items-center
        justify-center
        ${textPrimary}
      `}>

        Pedido não encontrado

      </div>
    )
  }

  return (

    <div className={`
      min-h-screen
      ${bgPage}
      flex
      items-center
      justify-center
      p-6
    `}>

      <motion.div
        initial={{
          opacity: 0,
          y: 30,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className={`
          w-full
          max-w-md
          ${cardBg}
          rounded-3xl
          p-6
        `}
      >

        <div className="
          flex
          flex-col
          items-center
        ">

          <div
            className="
              w-16
              h-16
              rounded-full
              flex
              items-center
              justify-center
              mb-4
            "
            style={{
              backgroundColor:
                `${selectedColor}20`,
            }}
          >

            <CheckCircle
              size={34}
              style={{
                color: selectedColor,
              }}
            />

          </div>

          <h1 className={`
            text-4xl
            font-bold
            text-center
            ${textPrimary}
          `}>
            Pedido Confirmado
          </h1>

          <p className={`
            text-center
            mt-2
            ${textSecondary}
          `}>
            Acompanhe seu pedido
          </p>

        </div>

        <div className={`
          mt-8
          ${innerCard}
          rounded-2xl
          p-5
        `}>

          <div className="
            flex
            justify-between
            items-start
          ">

            <div>

              <p className={`
                text-sm
                ${textSecondary}
              `}>
                Pedido
              </p>

              <h2 className={`
                text-4xl
                font-bold
                ${textPrimary}
              `}>
                #{pedido.id}
              </h2>

            </div>

            <div
              className={`
                px-4
                py-1
                rounded-full
                text-sm
                font-bold
                text-white
                ${corStatus(
                  pedido.status
                )}
              `}
            >
              {pedido.status}
            </div>

          </div>

          <div className={`
            mt-5
            space-y-2
            text-sm
            ${textSecondary}
          `}>

    <p>
  <strong>Cliente:</strong>{" "}
  {pedido.cliente_nome}
</p>

<p>
  <strong>Telefone:</strong>{" "}
  {pedido.cliente_telefone}
</p>

<p>
  <strong>Endereço:</strong>{" "}
  {pedido.endereco}
</p>

          </div>

        </div>

        <div className="mt-8">

          <div className="
            flex
            justify-between
          ">

            {etapas.map(
              (
                etapa,
                index
              ) => {

                const Icon =
                  etapa.icon

                const ativo =
                  etapaAtiva(
                    etapa.status
                  )

                return (

                  <div
                    key={index}
                    className="
                      flex
                      flex-col
                      items-center
                      flex-1
                    "
                  >

                    <div
                      className={`
                        w-12
                        h-12
                        rounded-full
                        flex
                        items-center
                        justify-center
                        border-2
                        transition-all
                      `}
                      style={{
                        backgroundColor:
                          ativo
                            ? selectedColor
                            : lightMode
                            ? "#E4E4E7"
                            : "#27272A",

                        borderColor:
                          ativo
                            ? selectedColor
                            : lightMode
                            ? "#D4D4D8"
                            : "#3F3F46",

                        color:
                          ativo
                            ? "#FFFFFF"
                            : lightMode
                            ? "#71717A"
                            : "#A1A1AA",
                      }}
                    >

                      <Icon
                        size={20}
                      />

                    </div>

                    <p
                      className="
                        mt-2
                        text-xs
                        text-center
                        font-medium
                      "
                      style={{
                        color:
                          ativo
                            ? selectedColor
                            : lightMode
                            ? "#71717A"
                            : "#A1A1AA",
                      }}
                    >
                      {
                        etapa.nome
                      }
                    </p>

                  </div>
                )
              }
            )}

          </div>

        </div>

        <div className={`
          mt-8
          ${innerCard}
          rounded-2xl
          p-5
        `}>

          <h3 className={`
            font-bold
            text-lg
            mb-4
            ${textPrimary}
          `}>
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
                  className={`
                    flex
                    justify-between
                    items-center
                    border-b
                    ${borderColor}
                    pb-3
                  `}
                >

                  <div>

                    <p className={`
                      font-semibold
                      ${textPrimary}
                    `}>
                      {
                        item.quantidade
                      }
                      x{" "}
                      {
                        item.nome
                      }
                    </p>

                  </div>

<p
  className="font-bold"
  style={{
    color: selectedColor,
  }}
>
  R$ {(item.preco * item.quantidade).toFixed(2)}
</p>

                </div>
              )
            )}

          </div>

          <div className="
            flex
            justify-between
            items-center
            mt-6
          ">

            <p className={`
              ${textSecondary}
            `}>
              Total
            </p>

            <p
  className="
    text-4xl
    font-bold
  "
  style={{
    color: selectedColor,
  }}
>
  R$ {Number(pedido.total).toFixed(2)}
</p>


          </div>

        </div>

<button
  onClick={() =>
    router.push(
      `/${localStorage.getItem("cardapio-slug") || "jskburguer"}`
    )
  }
  className="
    mt-8
    w-full
    transition
    rounded-2xl
    py-4
    font-bold
    text-white
    flex
    items-center
    justify-center
    gap-2
    hover:scale-[1.02]
  "
  style={{
    backgroundColor: selectedColor,
  }}
>
  <Home size={20} />

  Voltar ao cardápio
</button>

        <motion.div
          animate={{
            opacity: [1, 0.5, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
          }}
          className={`
            mt-6
            text-center
            text-sm
            ${textSecondary}
          `}
        >
          Atualizando em tempo real...
        </motion.div>

      </motion.div>

    </div>
  )
}