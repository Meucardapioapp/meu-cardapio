"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Categoria = {
  id: string
  nome: string
  restaurante_id: string
  created_at: string
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
        .order("nome", {
          ascending: true
        })

    if (error) {

      console.log(error)

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
            },
          ])

      if (error) {

        console.log(error)

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

  return (

    <main className="
      min-h-screen
      bg-[#F3F1F4]
      p-8
    ">

      <div className="
        max-w-7xl
        mx-auto
      ">

        <div className="mb-8">

          <h1 className="
            text-4xl
            font-black
            text-[#1F1720]
          ">
            Categorias
          </h1>

          <p className="
            text-zinc-500
            mt-2
          ">
            Gerencie as categorias do seu cardápio
          </p>

        </div>

        <div className="
          grid
          md:grid-cols-3
          gap-4
          mb-8
        ">

          <div className="
            bg-white
            rounded-3xl
            p-6
            border
          ">
            <p className="text-zinc-500">
              Total Categorias
            </p>

            <h2 className="
              text-4xl
              font-black
              mt-2
            ">
              {categorias.length}
            </h2>
          </div>

          <div className="
            bg-white
            rounded-3xl
            p-6
            border
          ">
            <p className="text-zinc-500">
              Encontradas
            </p>

            <h2 className="
              text-4xl
              font-black
              mt-2
            ">
              {
                categoriasFiltradas.length
              }
            </h2>
          </div>

          <div className="
            bg-white
            rounded-3xl
            p-6
            border
          ">
            <p className="text-zinc-500">
              Última Categoria
            </p>

            <h2 className="
              text-xl
              font-black
              mt-2
            ">
              {
                categorias.length > 0
                  ? categorias[
                      categorias.length - 1
                    ].nome
                  : "-"
              }
            </h2>
          </div>

        </div>

        <div className="
          grid
          lg:grid-cols-3
          gap-6
        ">

          <div className="
            bg-white
            rounded-3xl
            border
            p-6
          ">

            <h2 className="
              text-2xl
              font-bold
              mb-5
            ">
              Nova Categoria
            </h2>

            <input
              value={nome}
              onChange={(e) =>
                setNome(
                  e.target.value
                )
              }
              placeholder="
Digite o nome da categoria"
              className="
                w-full
                border
                rounded-2xl
                p-4
              "
            />

            <button
              onClick={
                salvarCategoria
              }
              disabled={loading}
              className="
                mt-4
                w-full
                bg-gradient-to-r
                from-[#7A1F3D]
                to-[#542129]
                text-white
                py-4
                rounded-2xl
                font-bold

                transition-all
                duration-200

                hover:scale-[1.02]
                hover:shadow-xl

                active:scale-95
              "
            >
              {
                loading
                  ? "Salvando..."
                  : "Salvar Categoria"
              }
            </button>

          </div>

          <div className="
            lg:col-span-2
            bg-white
            rounded-3xl
            border
            p-6
          ">

            <div className="
              flex
              justify-between
              items-center
              mb-6
            ">

              <h2 className="
                text-2xl
                font-bold
              ">
                Categorias
              </h2>

              <input
                value={busca}
                onChange={(e) =>
                  setBusca(
                    e.target.value
                  )
                }
                placeholder="
Buscar categoria..."
                className="
                  border
                  rounded-xl
                  px-4
                  py-3
                "
              />

            </div>

            <div className="space-y-3">

              {categoriasFiltradas.map(
                (categoria) => (

                  <div
                    key={categoria.id}
                    className="
                      border
                      rounded-2xl
                      p-5
                      flex
                      justify-between
                      items-center
                    "
                  >

                    <h3 className="
                      font-bold
                      text-lg
                    ">
                      {categoria.nome}
                    </h3>

                    <div className="
                      flex
                      gap-2
                    ">

                      <button
                        onClick={() => {

                          setCategoriaEditando(
                            categoria
                          )

                          setNovoNome(
                            categoria.nome
                          )

                        }}
                        className="
                          border
                          px-4
                          py-2
                          rounded-xl

                          transition-all
                          duration-200

                          hover:bg-yellow-50
                          hover:scale-110

                          active:scale-95
                        "
                      >
                        ✏️
                      </button>

                      <button
                        onClick={() =>
                          excluirCategoria(
                            categoria.id
                          )
                        }
                        className="
                          border
                          border-red-300
                          text-red-500
                          px-4
                          py-2
                          rounded-xl

                          transition-all
                          duration-200

                          hover:bg-red-50
                          hover:scale-110

                          active:scale-95
                        "
                      >
                        🗑️
                      </button>

                    </div>

                  </div>

                )
              )}

            </div>

          </div>

        </div>

      </div>

      {categoriaEditando && (

        <div className="
          fixed
          inset-0
          bg-black/50
          flex
          items-center
          justify-center
          z-50
        ">

          <div className="
            bg-white
            rounded-3xl
            p-8
            w-full
            max-w-md
          ">

            <h2 className="
              text-2xl
              font-bold
              mb-4
            ">
              Editar Categoria
            </h2>

            <input
              value={novoNome}
              onChange={(e) =>
                setNovoNome(
                  e.target.value
                )
              }
              className="
                w-full
                border
                rounded-2xl
                p-4
              "
            />

            <div className="
              flex
              justify-end
              gap-3
              mt-6
            ">

              <button
                onClick={() =>
                  setCategoriaEditando(
                    null
                  )
                }
                className="
                  px-4
                  py-2
                  border
                  rounded-xl
                "
              >
                Cancelar
              </button>

              <button
                onClick={salvarEdicao}
                className="
                  px-4
                  py-2
                  bg-[#7A1F3D]
                  text-white
                  rounded-xl
                "
              >
                Salvar
              </button>

            </div>

          </div>

        </div>

      )}

    </main>
  )
}