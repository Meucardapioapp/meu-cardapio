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
import Toast from "@/app/components/ui/toast"


export default function RestaurantePage() {
  const [cep, setCep] = useState("")
  const [endereco, setEndereco] = useState("")
  const [numero, setNumero] = useState("")
  const [complemento, setComplemento] = useState("")
  const [bairro, setBairro] = useState("")
  const [cidade, setCidade] = useState("")
  const [estado, setEstado] = useState("")



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
}, [])

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

  console.log(error)

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
    console.log(error)
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
    console.log(error)

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
          Endereço configurado
        </p>

        <p className="text-green-600 mt-1">
          Este endereço será utilizado para calcular entregas e
          verificar a área atendida.
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