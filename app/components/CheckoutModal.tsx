"use client"

import { useState } from "react"

import { supabase } from "@/lib/supabase"

import { getThemeSettings } from "../lib/theme"

type Props = {
  open: boolean
  onClose: () => void
  cart: any[]
  total: number
  slug: string
  restauranteId: string
  lojaAberta: boolean
  clearCart: () => void
}

export default function CheckoutModal({
  open,
  onClose,
  cart,
  total,
  slug,
  restauranteId,
  lojaAberta,
  clearCart,
}: Props) {

  const {
    lightMode,
    selectedColor,
  } = getThemeSettings()

  const bgCard = lightMode
    ? "bg-[#F6F1E7] border border-zinc-200"
    : "bg-zinc-950 border border-zinc-800"

  const inputBg = lightMode
    ? "bg-white border-zinc-300 text-zinc-900"
    : "bg-zinc-900 border-zinc-800 text-white"

  const textPrimary = lightMode
    ? "text-zinc-900"
    : "text-white"

  const textSecondary = lightMode
    ? "text-zinc-500"
    : "text-zinc-400"

  const overlayBg = lightMode
    ? "bg-black/40"
    : "bg-black/80"

  const [cliente, setCliente] =
    useState("")

  const [telefone, setTelefone] =
    useState("")

  const [bairro, setBairro] =
    useState("")

  const [rua, setRua] =
    useState("")

  const [numero, setNumero] =
    useState("")

  const [observacoes, setObservacoes] =
    useState("")

  const [pagamento, setPagamento] =
    useState("Pix")

  const [loading, setLoading] =
    useState(false)

  if (!open) return null

  async function finalizarPedido() {

  if (!lojaAberta) {

    alert(
      "Restaurante fechado no momento."
    )

    return
  }

  if (
    !cliente ||
    !telefone ||
    !bairro ||
    !rua ||
    !numero
  ) {

    alert(
      "Preencha todos os campos"
    )

    return
  }

  if (!restauranteId) {

    alert(
      "Restaurante não identificado"
    )

    return
  }

    try {

      setLoading(true)

      const pedido = {

        cliente,

        telefone,

        endereco:
          `${rua}, ${numero}`,

        bairro,

        rua,

        numero,

        observacoes,

        pagamento,

        itens: cart,

        total,

        status: "pendente",

        restaurante_id:
          restaurantId,
      }

      console.log(
        "PEDIDO ENVIADO:",
        pedido
      )

      const {
        data,
        error,
      } = await supabase

        .from("pedidos")

        .insert([pedido])

        .select()

        .single()

      if (error) {

        console.log(
          "ERRO PEDIDO:",
          error
        )

        alert(
          JSON.stringify(error)
        )

        return
      }

      localStorage.setItem(
        "lastSlug",
        slug
      )

      clearCart()

      alert(
        "Pedido realizado com sucesso!"
      )

      window.location.href =
        `/pedido/${data.id}`

    } catch (error) {

      console.log(error)

      alert(
        "Erro ao finalizar pedido"
      )

    } finally {

      setLoading(false)
    }
  }

  return (

    <div className={`
      fixed
      inset-0
      ${overlayBg}
      z-50
      flex
      items-center
      justify-center
      p-4
      backdrop-blur-sm
    `}>

      <div className={`
        ${bgCard}
        rounded-3xl
        w-full
        max-w-xl
        p-6
        shadow-2xl
      `}>

        <div className="
          flex
          items-center
          justify-between
          mb-6
        ">

          <div>

            <h2 className={`
              text-3xl
              font-black
              ${textPrimary}
            `}>
              Finalizar Pedido
            </h2>

            <p className={`
              mt-1
              text-sm
              ${textSecondary}
            `}>
              Confira seus dados antes de confirmar
            </p>

          </div>

          <button
            onClick={onClose}
            className={`
              text-2xl
              transition
              hover:scale-110
              ${textSecondary}
            `}
          >
            ×
          </button>

        </div>

        <div className="grid gap-4">

          <input
            value={cliente}
            onChange={(e) =>
              setCliente(
                e.target.value
              )
            }
            placeholder="Seu nome"
            className={`
              ${inputBg}
              border
              rounded-2xl
              p-4
              outline-none
              transition-all
              focus:ring-2
            `}
            style={{
              borderColor:
                selectedColor + "30",
            }}
          />

          <input
            value={telefone}
            onChange={(e) =>
              setTelefone(
                e.target.value
              )
            }
            placeholder="Telefone"
            className={`
              ${inputBg}
              border
              rounded-2xl
              p-4
              outline-none
              transition-all
              focus:ring-2
            `}
            style={{
              borderColor:
                selectedColor + "30",
            }}
          />

          <div className="
            grid
            grid-cols-2
            gap-4
          ">

            <input
              value={bairro}
              onChange={(e) =>
                setBairro(
                  e.target.value
                )
              }
              placeholder="Bairro"
              className={`
                ${inputBg}
                border
                rounded-2xl
                p-4
                outline-none
                transition-all
                focus:ring-2
              `}
              style={{
                borderColor:
                  selectedColor + "30",
              }}
            />

            <input
              value={numero}
              onChange={(e) =>
                setNumero(
                  e.target.value
                )
              }
              placeholder="Número"
              className={`
                ${inputBg}
                border
                rounded-2xl
                p-4
                outline-none
                transition-all
                focus:ring-2
              `}
              style={{
                borderColor:
                  selectedColor + "30",
              }}
            />

          </div>

          <input
            value={rua}
            onChange={(e) =>
              setRua(
                e.target.value
              )
            }
            placeholder="Rua"
            className={`
              ${inputBg}
              border
              rounded-2xl
              p-4
              outline-none
              transition-all
              focus:ring-2
            `}
            style={{
              borderColor:
                selectedColor + "30",
            }}
          />

          <textarea
            value={observacoes}
            onChange={(e) =>
              setObservacoes(
                e.target.value
              )
            }
            placeholder="Observações"
            className={`
              ${inputBg}
              border
              rounded-2xl
              p-4
              h-28
              resize-none
              outline-none
              transition-all
              focus:ring-2
            `}
            style={{
              borderColor:
                selectedColor + "30",
            }}
          />

          <select
            value={pagamento}
            onChange={(e) =>
              setPagamento(
                e.target.value
              )
            }
            className={`
              ${inputBg}
              border
              rounded-2xl
              p-4
              outline-none
              transition-all
              focus:ring-2
            `}
            style={{
              borderColor:
                selectedColor + "30",
            }}
          >

            <option value="Pix">
              Pix
            </option>

            <option value="Dinheiro">
              Dinheiro
            </option>

            <option value="Cartão">
              Cartão
            </option>

          </select>

        </div>

        <div className="
          mt-8
          flex
          items-center
          justify-between
          gap-6
        ">

          <div>

            <p className={`
              text-sm
              ${textSecondary}
            `}>
              Total
            </p>

            <h3
              className="
                text-4xl
                font-black
              "
              style={{
                color: selectedColor,
              }}
            >
              R$ {total.toFixed(2)}
            </h3>

          </div>

          <button
            onClick={finalizarPedido}
            disabled={loading}
            className="
              px-8
              py-4
              rounded-2xl
              font-bold
              text-lg
              text-white
              transition-all
              hover:scale-[1.02]
              disabled:opacity-50
            "
            style={{
              backgroundColor:
                selectedColor,
            }}
          >

            {loading
              ? "Enviando..."
              : "Confirmar Pedido"}

          </button>

        </div>

      </div>

    </div>
  )
}