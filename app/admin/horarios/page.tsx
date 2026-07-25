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

  const [horarioPadraoInicio, setHorarioPadraoInicio] = useState("")
const [horarioPadraoFim, setHorarioPadraoFim] = useState("")

const [diasSelecionados, setDiasSelecionados] = useState({
  seg: true,
  ter: true,
  qua: true,
  qui: true,
  sex: true,
  sab: true,
  dom: false,
})

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

function aplicarHorarioPadrao() {
  if (!horarioPadraoInicio || !horarioPadraoFim) {
    alert("Informe o horário de abertura e fechamento.")
    return
  }

  const novosHorarios = { ...horarios }
  const novosDiasAtivos = { ...diasAtivos }

  const diasIds = [
    "seg",
    "ter",
    "qua",
    "qui",
    "sex",
    "sab",
    "dom",
  ] as const

  diasIds.forEach((dia) => {
    if (diasSelecionados[dia]) {
      // DIA SELECIONADO = ABERTO
      novosDiasAtivos[dia] = true

      novosHorarios[`${dia}_inicio`] = horarioPadraoInicio
      novosHorarios[`${dia}_fim`] = horarioPadraoFim
    } else {
      // DIA NÃO SELECIONADO = FECHADO
      novosDiasAtivos[dia] = false

      novosHorarios[`${dia}_inicio`] = ""
      novosHorarios[`${dia}_fim`] = ""
    }
  })

  setHorarios(novosHorarios)
  setDiasAtivos(novosDiasAtivos)
}

function mostrarNotificacao(
  tipo: "sucesso" | "erro",
  titulo: string,
  mensagem: string
) {
  setNotificacao({
    tipo,
    titulo,
    mensagem,
  })

  setTimeout(() => {
    setNotificacao(null)
  }, 3500)
}

async function salvarHorarios() {

if (!restauranteId) {
  mostrarNotificacao(
    "erro",
    "Não foi possível salvar",
    "Restaurante não encontrado."
  )
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

  mostrarNotificacao(
    "erro",
    "Erro ao salvar horários",
    "Não foi possível salvar as alterações. Tente novamente."
  )

  return
}

mostrarNotificacao(
  "sucesso",
  "Horários salvos com sucesso!",
  "As alterações já estão ativas no seu cardápio."
)
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


const [notificacao, setNotificacao] = useState<{
  tipo: "sucesso" | "erro"
  titulo: string
  mensagem: string
} | null>(null)


// ======================================================
// PRÉVIA AUTOMÁTICA DO HORÁRIO DE HOJE
// ======================================================

const diasSemana = [
  "dom",
  "seg",
  "ter",
  "qua",
  "qui",
  "sex",
  "sab",
] as const;

const hoje = diasSemana[new Date().getDay()];

const hojeAtivo = diasAtivos[hoje];

const horarioInicioHoje =
  horarios[`${hoje}_inicio` as keyof typeof horarios];

const horarioFimHoje =
  horarios[`${hoje}_fim` as keyof typeof horarios];

function converterHorarioParaMinutos(horario: string) {
  if (!horario) return 0;

  const [hora, minuto] = horario.split(":").map(Number);

  return hora * 60 + minuto;
}

const agora = new Date();

const minutosAgora =
  agora.getHours() * 60 + agora.getMinutes();

const minutosInicio =
  converterHorarioParaMinutos(horarioInicioHoje);

const minutosFim =
  converterHorarioParaMinutos(horarioFimHoje);

const temHorarioHoje =
  Boolean(horarioInicioHoje && horarioFimHoje);

const estaAbertoAgora =
  hojeAtivo &&
  temHorarioHoje &&
  minutosAgora >= minutosInicio &&
  minutosAgora < minutosFim;


// ======================================================
// PRÓXIMA ABERTURA
// ======================================================

const nomesDias: Record<(typeof diasSemana)[number], string> = {
  dom: "Domingo",
  seg: "Segunda-feira",
  ter: "Terça-feira",
  qua: "Quarta-feira",
  qui: "Quinta-feira",
  sex: "Sexta-feira",
  sab: "Sábado",
};

function calcularProximaAbertura() {
  const indiceHoje = agora.getDay();

  // Se o restaurante ainda vai abrir hoje
  if (
    hojeAtivo &&
    temHorarioHoje &&
    minutosAgora < minutosInicio
  ) {
    return `Hoje às ${horarioInicioHoje}`;
  }

  // Procura o próximo dia aberto
  for (let i = 1; i <= 7; i++) {
    const indiceDia = (indiceHoje + i) % 7;
    const dia = diasSemana[indiceDia];

    const diaAtivo = diasAtivos[dia];

    const horarioInicio =
      horarios[`${dia}_inicio` as keyof typeof horarios];

    if (diaAtivo && horarioInicio) {
      if (i === 1) {
        return `Amanhã às ${horarioInicio}`;
      }

      return `${nomesDias[dia]} às ${horarioInicio}`;
    }
  }

  return "Nenhum horário configurado";
}

const proximaAbertura = calcularProximaAbertura();

return (
  <>
    {/* NOTIFICAÇÃO */}

    {notificacao && (
      <div className="fixed top-6 right-6 z-[9999] w-[390px] max-w-[calc(100vw-32px)]">

        <div className="
          bg-white
          border border-zinc-200
          rounded-2xl
          shadow-2xl
          p-4
          flex
          items-start
          gap-3
        ">

          {/* ÍCONE */}

          <div
            className={`
              w-10 h-10
              rounded-full
              flex
              items-center
              justify-center
              shrink-0
              text-lg
              font-bold

              ${
                notificacao.tipo === "sucesso"
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }
            `}
          >
            {notificacao.tipo === "sucesso" ? "✓" : "!"}
          </div>


          {/* TEXTO */}

          <div className="flex-1 pt-0.5">

            <p className="font-bold text-zinc-900">
              {notificacao.titulo}
            </p>

            <p className="text-sm text-zinc-500 mt-1">
              {notificacao.mensagem}
            </p>

          </div>


          {/* FECHAR */}

          <button
            type="button"
            onClick={() => setNotificacao(null)}
            className="
              w-8 h-8
              rounded-lg
              flex
              items-center
              justify-center
              text-zinc-400
              hover:text-zinc-700
              hover:bg-zinc-100
              transition
            "
          >
            ×
          </button>

        </div>

      </div>
    )}


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

  {/* STATUS ATUAL */}
  <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-8">

    <h2 className="text-xl font-bold text-zinc-900">
      Status Atual
    </h2>

    <div className="mt-6 flex items-center gap-3">

      <div
        className={`w-4 h-4 rounded-full ${
          estaAbertoAgora
            ? "bg-green-500"
            : "bg-red-500"
        }`}
      />

      <span
        className={`text-2xl font-bold ${
          estaAbertoAgora
            ? "text-green-600"
            : "text-red-600"
        }`}
      >
        {estaAbertoAgora
          ? "Aberto Agora"
          : "Fechado Agora"}
      </span>

    </div>

    {hojeAtivo && temHorarioHoje ? (
      <p className="text-zinc-600 mt-2">
        {estaAbertoAgora
          ? `Fecha às ${horarioFimHoje}`
          : minutosAgora < minutosInicio
          ? `Abre hoje às ${horarioInicioHoje}`
          : `Fechou hoje às ${horarioFimHoje}`}
      </p>
    ) : (
      <p className="text-zinc-600 mt-2">
        Restaurante fechado hoje
      </p>
    )}

  </div>


  {/* PRÓXIMA ABERTURA */}
  <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-8">

    <div className="flex items-center gap-5">

      <div className="w-16 h-16 rounded-2xl bg-[#6D1F2F]/10 flex items-center justify-center text-3xl">
        📅
      </div>

      <div>

        <p className="text-zinc-500 text-sm">
          Próxima abertura
        </p>

        <h2 className="text-3xl font-bold text-zinc-900">
          {proximaAbertura}
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

{/* CONFIGURAÇÃO RÁPIDA */}

<div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-5">

  {/* CABEÇALHO */}
  <div className="flex items-start justify-between gap-6">

    <div>
      <h3 className="text-base font-bold text-zinc-900">
        Configuração rápida
      </h3>

      <p className="text-sm text-zinc-500 mt-1">
        Defina um horário e escolha os dias que o restaurante funciona.
      </p>
    </div>

  </div>


  {/* CONTEÚDO */}
  <div className="mt-5 flex flex-wrap items-end gap-5">

    {/* HORÁRIO */}
    <div>

      <p className="text-xs font-semibold text-zinc-600 mb-2">
        Horário de funcionamento
      </p>

      <div className="flex items-center gap-2">

        <input
          type="time"
          value={horarioPadraoInicio}
          onChange={(e) =>
            setHorarioPadraoInicio(e.target.value)
          }
          className="
            w-36
            h-11
            rounded-xl
            border
            border-zinc-300
            bg-white
            px-4
            font-semibold
            text-zinc-900
            outline-none
            focus:border-[#6D1F2F]
            transition
          "
        />

        <span className="text-sm text-zinc-400">
          até
        </span>

        <input
          type="time"
          value={horarioPadraoFim}
          onChange={(e) =>
            setHorarioPadraoFim(e.target.value)
          }
          className="
            w-36
            h-11
            rounded-xl
            border
            border-zinc-300
            bg-white
            px-4
            font-semibold
            text-zinc-900
            outline-none
            focus:border-[#6D1F2F]
            transition
          "
        />

      </div>

    </div>


    {/* DIAS */}
    <div className="flex-1">

      <p className="text-xs font-semibold text-zinc-600 mb-2">
        Dias de funcionamento
      </p>

      <div className="flex flex-wrap gap-2">

        {[
          { id: "seg", nome: "Seg" },
          { id: "ter", nome: "Ter" },
          { id: "qua", nome: "Qua" },
          { id: "qui", nome: "Qui" },
          { id: "sex", nome: "Sex" },
          { id: "sab", nome: "Sáb" },
          { id: "dom", nome: "Dom" },
        ].map((dia) => {

          const selecionado =
            diasSelecionados[
              dia.id as keyof typeof diasSelecionados
            ]

          return (
            <button
              key={dia.id}
              type="button"
              onClick={() =>
                setDiasSelecionados({
                  ...diasSelecionados,
                  [dia.id]: !selecionado,
                })
              }
              className={`
                h-10
                min-w-[52px]
                px-3
                rounded-xl
                border
                text-sm
                font-semibold
                transition-all
                active:scale-95

                ${
                  selecionado
                    ? "bg-[#6D1F2F] border-[#6D1F2F] text-white shadow-sm"
                    : "bg-white border-zinc-300 text-zinc-500 hover:border-zinc-400"
                }
              `}
            >
              {dia.nome}
            </button>
          )

        })}

      </div>

    </div>

  </div>


  {/* RODAPÉ */}
  <div className="mt-5 pt-4 border-t border-zinc-200 flex items-center justify-between gap-4">

    <p className="text-xs text-zinc-500">
      Dias não selecionados serão definidos como fechados.
    </p>

    <button
      type="button"
      onClick={aplicarHorarioPadrao}
      className="
        h-11
        px-5
        rounded-xl
        bg-[#6D1F2F]
        hover:bg-[#531723]
        text-white
        text-sm
        font-semibold
        transition-all
        active:scale-[0.98]
        whitespace-nowrap
      "
    >
      Aplicar horários
    </button>

  </div>

</div>

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

  <p className="mt-2 text-sm text-zinc-500">
    Veja como o horário de hoje será exibido no cardápio.
  </p>

  <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">

    <div className="flex items-center gap-2">

      <div
        className={`w-3 h-3 rounded-full ${
          estaAbertoAgora
            ? "bg-green-500"
            : "bg-red-500"
        }`}
      />

      <span
        className={`font-bold text-lg ${
          estaAbertoAgora
            ? "text-green-600"
            : "text-red-600"
        }`}
      >
        {estaAbertoAgora
          ? "Aberto Agora"
          : "Fechado Agora"}
      </span>

    </div>

    {hojeAtivo && temHorarioHoje ? (
      <p className="text-zinc-600 mt-2">
        Hoje:{" "}
        <strong className="text-zinc-900">
          {horarioInicioHoje} às {horarioFimHoje}
        </strong>
      </p>
    ) : (
      <p className="text-zinc-600 mt-2">
        Restaurante fechado hoje
      </p>
    )}

  </div>
</div>
      </div>
    </div>
  </>
  )
}