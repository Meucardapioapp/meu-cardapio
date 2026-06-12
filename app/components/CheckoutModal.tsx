"use client"

import { useState } from "react"

import {
  initMercadoPago,
} from "@mercadopago/sdk-react";

import { supabase } from "@/lib/supabase"

import { getThemeSettings } from "../lib/theme"

import Toast from "@/app/components/ui/toast"

initMercadoPago(
  process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY!
);

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

    const [cep, setCep] =
  useState("")

  const [bairro, setBairro] =
    useState("")

  const [rua, setRua] =
    useState("")

  const [numero, setNumero] =
    useState("")

    const [semNumero, setSemNumero] =
  useState(false)

  const [observacoes, setObservacoes] =
    useState("")

  const [loading, setLoading] =
    useState(false)

    const [formaPagamento, setFormaPagamento] =
  useState<"pix" | "cartao">("pix")

    const [frete, setFrete] =
  useState(0)

const [cidade, setCidade] =
  useState("Manaus")

const [estado, setEstado] =
  useState("AM")

    const [toast, setToast] = useState<{
  tipo: "sucesso" | "erro" | "aviso"
  titulo: string
  mensagem: string
} | null>(null)

  if (!open) return null

  async function buscarCep(
  valorCep: string
) {
  try {

    const cepLimpo =
      valorCep.replace(/\D/g, "")

    if (cepLimpo.length !== 8)
      return

    const response =
      await fetch(
        `https://viacep.com.br/ws/${cepLimpo}/json/`
      )

    const data =
      await response.json()

    if (data.erro) return

    setRua(data.logradouro)
    setBairro(data.bairro)
    setCidade(data.localidade)
    setEstado(data.uf)
    
    setTimeout(() => {
  calcularFrete()
}, 500)

  } catch (error) {
    console.error(error)
  }
}

  async function calcularFrete() {

    console.log("CALCULANDO FRETE")

console.log({
  rua,
  numero,
  bairro,
  restauranteId
})

  if (
    !rua ||
    !numero ||
    !bairro
  ) {
    return
  }

  try {

    const response = await fetch(
  "/api/calcular-frete" ,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },

   body: JSON.stringify({
  restauranteId,
  rua,
  numero,
  bairro,
  cidade,
  estado,
}),
  }
)

    const data =
      await response.json()

    if (
      data.sucesso &&
      data.faixaFrete
    ) {

      setFrete(
        data.faixaFrete.valor
      )
    }

  } catch (error) {

    console.log(
      "Erro frete:",
      error
    )
  }
}


async function pagarComPix() {

  console.log("CLICOU PIX")

  console.log(
  "RESTAURANTE ID PIX:",
  restauranteId
)

console.log(
  "TIPO:",
  typeof restauranteId
)

  try {

    setLoading(true)

    const pedido = {
      cliente,
      telefone,
      endereco: `${rua}, ${numero}`,
      bairro,
      rua,
      numero,
      observacoes,
      itens: cart,
      total: total + frete,
      status: "pendente",
      payment_status: "pending",
      payment_method: "pix",
      restaurante_id: restauranteId,
    }

    const {
  data,
  error,
} = await supabase
  .from("pedidos")
  .insert([pedido])
  .select()
  .single()

console.log(
  "PEDIDO CRIADO:",
  data
)

   if (error) {

  console.log(
    "ERRO SUPABASE:",
    error
  )

  alert(
    JSON.stringify(error)
  )

  return
} 

    const response =
      await fetch(
        "/api/mercadopago/criar-pix",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
        body: JSON.stringify({
  total: total + frete,
  pedidoId: data.id,
  restauranteId,
}),
        }
      )

    const resultado =
  await response.json()

console.log(
  "RESULTADO PIX:",
  resultado
)

    if (!resultado.success) {
      return
    }

    window.location.href =
`/pix?id=${data.id}&qr=${encodeURIComponent(
  resultado.qr_code
)}&img=${encodeURIComponent(
  resultado.qr_code_base64
)}`

  } catch (error) {

    console.log(error)

  } finally {

    setLoading(false)

  }
}

  async function finalizarPedido() {

  if (!lojaAberta) {

    setToast({
  tipo: "aviso",
  titulo: "Loja fechada",
  mensagem:
    "O restaurante está fechado neste momento."
})

setTimeout(() => {
  setToast(null)
}, 5000)

    return
  }

  if (
  !cliente ||
  !telefone ||
  !cep ||
  !bairro ||
  !rua ||
  !numero
) {

   setToast({
  tipo: "erro",
  titulo: "Campos obrigatórios",
  mensagem:
    "Preencha todos os campos para continuar."
})

setTimeout(() => {
  setToast(null)
}, 5000)

    return
  }

  if (!restauranteId) {

    setToast({
  tipo: "erro",
  titulo: "Erro",
  mensagem:
    "Restaurante não identificado."
})

setTimeout(() => {
  setToast(null)
}, 5000)

    return
  }

    try {

      setLoading(true)

      const pedido = {

        cliente,

        telefone,

        cep,

        endereco:
          `${rua}, ${numero}`,

        bairro,

        rua,

        numero,

        observacoes,

        itens: cart,

        subtotal: total,

taxa_entrega: frete,

total: total + frete,

        status: "pendente",

        restaurante_id:
          restauranteId,
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

  setToast({
    tipo: "erro",
    titulo: "Erro ao enviar pedido",
    mensagem:
      "Não foi possível concluir o pedido."
  })

  setTimeout(() => {
    setToast(null)
  }, 5000)

  return
}

      localStorage.setItem(
        "lastSlug",
        slug
      )

     clearCart()

setToast({
  tipo: "sucesso",
  titulo: "Pedido realizado",
  mensagem:
    "Seu pedido foi enviado com sucesso."
})

setTimeout(() => {
  window.location.href =
    `/pedido/${data.id}`
}, 1500)

    } catch (error) {

      console.log(error)

      setToast({
  tipo: "erro",
  titulo: "Erro",
  mensagem:
    "Não foi possível finalizar o pedido."
})

setTimeout(() => {
  setToast(null)
}, 5000)

    } finally {

      setLoading(false)
    }
  }

  return (
  <>
    {toast && (
      <Toast
        tipo={toast.tipo}
        titulo={toast.titulo}
        mensagem={toast.mensagem}
      />
    )}

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

<div className="mb-4">

  <p className={`mb-2 font-semibold ${textPrimary}`}>
    Forma de pagamento
  </p>

  <div className="flex gap-3">

    <button
      type="button"
      onClick={() =>
        setFormaPagamento("pix")
      }
      className={`
        px-4
        py-3
        rounded-xl
        border
        ${
          formaPagamento === "pix"
            ? "border-green-500 bg-green-500/10"
            : ""
        }
      `}
    >
      PIX
    </button>

    <button
      type="button"
      onClick={() =>
        setFormaPagamento("cartao")
      }
      className={`
        px-4
        py-3
        rounded-xl
        border
        ${
          formaPagamento === "cartao"
            ? "border-blue-500 bg-blue-500/10"
            : ""
        }
      `}
    >
      Cartão
    </button>

  </div>

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
  value={cep}
  onChange={(e) => {

    const valor =
      e.target.value

    setCep(valor)

    if (
      valor.replace(/\D/g, "")
        .length === 8
    ) {
      buscarCep(valor)
    }
  }}
  placeholder="CEP"
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
              value={bairro}
             onChange={(e) => {
  setBairro(e.target.value)

  setTimeout(() => {
    calcularFrete()
  }, 500)
}} 
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

<div className="flex gap-2">

  <input
    value={numero}
    disabled={semNumero}
    onChange={(e) => {

      setNumero(
        e.target.value
      )

      setTimeout(() => {
        calcularFrete()
      }, 500)

    }}
    placeholder="Número"
    className={`
      ${inputBg}
      border
      rounded-2xl
      p-4
      flex-1
      outline-none
      transition-all
      focus:ring-2
    `}
    style={{
      borderColor:
        selectedColor + "30",
    }}
  />

  <button
    type="button"
    onClick={() => {

      if (!semNumero) {
        setNumero("S/N")
      } else {
        setNumero("")
      }

      setSemNumero(!semNumero)

    }}
    className="
      px-4
      rounded-2xl
      border
      text-sm
      whitespace-nowrap
    "
  >
    Sem nº
  </button>

</div>
</div>

<input
  value={rua}
            onChange={(e) => {
  setRua(e.target.value)

  setTimeout(() => {
    calcularFrete()
  }, 500)
}}
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

        </div>

        <div className="
          mt-8
          flex
          items-center
          justify-between
          gap-6
        ">

          <div>

           <div>

  <p className={textSecondary}>
    Subtotal
  </p>

  <p className={textPrimary}>
    R$ {total.toFixed(2)}
  </p>

  <p className={`mt-2 ${textSecondary}`}>
    Frete
  </p>

  <p className={textPrimary}>
    R$ {frete.toFixed(2)}
  </p>

  <h3
    className="
      text-4xl
      font-black
      mt-2
    "
    style={{
      color: selectedColor,
    }}
  >
    R$ {(total + frete).toFixed(2)}
  </h3>

</div>

</div>

<button
            onClick={() => {

 if (
  formaPagamento === "pix"
) {
  pagarComPix()
} else {

  setToast({
    tipo: "aviso",
    titulo: "Cartão",
    mensagem:
      "Pagamento com cartão em implementação."
  })

}

}}
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

  </>
  )
}