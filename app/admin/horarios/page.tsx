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

  const {
    data: restaurante,
    error,
  } = await supabase
    .from("restaurantes")
    .select("id")
    .eq("auth_user_id", user.id)
    .single()

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

if (aparencia) {

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
    { nome: "Segunda", inicio: "seg_inicio", fim: "seg_fim" },
    { nome: "Terça", inicio: "ter_inicio", fim: "ter_fim" },
    { nome: "Quarta", inicio: "qua_inicio", fim: "qua_fim" },
    { nome: "Quinta", inicio: "qui_inicio", fim: "qui_fim" },
    { nome: "Sexta", inicio: "sex_inicio", fim: "sex_fim" },
    { nome: "Sábado", inicio: "sab_inicio", fim: "sab_fim" },
    { nome: "Domingo", inicio: "dom_inicio", fim: "dom_fim" },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-5xl font-black text-white">
          Horários de Funcionamento
        </h1>

        <p className="text-zinc-400 mt-3 text-lg">
          Configure os horários que seu restaurante recebe pedidos.
        </p>
      </div>

      <div className="grid gap-6">
        {/* STATUS */}

        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-white">
            Status Atual
          </h2>

          <div className="mt-6 flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-green-500" />

            <span className="text-2xl font-bold text-white">
              Aberto Agora
            </span>
          </div>

          <p className="text-zinc-400 mt-2">
            Fecha às 23:00
          </p>
        </div>

        {/* HORÁRIOS */}

        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-white">
            Horários Semanais
          </h2>

          <p className="text-zinc-400 mt-2">
            Configure os horários de atendimento.
          </p>

          <div className="mt-8 space-y-4">

  {dias.map((dia) => (

<div
  key={dia.nome}
  className="
    grid
    grid-cols-[120px_1fr]
    gap-4
    items-center
  "
>

  <span className="font-semibold text-white">
    {dia.nome}
  </span>

      <div className="flex items-center gap-3">

      <input
  type="time"
  value={
    horarios[
      dia.inicio as keyof typeof horarios
    ]
  }
  onChange={(e) =>
    setHorarios({
      ...horarios,
      [dia.inicio]: e.target.value,
    })
  }
  className="
    px-4
    py-3
    rounded-xl
    bg-black
    border
    border-zinc-700
    text-white
  "
/>

        <span className="text-zinc-500">
          até
        </span>

        <input
  type="time"
  value={
    horarios[
      dia.fim as keyof typeof horarios
    ]
  }
  onChange={(e) =>
    setHorarios({
      ...horarios,
      [dia.fim]: e.target.value,
    })
  }
  className="
    px-4
    py-3
    rounded-xl
    bg-black
    border
    border-zinc-700
    text-white
  "
/>

      </div>

    </div>

  ))}

  <button
  onClick={salvarHorarios}
  className="
      mt-8
      bg-green-500
      hover:bg-green-400
      text-black
      font-bold
      px-8
      py-4
      rounded-2xl
      transition
    "
  >
    Salvar Horários
  </button>

</div>
        </div>

        {/* PREVIEW */}

        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-white">
            Prévia do Cliente
          </h2>

          <div className="mt-6 bg-black border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />

              <span className="font-semibold text-white">
                Aberto Agora
              </span>
            </div>

            <p className="text-zinc-400 mt-2">
              Hoje: 18:00 às 23:00
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}