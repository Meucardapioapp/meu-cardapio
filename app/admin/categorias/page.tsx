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
                ordem: categorias.length + 1
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
      p-8 lg:p-8
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
border-zinc-200
shadow-sm
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
border-zinc-200
shadow-sm
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
border-zinc-200
shadow-sm
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
                hover:shadow-lg
hover:-translate-y-[2px]

                active:scale-95
              "
            >
              {
                loading
                  ? "Salvando..."
                  : "Salvar Categoria"
              }
            </button>

            <div
  className="
    mt-8
    bg-[#F9F2F4]
    rounded-2xl
    p-6
    min-h-[120px]
    border
    border-[#F0DDE3]
  "
>

  <h3
    className="
      font-bold
      text-[#7A1F3D]
      mb-3
      text-lg
    "
  >
    💡 Dica
  </h3>

  <p
    className="
      text-sm
      text-zinc-600
      leading-6
    "
  >
    A categoria número 1 aparecerá
primeiro no cardápio do cliente.

Use as setas para reorganizar
a ordem das categorias.
  </p>

</div>

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
  Categorias ({categoriasFiltradas.length})
</h2>

              <div className="relative">

  <input
    value={busca}
    onChange={(e) =>
      setBusca(
        e.target.value
      )
    }
    placeholder="Buscar categoria..."
    className="
      border
      border-zinc-200
      rounded-2xl
      px-5
      py-3
      pr-12
      outline-none
    "
  />

  <span
    className="
      absolute
      right-4
      top-1/2
      -translate-y-1/2
      text-zinc-400
    "
  >
    🔍
  </span>

</div>
            </div>

            <div
  className="
    grid
    grid-cols-[1fr_120px_70px_70px]
    px-6
    mb-3
    text-sm
    font-semibold
    text-zinc-500
  "
>
  <span>Categoria</span>

  <span className="text-center">
    Ordem
  </span>

  <span className="text-center">
    Editar
  </span>

  <span className="text-center">
    Excluir
  </span>
</div>

            <div className="space-y-3">

              {categoriasFiltradas.map(
                (categoria) => (

                
<div
  key={categoria.id}
 className={`
  rounded-2xl
  px-6
  py-4
  grid
  grid-cols-[1fr_120px_70px_70px]
  items-center
  transition-all
  hover:shadow-lg
  hover:-translate-y-[2px]

  ${
    categoria.ordem === 1
      ? "border-2 border-[#7A1F3D] bg-[#FCF7F9]"
      : "border border-zinc-200 bg-white"
  }
`}
>
<div
  className="
    flex
    items-center
    gap-2
  "
>
<span className="text-zinc-300">
  ⋮⋮
</span>

  <h3
    className="
      font-bold
      text-lg
      text-[#1F1720]
    "
  >
    {categoria.nome}
  </h3>

</div>

<div
  className="
    flex
    items-center
    justify-center
    gap-2
  "
>

  <span
    className="
      text-[#7A1F3D]
      font-black
      text-lg
      min-w-[20px]
    "
  >
    #{categoria.ordem}
  </span>

  <button
    onClick={() =>
      moverCategoria(
        categoria.id,
        "up"
      )
    }
    className={`
  w-8
  h-8
  rounded-lg
  text-sm
  border

  ${
    categoria.ordem === 1
      ? "opacity-40 cursor-not-allowed"
      : "bg-white"
  }
`}
  >
    ⬆
  </button>

  <button
    onClick={() =>
      moverCategoria(
        categoria.id,
        "down"
      )
    }
    className={`
  w-8
  h-8
  rounded-lg
  text-sm
  border

  ${
    categoria.ordem === categorias.length
      ? "opacity-40 cursor-not-allowed"
      : "bg-white"
  }
`}
  >
    ⬇
  </button>

</div>

<div className="flex justify-center">

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
      w-10
      h-10
      rounded-xl
      border
      flex
      items-center
      justify-center
      hover:bg-yellow-50
    "
  >
    ✏️
  </button>

</div>

<div className="flex justify-center">

  <button
    onClick={() =>
      excluirCategoria(
        categoria.id
      )
    }
    className="
      w-10
      h-10
      rounded-xl
      border
      border-red-200
      text-red-500
      flex
      items-center
      justify-center
      hover:bg-red-50
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
              gap-4
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