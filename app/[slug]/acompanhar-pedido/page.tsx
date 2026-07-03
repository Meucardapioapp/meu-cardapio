"use client"

import { useEffect, useState } from "react"
import {
  useParams,
  useSearchParams,
} from "next/navigation"
import {
  ArrowLeft,
  Check,
  Clock3,
  Bike,
  MapPin,
  CreditCard,
  MessageCircle,
} from "lucide-react"

import { supabase } from "@/lib/supabase"
import { useRestaurant } from "@/contexts/RestaurantContext";

type Pedido = {
  id: number
  cliente: string
  telefone: string
  bairro: string
  rua: string
  numero: string
  total: number
  status: string
  payment_method: string
  created_at: string
}

export default function AcompanharPedidoPage() {
  const params = useParams()

  const searchParams = useSearchParams();

const pedidoId = searchParams.get("id");

  const slug = params.slug as string

  const [pedido, setPedido] =
    useState<Pedido | null>(null)

  const [loading, setLoading] =
    useState(true)

const {
  logo,
  corPrincipal,
} = useRestaurant();



  async function buscarPedido() {
    try {
      if (!pedidoId) {
  setLoading(false);
  return;
}

      const {
        data,
        error,
      } = await supabase
        .from("pedidos")
        .select("*")
        .eq(
          "id",
          Number(pedidoId)
        )
        .single()

      console.log(
        "PEDIDO:",
        data
      )

      console.log(
        "ERRO:",
        error
      )

      if (!error && data) {
        setPedido(data)
      }
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    buscarPedido()

    const canal =
      supabase
        .channel(
          "pedido-realtime"
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "pedidos",
          },
          (payload) => {
           if (
  Number(payload.new.id) ===
  Number(pedidoId)
) {
  setPedido(payload.new as Pedido);
}
          }
        )
        .subscribe()

    return () => {
      supabase.removeChannel(
        canal
      )
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h2 className="text-xl font-bold">
          Carregando pedido...
        </h2>
      </div>
    )
  }

  if (!pedido) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold">
          Pedido não encontrado
        </h2>

        <button
          onClick={() =>
            (window.location.href =
              `/${slug}`)
          }
          className="px-6 py-3 rounded-xl text-white"
          style={{
            backgroundColor:
              corPrincipal,
          }}
        >
          Voltar ao cardápio
        </button>
      </div>
    )
  }

function nomePagamento() {
  if (!pedido) return "-";

  switch (pedido.payment_method) {
    case "pix":
      return "Pix";

    case "credit_card":
      return "Cartão de Crédito";

    case "cash":
      return "Dinheiro";

    case "google_pay":
      return "Google Pay";

    case "apple_pay":
      return "Apple Pay";

    default:
      return pedido.payment_method || "-";
  }
}

  const etapaAtual =
    pedido.status === "pendente"
      ? 1
      : pedido.status === "aceito"
      ? 2
      : pedido.status === "entrega"
      ? 3
      : 4

  return (
    <main className="min-h-screen bg-[#F4F1EA] p-5 pb-32">

<button
  onClick={() => {
    history.back();
  }}
  className="
    w-12
    h-12
    rounded-full
    bg-white
    shadow-md
    flex
    items-center
    justify-center
    transition-all
    hover:scale-105
    active:scale-95
  "
>
  <ArrowLeft
    size={24}
    style={{
      color: corPrincipal,
    }}
  />
</button>

      <div className="flex flex-col items-center mt-4">

        <img
          src={
            logo ||
            "/logo.png"
          }
          className="
            w-24
            h-24
            rounded-full
            object-cover
            shadow-md
          "
        />

        <h1 className="text-3xl font-black mt-5">
          Acompanhar Pedido
        </h1>

        <p
          className="font-bold text-xl mt-2"
          style={{
            color:
              corPrincipal,
          }}
        >
          Pedido #{pedido.id}
        </p>

      </div>

      <div className="bg-white rounded-3xl p-6 mt-6">

        <p className="text-zinc-500">
          Status atual
        </p>

        <h2
          className="text-2xl font-black"
          style={{
            color:
              corPrincipal,
          }}
        >
          {pedido.status.toUpperCase()}
        </h2>

        <div className="w-full h-3 bg-zinc-200 rounded-full mt-5">

          <div
            className="h-3 rounded-full"
            style={{
              backgroundColor:
                corPrincipal,
              width: `${
                (etapaAtual /
                  4) *
                100
              }%`,
            }}
          />

        </div>

        <div className="space-y-5 mt-8">

          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white"
              style={{
                backgroundColor:
                  etapaAtual >= 1
                    ? corPrincipal
                    : "#D4D4D8",
              }}
            >
              <Clock3 />
            </div>

            <span>
              Pedido recebido
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white"
              style={{
                backgroundColor:
                  etapaAtual >= 2
                    ? corPrincipal
                    : "#D4D4D8",
              }}
            >
              <Check />
            </div>

            <span>
              Pedido aceito
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white"
              style={{
                backgroundColor:
                  etapaAtual >= 3
                    ? corPrincipal
                    : "#D4D4D8",
              }}
            >
              <Bike />
            </div>

            <span>
              Saiu para entrega
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white"
              style={{
                backgroundColor:
                  etapaAtual >= 4
                    ? corPrincipal
                    : "#D4D4D8",
              }}
            >
              <Check />
            </div>

            <span>
              Pedido entregue
            </span>
          </div>

        </div>

      </div>

      <div className="bg-white rounded-3xl p-6 mt-6">

        <div className="flex gap-3 mb-5">
          <MapPin />

          <div>
            <p className="text-zinc-500">
              Endereço
            </p>

            <p className="font-semibold">
              {pedido.rua}, {pedido.numero}
            </p>

            <p>
              {pedido.bairro}
            </p>
          </div>
        </div>

        <div className="flex gap-3 mb-5">
          <CreditCard />

          <div>
            <p className="text-zinc-500">
              Pagamento
            </p>

<p className="font-semibold">
  {nomePagamento()}
</p>
          </div>
        </div>

        <div className="flex justify-between items-center">

          <span className="font-semibold">
            Total
          </span>

          <span
            className="text-3xl font-black"
            style={{
              color:
                corPrincipal,
            }}
          >
            R$ {Number(
              pedido.total
            ).toFixed(2)}
          </span>

        </div>

      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex gap-3">

        <button
          className="flex-1 h-14 rounded-xl text-white font-bold flex items-center justify-center gap-2"
          style={{
            backgroundColor:
              corPrincipal,
          }}
        >
          <MessageCircle size={18} />
          WhatsApp
        </button>

        <button
          onClick={() =>
            (window.location.href =
              `/${slug}`)
          }
          className="flex-1 h-14 rounded-xl border font-bold"
        >
          Novo Pedido
        </button>

      </div>

    </main>
  )
}