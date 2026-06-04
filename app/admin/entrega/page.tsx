"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"

import {
  Truck,
  Gift,
  Coins,
  Plus,
  Trash2,
  Save,
  MapPin,
  Sparkles,
  Loader2,
} from "lucide-react"

type TipoEntrega =
  | "gratis"
  | "fixa"
  | "distancia"

type FaixaEntrega = {
  id?: string
  distancia_inicial: number
  distancia_km: number
  valor: number
}

export default function EntregaPage() {
  const [loading, setLoading] = useState(true)

  const [saving, setSaving] = useState(false)

  const [tipoEntrega, setTipoEntrega] =
    useState<TipoEntrega>("distancia")

  const [raioMaximo, setRaioMaximo] =
    useState(8)

  const [taxaFixa, setTaxaFixa] =
    useState(5)

  const [faixas, setFaixas] = useState<
    FaixaEntrega[]
  >([
    {
      distancia_inicial: 0,
      distancia_km: 3,
      valor: 0,
    },
    {
      distancia_inicial: 3,
      distancia_km: 5,
      valor: 5,
    },
    {
      distancia_inicial: 5,
      distancia_km: 8,
      valor: 12,
    },
  ])

  const restauranteId =
    typeof window !== "undefined"
      ? localStorage.getItem(
          "restaurante_id"
        )
      : null

  useEffect(() => {
    carregarConfiguracoes()
  }, [])

  async function carregarConfiguracoes() {
  try {
    if (!restauranteId) return

    const { data } = await supabase
      .from("taxas_entrega")
      .select("*")
      .eq(
        "restaurante_id",
        restauranteId
      )
      .single()

    if (!data) {
      setLoading(false)
      return
    }

    setTipoEntrega(
      data.tipo as TipoEntrega
    )

    setRaioMaximo(
      data.raio_maximo || 8
    )

    setTaxaFixa(
      data.taxa_fixa || 0
    )

    const { data: faixasData } =
      await supabase
        .from("faixas_entrega")
        .select("*")
        .eq(
          "taxas_entrega_id",
          data.id
        )
        .order("distancia_km")

    if (
      faixasData &&
      faixasData.length > 0
    ) {
      setFaixas(
        faixasData.map((item) => ({
          id: item.id,
          distancia_inicial:
            item.distancia_inicial || 0,
          distancia_km:
            item.distancia_km,
          valor: item.valor,
        }))
      )
    }
  } catch (error) {
    console.log(error)
  } finally {
    setLoading(false)
  }
}

function adicionarFaixa() {
  const ultima =
    faixas[faixas.length - 1]

  setFaixas([
    ...faixas,
    {
      distancia_inicial:
        ultima?.distancia_km || 0,
      distancia_km:
        (ultima?.distancia_km || 0) +
        1,
      valor: 0,
    },
  ])
}

function removerFaixa(index: number) {
  setFaixas(
    faixas.filter(
      (_, i) => i !== index
    )
  )
}

async function salvarConfiguracoes() {
  try {
    console.log("RESTAURANTE ID:", restauranteId)
    setSaving(true)

    if (!restauranteId) {
      alert(
        "Restaurante não encontrado"
      )
      return
    }

    let taxaEntregaId = ""

   const {
  data: existente,
  error: erroExistente
} = await supabase
  .from("taxas_entrega")
  .select("*")
  .eq(
    "restaurante_id",
    restauranteId
  )
  .single()

console.log(
  "BUSCA TAXA:",
  existente
)

console.log(
  "ERRO TAXA:",
  erroExistente
)

    if (existente) {
      taxaEntregaId = existente.id

      await supabase
        .from("taxas_entrega")
        .update({
          tipo: tipoEntrega,
          raio_maximo: raioMaximo,
          taxa_fixa: taxaFixa,
        })
        .eq("id", taxaEntregaId)

      await supabase
        .from("faixas_entrega")
        .delete()
        .eq(
          "taxas_entrega_id",
          taxaEntregaId
        )
    } else {
     const {
  data: criada,
  error: erroCriacao
} = await supabase
  .from("taxas_entrega")
  .insert({
    restaurante_id: restauranteId,
    tipo: tipoEntrega,
    raio_maximo: raioMaximo,
    taxa_fixa: taxaFixa,
  })
  .select()
  .single()

console.log(
  "CRIADA:",
  criada
)

console.log(
  "ERRO CRIACAO:",
  erroCriacao
)

if (!criada) {
  throw new Error(
    JSON.stringify(
      erroCriacao,
      null,
      2
    )
  )
}

taxaEntregaId = criada.id
    }

    if (
      tipoEntrega ===
      "distancia"
    ) {
      await supabase
        .from("faixas_entrega")
        .insert(
          faixas.map((faixa) => ({
            taxas_entrega_id:
              taxaEntregaId,
            distancia_inicial:
              faixa.distancia_inicial,
            distancia_km:
              faixa.distancia_km,
            valor: faixa.valor,
          }))
        )
    }

    alert(
      "Configuração salva com sucesso"
    )
} catch (error: any) {
  console.error(
    "ERRO COMPLETO:",
    error
  )

  alert(
    error?.message ||
    JSON.stringify(error, null, 2)
  )

} finally {
    setSaving(false)
  }
}

if (loading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-10 h-10 animate-spin text-[#7A1F3D]" />
    </div>
  )
}

return (
  <div className="max-w-7xl mx-auto">

    <div className="mb-10">
      <span className="px-4 py-2 rounded-full bg-[#E9DDE2] text-[#7A1F3D] text-sm font-semibold">
        🚚 Entregas
      </span>

      <h1 className="text-6xl font-black text-[#1F1720] mt-4">
        Taxa de Entrega
      </h1>

      <p className="text-xl text-[#6B6670] mt-3">
        Configure o raio de atendimento e as taxas cobradas por distância.
      </p>
    </div>

    <div className="bg-[#F5F2F4] rounded-[40px] p-10 shadow-xl border border-[#E6DDE1]">

      <div className="grid grid-cols-3 gap-6 mb-8">

        <button
          onClick={() =>
            setTipoEntrega("gratis")
          }
          className={`rounded-3xl p-8 text-left transition ${
            tipoEntrega === "gratis"
              ? "bg-gradient-to-r from-[#7A1F3D] to-[#542129] text-white shadow-xl"
              : "bg-white border"
          }`}
        >
          <Gift size={40} />
          <h3 className="font-bold text-2xl mt-4">
            Frete Grátis
          </h3>
          <p className="mt-2 opacity-80">
            Não cobrar entrega.
          </p>
        </button>

        <button
          onClick={() =>
            setTipoEntrega("fixa")
          }
          className={`rounded-3xl p-8 text-left transition ${
            tipoEntrega === "fixa"
              ? "bg-gradient-to-r from-[#7A1F3D] to-[#542129] text-white shadow-xl"
              : "bg-white border"
          }`}
        >
          <Coins size={40} />
          <h3 className="font-bold text-2xl mt-4">
            Taxa Fixa
          </h3>
          <p className="mt-2 opacity-80">
            Mesmo valor para todos.
          </p>
        </button>

        <button
          onClick={() =>
            setTipoEntrega("distancia")
          }
          className={`rounded-3xl p-8 text-left transition ${
            tipoEntrega === "distancia"
              ? "bg-gradient-to-r from-[#7A1F3D] to-[#542129] text-white shadow-xl"
              : "bg-white border"
          }`}
        >
          <MapPin size={40} />
          <h3 className="font-bold text-2xl mt-4">
            Por Distância
          </h3>
          <p className="mt-2 opacity-80">
            Valor baseado no raio.
          </p>
        </button>

      </div>

      <div className="space-y-6">

        <div>
          <label className="font-semibold text-[#1F1720]">
            Raio Máximo de Entrega (km)
          </label>

          <input
            type="number"
            value={raioMaximo}
            onChange={(e) =>
              setRaioMaximo(
                Number(e.target.value)
              )
            }
            className="w-full mt-2 bg-white border rounded-2xl p-5"
          />
        </div>

        {tipoEntrega === "fixa" && (
          <div>
            <label className="font-semibold">
              Taxa Fixa (R$)
            </label>

            <input
              type="number"
              value={taxaFixa}
              onChange={(e) =>
                setTaxaFixa(
                  Number(e.target.value)
                )
              }
              className="w-full mt-2 bg-white border rounded-2xl p-5"
            />
          </div>
        )}

        {tipoEntrega ===
          "distancia" && (
          <div className="bg-white rounded-3xl p-8 border">

            <div className="flex items-center justify-between mb-6">

              <div>
<h2 className="text-3xl font-black">
  Tabela de Cobrança por Distância
</h2>

  <p className="text-zinc-500 mt-2">
  Defina quanto o cliente pagará conforme a distância da entrega.
</p>
</div>

              <button
                onClick={
                  adicionarFaixa
                }
                className="bg-[#7A1F3D] text-white px-6 py-3 rounded-2xl flex items-center gap-2"
              >
                <Plus size={18} />
                Adicionar Faixa
              </button>
            </div>

        <div className="space-y-4">

  <div className="grid grid-cols-[1fr_1fr_80px] gap-4 mb-2">
    <div className="font-semibold text-zinc-600">
      Entrega até
    </div>

    <div className="font-semibold text-zinc-600">
      Valor cobrado
    </div>

    <div />
  </div>

  {faixas.map((faixa, index) => (

                  <div
                    key={index}
                    className="grid grid-cols-[1fr_1fr_80px] gap-4"
                  >

                    <div className="relative">
  <input
    type="number"
    value={faixa.distancia_km}
    onChange={(e) => {
      const nova = [...faixas]

      nova[index].distancia_km =
        Number(e.target.value)

      setFaixas(nova)
    }}
    className="
      w-full
      bg-[#F5F2F4]
      border
      border-zinc-200
      rounded-2xl
      p-4
      pr-14
      focus:outline-none
      focus:ring-2
      focus:ring-[#7A1F3D]
    "
  />

  <span
  className="
    absolute
    right-4
    top-1/2
    -translate-y-1/2
    text-zinc-500
    text-sm
    font-semibold
    pointer-events-none
  "
>
  km
</span>
</div>

                    <div className="relative">
  <span
    className="
      absolute
      left-4
      top-1/2
      -translate-y-1/2
      text-zinc-500
      font-semibold
      pointer-events-none
    "
  >
    R$
  </span>

  <input
  type="number"
  step="0.01"
  value={faixa.valor}
  placeholder="0,00"
  onChange={(e) => {
    const nova = [...faixas]

    nova[index].valor =
      Number(e.target.value)

    setFaixas(nova)
  }}

    className="
      w-full
      bg-[#F5F2F4]
      border
      border-zinc-200
      rounded-2xl
      p-4
      pl-12
      focus:outline-none
      focus:ring-2
      focus:ring-[#7A1F3D]
    "
  />
</div>

                 <button
  onClick={() =>
    removerFaixa(index)
  }
  className="bg-red-500 rounded-2xl flex items-center justify-center text-white"
>
  <Trash2 />
</button>

</div>

))}

</div>

</div>

)}

<button
  onClick={
    salvarConfiguracoes
  }
          disabled={saving}
          className="bg-gradient-to-r from-[#7A1F3D] to-[#542129] text-white px-10 py-5 rounded-3xl font-bold flex items-center gap-3"
        >
          {saving ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Save />
          )}

          Salvar Configurações
        </button>

      </div>

    </div>

  </div>
)
}