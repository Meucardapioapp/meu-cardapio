"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function HorariosPage() {

  const [horarios, setHorarios] = useState({
  seg_inicio: "",
  seg_fim: "",
  ter_inicio: "",
  ter_fim: "",
  qua_inicio: "",
  qua_fim: "",
  qui_inicio: "",
  qui_fim: "",
  sex_inicio: "",
  sex_fim: "",
  sab_inicio: "",
  sab_fim: "",
  dom_inicio: "",
  dom_fim: "",
})

const [diasAtivos, setDiasAtivos] = useState({
  seg: true,
  ter: true,
  qua: true,
  qui: true,
  sex: true,
  sab: true,
  dom: true,
})

const [restauranteId, setRestauranteId] =
  useState<string | null>(null)

useEffect(() => {
  carregarRestaurante()
}, [])

async function carregarRestaurante() {

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  console.log(
  "USER LOGADO:",
  user.id
)

  const {
    data: restaurante,
    error,
  } = await supabase
    .from("restaurantes")
    .select("id")
    .eq("auth_user_id", user.id)
    .single()

    console.log(
  "RESTAURANTE ENCONTRADO:",
  restaurante
)

console.log(
  "ERRO RESTAURANTE:",
  error
)

  if (error) {
    console.log(error)
    return
  }

  if (restaurante) {
    setRestauranteId(restaurante.id)
  }
 const { data: aparencia } = await supabase
  .from("aparencia")
  .select("*")
  .eq("restaurante_id", restaurante.id)
  .single()

console.log(
  "RESTAURANTE ID CARREGADO:",
  restaurante.id
)

console.log(
  "APARENCIA CARREGADA:",
  aparencia
)

if (aparencia) {

setDiasAtivos({

  seg: aparencia.seg_ativo ?? true,
  ter: aparencia.ter_ativo ?? true,
  qua: aparencia.qua_ativo ?? true,
  qui: aparencia.qui_ativo ?? true,
  sex: aparencia.sex_ativo ?? true,
  sab: aparencia.sab_ativo ?? true,
  dom: aparencia.dom_ativo ?? true,

})


  setHorarios({
    seg_inicio: aparencia.horario_seg_inicio || "",
    seg_fim: aparencia.horario_seg_fim || "",

    ter_inicio: aparencia.horario_ter_inicio || "",
    ter_fim: aparencia.horario_ter_fim || "",

    qua_inicio: aparencia.horario_qua_inicio || "",
    qua_fim: aparencia.horario_qua_fim || "",

    qui_inicio: aparencia.horario_qui_inicio || "",
    qui_fim: aparencia.horario_qui_fim || "",

    sex_inicio: aparencia.horario_sex_inicio || "",
    sex_fim: aparencia.horario_sex_fim || "",

    sab_inicio: aparencia.horario_sab_inicio || "",
    sab_fim: aparencia.horario_sab_fim || "",

    dom_inicio: aparencia.horario_dom_inicio || "",
    dom_fim: aparencia.horario_dom_fim || "",
  })
}
}
async function salvarHorarios() {

  if (!restauranteId) {
    alert("Restaurante não encontrado")
    return
  }

  const { error } = await supabase
    .from("aparencia")
 
.update({

  seg_ativo: diasAtivos.seg,
  ter_ativo: diasAtivos.ter,
  qua_ativo: diasAtivos.qua,
  qui_ativo: diasAtivos.qui,
  sex_ativo: diasAtivos.sex,
  sab_ativo: diasAtivos.sab,
  dom_ativo: diasAtivos.dom,

  horario_seg_inicio: horarios.seg_inicio,
  horario_seg_fim: horarios.seg_fim,

  horario_ter_inicio: horarios.ter_inicio,
  horario_ter_fim: horarios.ter_fim,

  horario_qua_inicio: horarios.qua_inicio,
  horario_qua_fim: horarios.qua_fim,

  horario_qui_inicio: horarios.qui_inicio,
  horario_qui_fim: horarios.qui_fim,

  horario_sex_inicio: horarios.sex_inicio,
  horario_sex_fim: horarios.sex_fim,

  horario_sab_inicio: horarios.sab_inicio,
  horario_sab_fim: horarios.sab_fim,

  horario_dom_inicio: horarios.dom_inicio,
  horario_dom_fim: horarios.dom_fim,

})


    .eq("restaurante_id", restauranteId)

  if (error) {
    console.log(error)
    alert("Erro ao salvar horários")
    return
  }

  alert("Horários salvos com sucesso!")
}
  const dias = [
  { id:"seg", nome:"Segunda-feira", inicio:"seg_inicio", fim:"seg_fim" },
  { id:"ter", nome:"Terça-feira", inicio:"ter_inicio", fim:"ter_fim" },
  { id:"qua", nome:"Quarta-feira", inicio:"qua_inicio", fim:"qua_fim" },
  { id:"qui", nome:"Quinta-feira", inicio:"qui_inicio", fim:"qui_fim" },
  { id:"sex", nome:"Sexta-feira", inicio:"sex_inicio", fim:"sex_fim" },
  { id:"sab", nome:"Sábado", inicio:"sab_inicio", fim:"sab_fim" },
  { id:"dom", nome:"Domingo", inicio:"dom_inicio", fim:"dom_fim" },
]

  return (
    <div className="max-w-7xl mx-auto px-8 py-8">
      <div className="mb-8">
        <h1 className="text-5xl font-black text-zinc-900">
          Horários de Funcionamento
        </h1>

        <p className="text-zinc-600 mt-3 text-lg">
          Configure os horários que seu restaurante recebe pedidos.
        </p>
      </div>

      <div className="space-y-6">

  <div className="grid grid-cols-2 gap-6">
        {/* STATUS */}

        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-8">
          <h2 className="text-xl font-bold text-zinc-900">
            Status Atual
          </h2>

          <div className="mt-6 flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-green-500" />

            <span className="text-2xl font-bold text-green-600">
              Aberto Agora
            </span>
          </div>

          <p className="text-zinc-600 mt-2">
            Fecha às 23:00
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-8">

    <div className="flex items-center gap-5">

        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-3xl">

            📅

        </div>

        <div>

            <p className="text-zinc-500 text-sm">

                Próxima abertura

            </p>

            <h2 className="text-3xl font-bold text-zinc-900">

                Domingo às 08:00

            </h2>

        </div>

    </div>

</div>

</div>

        {/* HORÁRIOS */}

        <div className="bg-white border border-zinc-200 rounded-3xl p-8">
          <h2 className="text-xl font-bold text-zinc-900">
            Horários Semanais
          </h2>

          <p className="text-zinc-500 mt-2">
            Configure os horários de atendimento.
          </p>

          <div className="mt-8 space-y-4">

  {dias.map((dia) => (

<div
  key={dia.id}
  className="grid grid-cols-[180px_170px_1fr] items-center gap-6 py-3 border-b border-zinc-100"
>

  {/* DIA */}

  <span className="font-bold text-zinc-900">
    {dia.nome}
  </span>

  {/* SWITCH */}

  <div className="flex items-center gap-3">

    <button
      type="button"
      onClick={() =>
        setDiasAtivos({
          ...diasAtivos,
          [dia.id]: !diasAtivos[dia.id as keyof typeof diasAtivos],
        })
      }
      className={`relative w-12 h-7 rounded-full transition ${
        diasAtivos[dia.id as keyof typeof diasAtivos]
          ? "bg-green-500"
          : "bg-zinc-300"
      }`}
    >

      <div
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
          diasAtivos[dia.id as keyof typeof diasAtivos]
            ? "left-5"
            : "left-0.5"
        }`}
      />

    </button>

    <span
      className={`font-semibold ${
        diasAtivos[dia.id as keyof typeof diasAtivos]
          ? "text-green-600"
          : "text-red-600"
      }`}
    >
      {diasAtivos[dia.id as keyof typeof diasAtivos]
        ? "Aberto"
        : "Fechado"}
    </span>

  </div>

  {/* HORÁRIOS */}

  {diasAtivos[dia.id as keyof typeof diasAtivos] ? (

    <div className="flex items-center gap-3">

      <input
        type="time"
        value={horarios[dia.inicio as keyof typeof horarios]}
        onChange={(e) =>
          setHorarios({
            ...horarios,
            [dia.inicio]: e.target.value,
          })
        }
        className="w-44 h-14 rounded-2xl border border-zinc-300 bg-white px-5 text-lg font-semibold text-zinc-900 shadow-sm"
      />

      <span className="text-zinc-400">
        até
      </span>

      <input
        type="time"
        value={horarios[dia.fim as keyof typeof horarios]}
        onChange={(e) =>
          setHorarios({
            ...horarios,
            [dia.fim]: e.target.value,
          })
        }
        className="w-44 h-14 rounded-2xl border border-zinc-300 bg-white px-5 text-lg font-semibold text-zinc-900 shadow-sm"
      />

    </div>

  ) : (

    <div className="h-14 rounded-2xl border border-zinc-200 bg-zinc-100 flex items-center px-5 text-zinc-500">

      Restaurante fechado neste dia

    </div>

  )}

</div>

))}

  <button
  onClick={salvarHorarios}
  className="
mt-8
inline-flex
items-center
justify-center
gap-3
bg-[#6D1F2F]
hover:bg-[#531723]
text-white
font-semibold
text-lg
px-8
py-4
rounded-2xl
shadow-lg
hover:shadow-xl
transition-all
duration-300
hover:-translate-y-0.5
active:scale-95
"
>
  Salvar Alterações
</button>

</div>
        </div>

        {/* PREVIEW */}

        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-8">
          <h2 className="text-2xl font-bold text-zinc-900">
            Prévia do Cliente
          </h2>

          <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />

              <span className="font-bold text-lg text-zinc-900">
                Aberto Agora
              </span>
            </div>

            <p className="text-zinc-600 mt-2">
              Hoje: 18:00 às 23:00
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}