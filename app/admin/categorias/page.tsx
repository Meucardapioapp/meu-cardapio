"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Categoria = {
  id: string
  nome: string
  restaurante_id: string
  created_at: string
  ordem: number
}

export default function CategoriasPage() {

  const [nome, setNome] = useState("")
  const [busca, setBusca] = useState("")
  const [loading, setLoading] = useState(false)

  const [categorias, setCategorias] =
    useState<Categoria[]>([])

  const [categoriaEditando, setCategoriaEditando] =
    useState<Categoria | null>(null)

  const [novoNome, setNovoNome] =
    useState("")

  useEffect(() => {
    fetchCategorias()
  }, [])

async function moverCategoria(
  id: string,
  direcao: "up" | "down"
) {

  const index =
    categorias.findIndex(
      (c) => c.id === id
    )

  if (index === -1)
    return

  const novoIndex =
    direcao === "up"
      ? index - 1
      : index + 1

  if (
    novoIndex < 0 ||
    novoIndex >= categorias.length
  ) {
    return
  }

  const atual =
    categorias[index]

  const alvo =
    categorias[novoIndex]

  await supabase
    .from("categorias")
    .update({
      ordem: alvo.ordem
    })
    .eq("id", atual.id)

  await supabase
    .from("categorias")
    .update({
      ordem: atual.ordem
    })
    .eq("id", alvo.id)

  fetchCategorias()
}

  async function fetchCategorias() {

    const restauranteId =
      localStorage.getItem(
        "restaurante_id"
      )

    if (!restauranteId)
      return

    const { data, error } =
      await supabase
        .from("categorias")
        .select("*")
        .eq(
          "restaurante_id",
          restauranteId
        )
        .order("ordem", {
  ascending: true
})

    if (error) {

      return
    }

    setCategorias(data || [])
  }

  async function salvarCategoria() {

    if (!nome.trim()) {

      alert(
        "Digite o nome da categoria"
      )

      return
    }

    const restauranteId =
      localStorage.getItem(
        "restaurante_id"
      )

    if (!restauranteId) {

      alert(
        "Restaurante não encontrado"
      )

      return
    }

    try {

      setLoading(true)

      const { error } =
        await supabase
          .from("categorias")
          .insert([
            {
              nome,
              restaurante_id:
                restauranteId,
                ordem: categorias.length + 1
            },
          ])

      if (error) {

        alert(
          "Erro ao salvar categoria"
        )

        return
      }

      setNome("")

      await fetchCategorias()

    } finally {

      setLoading(false)

    }
  }

  async function salvarEdicao() {

    if (!categoriaEditando)
      return

    const { error } =
      await supabase
        .from("categorias")
        .update({
          nome: novoNome
        })
        .eq(
          "id",
          categoriaEditando.id
        )

    if (error) {

      alert(
        "Erro ao editar categoria"
      )

      return
    }

    // Os produtos guardam o nome da categoria: leva junto para não sumirem do cardápio.
    const nomeAntigo = categoriaEditando.nome
    if (novoNome.trim() && novoNome !== nomeAntigo) {
      await supabase
        .from("produtos")
        .update({ categoria: novoNome })
        .eq("restaurante_id", categoriaEditando.restaurante_id)
        .eq("categoria", nomeAntigo)
    }

    setCategoriaEditando(null)

    setNovoNome("")

    fetchCategorias()
  }

  async function excluirCategoria(
    id: string
  ) {

    const confirmar =
      window.confirm(
        "Deseja realmente excluir esta categoria?"
      )

    if (!confirmar)
      return

    const { error } =
      await supabase
        .from("categorias")
        .delete()
        .eq("id", id)

    if (error) {

      alert(
        "Erro ao excluir categoria"
      )

      return
    }

    fetchCategorias()
  }

  const categoriasFiltradas =
    categorias.filter(
      (categoria) =>
        categoria.nome
          .toLowerCase()
          .includes(
            busca.toLowerCase()
          )
    )

  const ultima = categorias[categorias.length - 1]?.nome || "—"

  return (
    <main className="min-h-screen bg-[#F8F6F4] px-1 py-4 sm:px-4 md:px-8 md:py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-zinc-900 md:text-3xl">Categorias</h1>
          <p className="mt-1 text-sm text-zinc-500">Organize as seções do seu cardápio. A primeira da lista aparece primeiro para o cliente.</p>
        </div>

        {/* Resumo */}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium text-zinc-500">Categorias</p>
            <p className="mt-1 text-2xl font-black text-zinc-900">{categorias.length}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium text-zinc-500">Encontradas</p>
            <p className="mt-1 text-2xl font-black text-zinc-900">{categoriasFiltradas.length}</p>
          </div>
          <div className="col-span-2 rounded-2xl border border-zinc-200 bg-white p-4 md:col-span-1">
            <p className="text-xs font-medium text-zinc-500">Última categoria</p>
            <p className="mt-1 truncate text-lg font-black uppercase text-zinc-900">{ultima}</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          {/* Nova categoria */}
          <div className="h-fit rounded-3xl border border-zinc-200 bg-white p-5">
            <h2 className="text-lg font-bold text-zinc-900">Nova categoria</h2>
            <form
              className="mt-3 flex flex-col gap-2 sm:flex-row lg:flex-col"
              onSubmit={(e) => {
                e.preventDefault()
                salvarCategoria()
              }}
            >
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: Pizzas, Bebidas..."
                className="h-12 min-w-0 flex-1 rounded-2xl border border-zinc-200 px-4 text-base outline-none focus:border-[#6D1F2F]"
              />
              <button
                type="submit"
                disabled={loading}
                className="h-12 shrink-0 rounded-2xl bg-[#6D1F2F] px-5 font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? "Salvando..." : "Adicionar"}
              </button>
            </form>
            <p className="mt-4 rounded-2xl bg-[#6D1F2F]/5 p-3 text-xs leading-5 text-zinc-600">
              💡 Use as setas para mudar a ordem. A categoria nº 1 é a primeira que o cliente vê no cardápio.
            </p>
          </div>

          {/* Lista */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-3 sm:p-4 md:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold text-zinc-900">Suas categorias ({categorias.length})</h2>
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar categoria..."
                className="h-11 w-full rounded-2xl border border-zinc-200 px-4 text-base outline-none focus:border-[#6D1F2F] sm:w-56"
              />
            </div>

            <div className="mt-4 space-y-2">
              {categoriasFiltradas.length === 0 && (
                <p className="py-10 text-center text-sm text-zinc-500">
                  {categorias.length ? "Nenhuma categoria encontrada." : "Nenhuma categoria ainda. Crie a primeira ao lado."}
                </p>
              )}

              {categoriasFiltradas.map((categoria) => {
                const posicao = categorias.findIndex((c) => c.id === categoria.id)
                const primeira = posicao === 0
                const ultimaPos = posicao === categorias.length - 1
                return (
                  <div
                    key={categoria.id}
                    className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border p-3 ${primeira ? "border-[#6D1F2F]/40 bg-[#6D1F2F]/[0.03]" : "border-zinc-200"}`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600">
                      {posicao + 1}
                    </span>
                    <p className="min-w-0 flex-1 break-words text-[15px] font-semibold uppercase leading-tight text-zinc-900">
                      {categoria.nome}
                    </p>
                    <div className="flex w-full items-center justify-end gap-1 border-t border-zinc-100 pt-2 sm:w-auto sm:border-0 sm:pt-0">
                      <button
                        type="button"
                        aria-label="Subir"
                        disabled={primeira || !!busca}
                        onClick={() => moverCategoria(categoria.id, "up")}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-600 hover:bg-zinc-100 disabled:opacity-25"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label="Descer"
                        disabled={ultimaPos || !!busca}
                        onClick={() => moverCategoria(categoria.id, "down")}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-600 hover:bg-zinc-100 disabled:opacity-25"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        aria-label="Editar"
                        onClick={() => {
                          setCategoriaEditando(categoria)
                          setNovoNome(categoria.nome)
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-zinc-100"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        aria-label="Excluir"
                        onClick={() => excluirCategoria(categoria.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-red-50"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {categoriaEditando && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={() => setCategoriaEditando(null)}>
          <div className="w-full max-w-md rounded-t-3xl bg-white p-6 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold">Editar categoria</h2>
            <input
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              autoFocus
              className="mt-4 h-12 w-full rounded-2xl border border-zinc-200 px-4 text-base outline-none focus:border-[#6D1F2F]"
            />
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setCategoriaEditando(null)} className="h-12 rounded-2xl border font-semibold">
                Cancelar
              </button>
              <button type="button" onClick={salvarEdicao} className="h-12 rounded-2xl bg-[#6D1F2F] font-bold text-white">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
