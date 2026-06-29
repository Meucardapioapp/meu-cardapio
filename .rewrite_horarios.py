from pathlib import Path
path = Path(r"c:\Users\Usuário\Desktop\meu-cardapio\app\admin\horarios\page.tsx")
content = '''"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Check, Loader2, Save } from "lucide-react"

import { supabase } from "@/lib/supabase"

const dias = [
  { nome: "Segunda", inicio: "seg_inicio", fim: "seg_fim" },
  { nome: "Terça", inicio: "ter_inicio", fim: "ter_fim" },
  { nome: "Quarta", inicio: "qua_inicio", fim: "qua_fim" },
  { nome: "Quinta", inicio: "qui_inicio", fim: "qui_fim" },
  { nome: "Sexta", inicio: "sex_inicio", fim: "sex_fim" },
  { nome: "Sábado", inicio: "sab_inicio", fim: "sab_fim" },
  { nome: "Domingo", inicio: "dom_inicio", fim: "dom_fim" },
]

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
  const [restauranteId, setRestauranteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(false)

  useEffect(() => {
    carregarRestaurante()
  }, [])

  async function carregarRestaurante() {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data: restaurante, error } = await supabase
      .from("restaurantes")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()

    if (error || !restaurante) {
      setLoading(false)
      return
    }

    setRestauranteId(restaurante.id)

    const { data: aparencia, error: aparenciaError } = await supabase
      .from("aparencia")
      .select("*")
      .eq("restaurante_id", restaurante.id)
      .single()

    if (aparenciaError) {
      setLoading(false)
      return
    }

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

    setLoading(false)
  }

  async function salvarHorarios() {
    if (!restauranteId) return
    setSaving(true)

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

    setSaving(false)

    if (error) {
      console.error(error)
      return
    }

    setToast(true)
    setTimeout(() => setToast(false), 3000)
  }

  const resumo = useMemo(() => {
    return dias.map((dia) => {
      const inicio = horarios[dia.inicio as keyof typeof horarios]
      const fim = horarios[dia.fim as keyof typeof horarios]
      return {
        nome: dia.nome,
        texto: inicio && fim ? f"{inicio} - {fim}" : "Fechado",
      }
    })
  }, [horarios])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6 animate-pulse">
          <div className="h-24 rounded-[32px] bg-slate-800" />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-60 rounded-[32px] bg-slate-800" />
            <div className="h-60 rounded-[32px] bg-slate-800" />
          </div>
          <div className="h-[520px] rounded-[32px] bg-slate-800" />
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[32px] border border-slate-800 bg-slate-900/90 shadow-2xl shadow-slate-950/40">
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-8 py-10 sm:px-10 lg:px-12">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <span className="inline-flex rounded-full bg-emerald-500/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
                  Painel Premium
                </span>
                <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Horários de Funcionamento
                </h1>
                <p className="mt-4 max-w-2xl text-slate-300">
                  Ajuste os períodos de abertura do restaurante e acompanhe a prévia do cliente em tempo real.
                </p>
              </div>
              <button
                type="button"
                onClick={salvarHorarios}
                disabled={saving}
                className="inline-flex items-center justify-center rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar alterações
              </button>
            </div>
          </div>

          <div className="border-t border-slate-800 px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
            <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr] xl:items-start">
              <section className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-[28px] border border-slate-800 bg-slate-950/90 p-6 text-white shadow-lg shadow-slate-950/20">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Status atual</p>
                    <p className="mt-4 text-3xl font-semibold text-white">Aberto agora</p>
                    <p className="mt-3 text-sm text-slate-500">Seu restaurante está recebendo pedidos neste momento.</p>
                  </div>
                  <div className="rounded-[28px] border border-slate-800 bg-slate-950/90 p-6 text-white shadow-lg shadow-slate-950/20">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Próxima abertura</p>
                    <p className="mt-4 text-3xl font-semibold text-white">Hoje às 12:00</p>
                    <p className="mt-3 text-sm text-slate-500">Veja a janela de atendimento mais próxima.</p>
                  </div>
                </div>

                <div className="rounded-[32px] border border-slate-800 bg-slate-950/95 p-6 shadow-xl shadow-slate-950/20">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Horários da semana</p>
                      <p className="mt-2 text-sm text-slate-500">Defina o período de cada dia com campos sofisticados.</p>
                    </div>
                    <button
                      type="button"
                      onClick={salvarHorarios}
                      className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:border-slate-600"
                    >
                      Atualizar agora
                    </button>
                  </div>

                  <div className="mt-6 space-y-4">
                    {dias.map((dia) => (
                      <div key={dia.nome} className="rounded-[24px] border border-slate-800 bg-slate-950 p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-base font-semibold text-white">{dia.nome}</p>
                            <p className="mt-1 text-sm text-slate-500">Defina abertura e fechamento.</p>
                          </div>
                          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
                            Ativo
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <label className="grid gap-2 text-sm text-slate-300">
                            <span>Abre às</span>
                            <input
                              type="time"
                              value={horarios[dia.inicio as keyof typeof horarios]}
                              onChange={(e) =>
                                setHorarios({
                                  ...horarios,
                                  [dia.inicio]: e.target.value,
                                })
                              }
                              className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
                            />
                          </label>
                          <label className="grid gap-2 text-sm text-slate-300">
                            <span>Fecha às</span>
                            <input
                              type="time"
                              value={horarios[dia.fim as keyof typeof horarios]}
                              onChange={(e) =>
                                setHorarios({
                                  ...horarios,
                                  [dia.fim]: e.target.value,
                                })
                              }
                              className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <aside className="space-y-6">
                <div className="rounded-[32px] border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Prévia do cliente</p>
                  <div className="mt-5 rounded-[28px] bg-gradient-to-br from-slate-900 to-slate-950 p-6 text-white shadow-inner shadow-slate-950/20">
                    <p className="text-sm text-slate-400">Como aparece no cardápio</p>
                    <div className="mt-4 space-y-3">
                      {resumo.map((item) => (
                        <div key={item.nome} className="flex items-center justify-between rounded-3xl border border-slate-800 bg-slate-900 px-4 py-4">
                          <div>
                            <p className="text-sm font-semibold text-white">{item.nome}</p>
                            <p className="mt-1 text-xs text-slate-500">{item.texto}</p>
                          </div>
                          <span className="text-sm font-semibold text-emerald-300">Visual</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-[32px] border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Resumo</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl bg-slate-900/80 p-4">
                      <p className="text-sm text-slate-400">Dia atual</p>
                      <p className="mt-2 text-xl font-semibold text-white">Segunda-feira</p>
                    </div>
                    <div className="rounded-3xl bg-slate-900/80 p-4">
                      <p className="text-sm text-slate-400">Próxima abertura</p>
                      <p className="mt-2 text-xl font-semibold text-white">Hoje às 12:00</p>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {toast ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed right-6 bottom-6 z-50 rounded-3xl border border-slate-800 bg-slate-950 px-6 py-4 text-white shadow-2xl shadow-slate-950/30"
          >
            <div className="flex items-center gap-3">
              <Check className="h-4 w-4 text-emerald-300" />
              Horários salvos com sucesso!
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  )
}
'''
path.write_text(content, encoding='utf-8')
