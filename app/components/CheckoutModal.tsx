"use client"

import { useState } from "react"

type CheckoutModalProps = {
  total: number
  onClose: () => void
  onConfirm: (data: {
    nome: string
    telefone: string
    endereco: string
    pagamento: string
  }) => void
}

export default function CheckoutModal({
  total,
  onClose,
  onConfirm,
}: CheckoutModalProps) {

  const [nome, setNome] = useState("")
  const [telefone, setTelefone] = useState("")
  const [endereco, setEndereco] = useState("")
  const [pagamento, setPagamento] = useState("Dinheiro")

  function handleConfirm() {

    if (
      !nome ||
      !telefone ||
      !endereco
    ) {
      alert("Preencha todos os campos")
      return
    }

    onConfirm({
      nome,
      telefone,
      endereco,
      pagamento,
    })

  }

  return (

    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">

          <div>

            <h2 className="text-3xl font-bold text-white">
              Finalizar Pedido
            </h2>

            <p className="text-zinc-400 mt-1">
              Preencha seus dados para concluir
            </p>

          </div>

          <button
            onClick={onClose}
            className="bg-zinc-800 hover:bg-zinc-700 transition w-10 h-10 rounded-full text-white text-xl"
          >
            ×
          </button>

        </div>

        {/* BODY */}
        <div className="p-6 space-y-5">

          {/* NOME */}
          <div>

            <label className="block text-sm text-zinc-400 mb-2">
              Nome Completo
            </label>

            <input
              type="text"
              value={nome}
              onChange={(e) =>
                setNome(e.target.value)
              }
              placeholder="Digite seu nome"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 text-white outline-none focus:border-green-500 transition"
            />

          </div>

          {/* TELEFONE */}
          <div>

            <label className="block text-sm text-zinc-400 mb-2">
              WhatsApp
            </label>

            <input
              type="text"
              value={telefone}
              onChange={(e) =>
                setTelefone(e.target.value)
              }
              placeholder="(92) 99999-9999"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 text-white outline-none focus:border-green-500 transition"
            />

          </div>

          {/* ENDEREÇO */}
          <div>

            <label className="block text-sm text-zinc-400 mb-2">
              Endereço de Entrega
            </label>

            <textarea
              value={endereco}
              onChange={(e) =>
                setEndereco(e.target.value)
              }
              placeholder="Rua, número, bairro..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 text-white outline-none focus:border-green-500 transition resize-none h-28"
            />

          </div>

          {/* PAGAMENTO */}
          <div>

            <label className="block text-sm text-zinc-400 mb-2">
              Forma de Pagamento
            </label>

            <select
              value={pagamento}
              onChange={(e) =>
                setPagamento(e.target.value)
              }
              className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 text-white outline-none focus:border-green-500 transition"
            >

              <option>
                Dinheiro
              </option>

              <option>
                Pix
              </option>

              <option>
                Cartão de Crédito
              </option>

              <option>
                Cartão de Débito
              </option>

            </select>

          </div>

        </div>

        {/* FOOTER */}
        <div className="border-t border-zinc-800 p-6">

          <div className="flex items-center justify-between mb-5">

            <span className="text-zinc-400">
              Total
            </span>

            <span className="text-4xl font-bold text-green-400">
              R$ {total.toFixed(2)}
            </span>

          </div>

          <button
            onClick={handleConfirm}
            className="w-full bg-green-500 hover:bg-green-600 transition py-5 rounded-2xl text-xl font-bold text-white shadow-lg"
          >
            Confirmar Pedido
          </button>

        </div>

      </div>

    </div>

  )

}