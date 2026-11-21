"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  MapPin,
  Navigation,
  Truck
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { apiFetch } from "@/utils/apiFetch"
import Toast from "@/app/components/ui/toast"


export default function RestaurantePage() {
  const [cep, setCep] = useState("")
  const [endereco, setEndereco] = useState("")
  const [numero, setNumero] = useState("")
  const [complemento, setComplemento] = useState("")
  const [bairro, setBairro] = useState("")
  const [cidade, setCidade] = useState("")
  const [estado, setEstado] = useState("")



  // "Só trabalho com delivery": o cardápio não oferece retirada.
  const [soDelivery, setSoDelivery] = useState(false)
  const [salvandoModo, setSalvandoModo] = useState(false)

  const [loadingCep, setLoadingCep] = useState(false)
  const [loadingSalvar, setLoadingSalvar] =
  useState(false)

const [toast, setToast] = useState<{
  tipo: "sucesso" | "erro" | "aviso"
  titulo: string
  mensagem: string
} | null>(null)



useEffect(() => {
  carregarEndereco()
  apiFetch("/api/painel/formas-pedido")
    .then((r) => r.json())
    .then((d) => d?.success && setSoDelivery(d.retirada === false))
    .catch(() => {})
}, [])

async function mudarSoDelivery() {
  if (salvandoModo) return
  const novo = !soDelivery
  setSalvandoModo(true)
  try {
    const r = await apiFetch("/api/painel/formas-pedido", {
      method: "POST",
      body: JSON.stringify({ campo: "retirada", ativo: !novo }),
    })
    const d = await r.json().catch(() => null)
    if (!r.ok || !d?.success) throw new Error(d?.error || "Não foi possível alterar.")
    setSoDelivery(novo)
    setToast({
      tipo: "sucesso",
      titulo: novo ? "Só delivery" : "Retirada ligada",
      mensagem: novo
        ? "Seu cardápio agora mostra só a opção de entrega."
        : "Seus clientes podem escolher entre entrega e retirada.",
    })
  } catch (e: any) {
    setToast({ tipo: "erro", titulo: "Erro", mensagem: e?.message || "Não foi possível alterar." })
  } finally {
    setSalvandoModo(false)
    setTimeout(() => setToast(null), 5000)
  }
}

async function carregarEndereco() {
  try {
    const restauranteId =
      localStorage.getItem("restaurante_id")

    if (!restauranteId) return

    const { data, error } =
      await supabase
        .from("restaurantes")
        .select("*")
        .eq("id", restauranteId)
        .single()

    if (error || !data) return

    setCep(data.cep || "")
    setEndereco(data.endereco || "")
    setNumero(data.numero || "")
    setBairro(data.bairro || "")
    setCidade(data.cidade || "")
    setEstado(data.estado || "")
    setComplemento(
      data.complemento || ""
    )
  } catch (error) {

  setEndereco("")
  setBairro("")
  setCidade("")
  setEstado("")

}
}


async function buscarCEP(cepDigitado: string) {
  const cepLimpo = cepDigitado.replace(/\D/g, "")

  if (cepLimpo.length !== 8) return

  try {
    setLoadingCep(true)

    const response = await fetch(
      `https://viacep.com.br/ws/${cepLimpo}/json/`
    )

    const data = await response.json()

    if (data.erro) {
      return
    }

    setEndereco(data.logradouro || "")
    setBairro(data.bairro || "")
    setCidade(data.localidade || "")
    setEstado(data.uf || "")

  } catch (error) {
    } finally {
    setLoadingCep(false)
  }
}




 async function salvarEndereco() {
  try {
    setLoadingSalvar(true)

    const restauranteId =
      localStorage.getItem(
        "restaurante_id"
      )

    if (!restauranteId) {
      setToast({
        tipo: "erro",
        titulo: "Erro",
        mensagem:
          "Restaurante não encontrado.",
      })

      setLoadingSalvar(false)

      return
    }

    const { error } =
      await supabase
        .from("restaurantes")
        .update({
          cep,
          endereco,
          numero,
          bairro,
          cidade,
          estado,
          complemento,

        })
        .eq("id", restauranteId)

    if (error) throw error

    setToast({
      tipo: "sucesso",
      titulo: "Endereço salvo",
      mensagem:
        "As informações foram atualizadas com sucesso.",
    })

    setTimeout(() => {
      setToast(null)
    }, 5000)

  } catch (error) {
    setToast({
      tipo: "erro",
      titulo: "Erro ao salvar",
      mensagem:
        "Não foi possível salvar o endereço.",
    })

    setTimeout(() => {
      setToast(null)
    }, 5000)

  } finally {
    setLoadingSalvar(false)
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

    <main className="max-w-5xl mx-auto space-y-8">

      {/* HEADER */}

     

       
      {/* SÓ DELIVERY */}

      <button
        type="button"
        role="switch"
        aria-checked={soDelivery}
        onClick={mudarSoDelivery}
        disabled={salvandoModo}
        className={`w-full flex items-center gap-4 rounded-3xl border-2 p-5 text-left transition disabled:opacity-60 ${
          soDelivery ? "border-[#7A1F3D] bg-[#7A1F3D]/5" : "border-zinc-200 bg-white"
        }`}
      >
        <span className="w-12 h-12 rounded-2xl bg-[#F8F1F3] flex items-center justify-center shrink-0">
          <Truck size={24} className="text-[#7A1F3D]" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-bold text-lg text-zinc-900">Só trabalho com delivery</span>
          <span className="block text-sm text-zinc-500">
            {soDelivery
              ? "Ligado: não atendo retirada. O cardápio mostra só a entrega."
              : "Ligue se você não atende retirada no local. O cliente só vai poder pedir para entregar."}
          </span>
        </span>
        <span className={`relative w-14 h-8 shrink-0 rounded-full transition ${soDelivery ? "bg-green-600" : "bg-zinc-300"}`}>
          <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${soDelivery ? "left-7" : "left-1"}`} />
        </span>
      </button>

      {soDelivery && (
        <p className="-mt-4 text-sm text-zinc-500 px-2">
          O endereço abaixo fica opcional. Preencha só se você cobra a entrega por distância (km): ele é o ponto de saída do motoboy.
        </p>
      )}

      {/* FORMULÁRIO */}

      <div className="bg-white rounded-3xl border p-8">

        <div className="flex items-center gap-3 mb-8">

          <Navigation
            size={24}
            className="text-[#7A1F3D]"
          />

          <h2 className="text-3xl font-bold">
            Dados de Localização
          </h2>

        </div>

        <div className="space-y-5">

          {/* CEP */}

          <div>

<Input
  value={cep}
  placeholder="CEP"
  className="h-14 rounded-2xl"
 onChange={(e) => {
  const valor = e.target.value

  setCep(valor)

  buscarCEP(valor)
}}
/>









            <p className="text-sm text-zinc-500 mt-2">
 Digite o CEP do restaurante. O endereço será preenchido automaticamente.
            </p>

            {loadingCep && (
              <p className="text-sm text-[#7A1F3D] mt-2">
                Buscando endereço...
              </p>
            )}

          </div>

          {/* ENDEREÇO */}

<Input
  value={endereco}
  onChange={(e)=>setEndereco(e.target.value)}
  placeholder="Endereço"
  className="h-14 rounded-2xl"
/>

          {/* NÚMERO + BAIRRO */}

          <div className="grid md:grid-cols-2 gap-4">

            <Input
              value={numero}
              onChange={(e) =>
                setNumero(e.target.value)
              }
              placeholder="Número"
              className="h-14 rounded-2xl"
            />

<Input
  value={bairro}
  onChange={(e)=>setBairro(e.target.value)}
  placeholder="Bairro"
className="h-14 rounded-2xl"
/>

          </div>

          {/* CIDADE + ESTADO */}

          <div className="grid md:grid-cols-2 gap-4">

<Input
  value={cidade}
  onChange={(e)=>setCidade(e.target.value)}
  placeholder="Cidade"
className="h-14 rounded-2xl"
/>

<Input
  value={estado}
  onChange={(e)=>setEstado(e.target.value)}
  placeholder="Estado"
className="h-14 rounded-2xl"
/>

          </div>

          {/* COMPLEMENTO */}

          <Input
            value={complemento}
            onChange={(e) =>
              setComplemento(e.target.value)
            }
            placeholder="Complemento (opcional)"
            className="h-14 rounded-2xl"
          />

        </div>

      </div>

      {/* STATUS */}

      <div
        className="
        bg-green-50
        border
        border-green-200
        rounded-3xl
        p-5
      "
      >

        <p className="font-bold text-green-700">
          Para que serve este endereço
        </p>

        <p className="text-green-600 mt-1">
          {soDelivery
            ? "Como você só trabalha com delivery, ele serve apenas para calcular a taxa de entrega por distância."
            : "Aparece para o cliente que escolhe retirar no local e é usado para calcular a taxa de entrega por distância."}
        </p>

      </div>

      {/* BOTÃO */}

    
      <div className="flex justify-end">










        <Button
  onClick={salvarEndereco}
  disabled={loadingSalvar}
          className="
            bg-gradient-to-r
            from-[#7A1F3D]
            to-[#542129]
            text-white
            px-10
            py-6
            rounded-3xl
            font-bold
            text-lg
            shadow-lg
          "
        >
          {loadingSalvar
  ? "Salvando..."
  : "Salvar Endereço"}
        </Button>

      </div>

    </main>
  </>
)
}