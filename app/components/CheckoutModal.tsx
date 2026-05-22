"use client"

import { useState } from "react"

import { supabase } from "../../utils/supabase/client"

type Props = {
  open: boolean
  onClose: () => void

  cart: any[]

  total: number

  clearCart: () => void
}

export default function CheckoutModal({
  open,
  onClose,
  cart,
  total,
  clearCart,
}: Props) {

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

    if (
      !cliente ||
      !telefone ||
      !bairro ||
      !rua ||
      !numero
    ) {

      alert(
        "Preencha os campos obrigatórios"
      )

      return
    }

    try {

      setLoading(true)

      const endereco = `
${bairro},
${rua},
${numero}
      `

      const pedido = {

        cliente,

        telefone,

        endereco,

        pagamento,

        observacoes,

        itens: cart,

        total,

        status: "pendente",
      }

      const { data, error } =
        await supabase
          .from("pedidos")
          .insert([pedido])
          .select()
          .single()

      if (error) {

        console.log(error)

        alert(
          "Erro ao finalizar pedido"
        )

        return
      }

      clearCart()

      window.location.href =
        `/pedido/${data.id}`

    } catch (error) {

      console.log(error)

    } finally {

      setLoading(false)
    }
  }

  return (

    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-5">

      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-xl p-6">

        <div className="flex items-center justify-between mb-6">

          <h2 className="text-3xl font-black">
            Finalizar Pedido
          </h2>

          <button
            onClick={onClose}
            className="text-zinc-500 text-2xl"
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
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"
          />

          <input
            value={telefone}
            onChange={(e) =>
              setTelefone(
                e.target.value
              )
            }
            placeholder="Telefone"
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"
          />

          <div className="grid grid-cols-2 gap-4">

            <input
              value={bairro}
              onChange={(e) =>
                setBairro(
                  e.target.value
                )
              }
              placeholder="Bairro"
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"
            />

            <input
              value={numero}
              onChange={(e) =>
                setNumero(
                  e.target.value
                )
              }
              placeholder="Número"
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"
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
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"
          />

          <textarea
            value={observacoes}
            onChange={(e) =>
              setObservacoes(
                e.target.value
              )
            }
            placeholder="Observações do pedido"
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 h-28 resize-none"
          />

          <select
            value={pagamento}
            onChange={(e) =>
              setPagamento(
                e.target.value
              )
            }
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"
          >
            <option>
              Pix
            </option>

            <option>
              Dinheiro
            </option>

            <option>
              Cartão
            </option>

          </select>

        </div>

        <div className="mt-8 flex items-center justify-between">

          <div>

            <p className="text-zinc-400">
              Total
            </p>

            <h3 className="text-4xl font-black text-green-400">
              R$ {total.toFixed(2)}
            </h3>

          </div>

          <button
            onClick={finalizarPedido}
            disabled={loading}
            className="bg-green-500 hover:bg-green-400 transition px-8 py-4 rounded-2xl font-bold text-lg"
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