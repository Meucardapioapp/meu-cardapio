"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import Link from "next/link";
import { useRouter } from "next/navigation"

import {
  Plus,
  Trash2,
  Pencil,
  X,
  Upload,
  Save,
} from "lucide-react"
import { FaLastfmSquare } from "react-icons/fa"

type Extra = {
  id?: string
  nome: string
  preco: number
}

type Produto = {
  id: string
  nome: string
  descricao: string
  preco: number
  preco_antigo?: number
promocao?: boolean
  imagem: string
  destaque: string
  categoria: string
  restaurante_id: string

  ativo?: boolean
  estoque?: number

  adicionais?: Extra[]
}

export default function ProdutosPage() {

  const router = useRouter()
  const [produtos, setProdutos] = useState<Produto[]>([])

const [busca, setBusca] = useState("")
const [filtroCategoria, setFiltroCategoria] = useState("")
const [filtroStatus, setFiltroStatus] = useState("")

  const [loading, setLoading] = useState(false)

  const [editingId, setEditingId] =
    useState<string | null>(null)

  const [deleteModal, setDeleteModal] =
    useState<string | null>(null)

    const [produtoModal, setProdutoModal] =
  useState(false)

  const [nome, setNome] = useState("")
  const [descricao, setDescricao] =
    useState("")
  const [preco, setPreco] = useState("")
  const [precoAntigo, setPrecoAntigo] =
  useState("")

const [promocao, setPromocao] =
  useState(false)
  
  const [destaque, setDestaque] =
    useState("normal")
  const [categoria, setCategoria] =
    useState("")
    const [categorias, setCategorias] =
  useState<any[]>([])

  const [imagem, setImagem] =
    useState<File | null>(null)
const [previewImagem, setPreviewImagem] =
  useState("")

  const [extras, setExtras] = useState<
    Extra[]
  >([])

  const [extraNome, setExtraNome] =
    useState("")

  const [extraPreco, setExtraPreco] =
    useState("")

 useEffect(() => {
  fetchProdutos()
  buscarCategorias()
}, [])

  async function fetchProdutos() {

    const restauranteId =
      localStorage.getItem(
        "restaurante_id"
      )

    if (!restauranteId) {

      window.location.href = "/login"

      return
    }

    const { data } = await supabase
 
    .from("produtos")
.select("*")
.eq(
  "restaurante_id",
  restauranteId
)
.order("ordem", {
  ascending: true,
})

    if (!data) return

    const produtosComExtras =
      await Promise.all(

        data.map(async (produto) => {

          const {
            data: adicionais,
          } = await supabase
            .from("adicionais")
            .select("*")
            .eq(
              "produto_id",
              produto.id
            )

          return {
            ...produto,
            adicionais:
              adicionais || [],
          }
        })
      )

    setProdutos(
      produtosComExtras as Produto[]
    )
  }

  async function buscarCategorias() {

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
        ascending: true,
      })

  if (error) {

    console.log(error)

    return
  }

  setCategorias(data || [])
}

  function resetForm() {

    setNome("")
    setDescricao("")
    setPreco("")
    setPrecoAntigo("")
setPromocao(false)
    setImagem(null)
    setPreviewImagem("")
    setExtras([])
    setDestaque("normal")
    setCategoria("")
    setEditingId(null)
  }

  function fecharModal() {

  const confirmar =
    window.confirm(
      "Deseja fechar sem salvar?"
    )

  if (confirmar) {

    setProdutoModal(false)

  }

}

  function adicionarExtra() {

    if (
      !extraNome ||
      !extraPreco
    )
      return

    setExtras([
      ...extras,
      {
        nome: extraNome,
       preco: parseFloat(
  extraPreco.replace(",", ".")
)
      },
    ])

    setExtraNome("")
    setExtraPreco("")
  }

  async function uploadImagem(
    file: File
  ) {

    const fileName = `${Date.now()}-${file.name}`

    const { error } =
      await supabase.storage
        .from("products")
        .upload(fileName, file)

    if (error) {

      console.log(error)

      return null
    }

    const { data } =
      supabase.storage
        .from("products")
        .getPublicUrl(fileName)

    return data.publicUrl
  }

  async function criarProduto(): Promise<boolean> {

    try {

      setLoading(true)

      const restauranteId =
        localStorage.getItem(
          "restaurante_id"
        )

        if (!categoria) {

  toast.error(
    "Selecione uma categoria"
  )

  return false
}

      if (!restauranteId) {

        
toast.error("Restaurante não encontrado")

return false
      }

      let imageUrl = ""

      if (imagem) {

        const uploaded =
          await uploadImagem(
            imagem
          )

        if (!uploaded) {

          toast.error("Erro ao enviar imagem")

          return false
        }

        imageUrl = uploaded
      }

      const {
        data,
        error,
      } = await supabase
        .from("produtos")

.insert([
{
  nome,
  descricao,

  preco: parseFloat(
    preco.replace(",", ".")
  ),

  preco_antigo:
    precoAntigo
      ? parseFloat(
          precoAntigo.replace(",", ".")
        )
      : null,

  promocao,

  imagem: imageUrl,

  destaque,

  categoria,

  restaurante_id:
    restauranteId,
},
])

        .select()
        .single()

      if (error) {

        console.log(error)

        toast.error("Erro ao criar produto")

        return false
      }

      if (extras.length > 0) {

        const extrasInsert =
          extras.map((extra) => ({
            produto_id: data.id,
            nome: extra.nome,
            preco: extra.preco,
          }))

        await supabase
          .from("adicionais")
          .insert(extrasInsert)
      }

      await fetchProdutos()

      resetForm()

    toast.success("Produto criado com sucesso")

return true

} catch (error) {

  console.log(error)

  toast.error("Erro inesperado")

  return false

} finally {

  setLoading(false)

}
  }

  function editarProduto(
    produto: Produto
  ) {

    setEditingId(produto.id)

    setNome(produto.nome)

    setDescricao(
      produto.descricao
    )

    setPreco(
      String(produto.preco)
    )

    setPrecoAntigo(
  String(
    (produto as any).preco_antigo || ""
  )
)

setPromocao(
  (produto as any).promocao || false
)

    setDestaque(
      produto.destaque
    )

    setCategoria(
      produto.categoria || ""
    )

    setExtras(
      produto.adicionais || []
    )

    setImagem(null)

    setPreviewImagem(
  produto.imagem
)

    setProdutoModal(true)
  }

  async function salvarEdicao(): Promise<boolean> {

  if (!editingId) return false

  if (!categoria) {

  toast.error(
    "Selecione uma categoria"
  )

  return false
}

  try {

      setLoading(true)

      let imageUrl:
        | string
        | undefined =
        undefined

      if (
        imagem instanceof File
      ) {

        const uploaded =
          await uploadImagem(
            imagem
          )

        if (!uploaded) {

          toast.error("Erro ao enviar imagem")

          return false
        }

        imageUrl = uploaded
      }

      const updateData: any = {
      nome,
descricao,

preco: parseFloat(
  preco.replace(",", ".")
),

preco_antigo:
  precoAntigo
    ? parseFloat(
        precoAntigo.replace(",", ".")
      )
    : null,

promocao,

destaque,
categoria,
      }

      if (imageUrl) {

        updateData.imagem =
          imageUrl
      }

      const { error } =
        await supabase
          .from("produtos")
          .update(updateData)
          .eq("id", editingId)

      if (error) {

        console.log(error)

        toast.error("Erro ao editar produto")

        return false
      }

      await supabase
        .from("adicionais")
        .delete()
        .eq(
          "produto_id",
          editingId
        )

      if (extras.length > 0) {

        const extrasInsert =
          extras.map((extra) => ({
            produto_id:
              editingId,
            nome: extra.nome,
            preco: extra.preco,
          }))

        await supabase
          .from("adicionais")
          .insert(extrasInsert)
      }

      await fetchProdutos()

      resetForm()

     toast.success("Produto atualizado com sucesso")

return true

} catch (error) {

  console.log(error)

  toast.error("Erro inesperado")

  return false

} finally {

  setLoading(false)

}
  }

  async function toggleProduto(
  produto: Produto
) {

  const { error } =
    await supabase
      .from("produtos")
      .update({
        ativo: !produto.ativo
      })
      .eq("id", produto.id)

  if (error) {

    toast.error(
      "Erro ao atualizar produto"
    )

    return
  }

  toast.success(
    produto.ativo
      ? "Produto desativado"
      : "Produto ativado"
  )

  fetchProdutos()
}

  async function excluirProduto(
    
    id: string
  ) {

    try {

      await supabase
        .from("adicionais")
        .delete()
        .eq("produto_id", id)

      const { error } =
        await supabase
          .from("produtos")
          .delete()
          .eq("id", id)

      if (error) {

        console.log(error)

        toast.error("Erro ao excluir produto")

        return
      }

      setProdutos((prev) =>
        prev.filter(
          (item) =>
            item.id !== id
        )
      )

      setDeleteModal(null)
      toast.success("Produto excluído com sucesso")

    } catch (error) {

      console.log(error)
    }
  }

  async function sair() {

    await supabase.auth.signOut()

    localStorage.removeItem(
      "restaurante_id"
    )

    window.location.href =
      "/login"
  }

  const produtosFiltrados = produtos.filter((produto) => {

  const matchBusca =

  produto.nome
    .toLowerCase()
    .includes(busca.toLowerCase())

  ||

  produto.descricao
    .toLowerCase()
    .includes(busca.toLowerCase())

  ||

  produto.categoria
    .toLowerCase()
    .includes(busca.toLowerCase())

  const matchCategoria =
    !filtroCategoria ||
    produto.categoria === filtroCategoria

  const matchStatus =
    !filtroStatus ||
    (
      filtroStatus === "ativo"
        ? produto.ativo
        : !produto.ativo
    )

  return (
    matchBusca &&
    matchCategoria &&
    matchStatus
  )
})

  return (

  <main className="min-h-screen bg-[#F3F1F4] p-8">

  <div className="max-w-7xl mx-auto space-y-8">

  {/* HEADER */}

<div className="flex items-center justify-between">

  <div>
    <h1 className="text-5xl font-black text-[#1F1720]">
      Produtos
    </h1>

    <p className="text-zinc-500 mt-2 text-lg">
      Gerencie todos os produtos do seu cardápio
    </p>
  </div>

<Link
  href="/admin/produtos/novo-produto"
  className="
bg-gradient-to-r
from-[#7A1F3D]
to-[#542129]
text-white
px-6
py-4
rounded-2xl
font-bold
shadow-lg
hover:scale-105
active:scale-95
hover:shadow-2xl
transition-all
duration-300
inline-flex
items-center
justify-center
"
>
  + Novo Produto
</Link>

</div>

{/* MÉTRICAS */}

<div className="grid xl:grid-cols-4 md:grid-cols-2 gap-5">

  <div className="bg-white rounded-3xl p-6 border">
    <p className="text-zinc-500">
      Total Produtos
    </p>

    <h2 className="text-4xl font-black mt-3">
      {produtos.length}
    </h2>
  </div>

  <div className="bg-white rounded-3xl p-6 border">
    <p className="text-zinc-500">
      Produtos Ativos
    </p>

    <h2 className="text-4xl font-black mt-3">
      {
  produtos.filter(
    (p:any) =>
      p.ativo === true
  ).length
}
    </h2>
  </div>

  <div className="bg-white rounded-3xl p-6 border">
    <p className="text-zinc-500">
      Categorias
    </p>

    <h2 className="text-4xl font-black mt-3">
      {new Set(produtos.map((p:any) => p.categoria)).size}
    </h2>
  </div>

  <div className="bg-white rounded-3xl p-6 border">

  <p className="text-zinc-500">
  Produtos Inativos
</p>

<h2 className="text-4xl font-black mt-3">
{
  produtos.filter(
    (p) => p.ativo === false
  ).length
}
</h2>

</div>

</div>

{/* FILTROS */}

<div className="bg-white rounded-3xl border p-6">

  <div className="grid md:grid-cols-3 gap-4">

    <input
  value={busca}
  onChange={(e) =>
    setBusca(e.target.value)
  }
  placeholder="Buscar por nome, descrição ou categoria..."
      className="
      h-14
      px-4
      rounded-2xl
      border
      "
    />

    <select
  value={filtroCategoria}
  onChange={(e) =>
    setFiltroCategoria(
      e.target.value
    )
  }
  className="
  h-14
  px-4
  rounded-2xl
  border
  "
>

  <option value="">
    Todas Categorias
  </option>

  {[...new Set(
    produtos.map(
      (p) => p.categoria
    )
  )].map((categoria) => (

    <option
      key={categoria}
      value={categoria}
    >
      {categoria}
    </option>

  ))}

</select>

    <select
  value={filtroStatus}
  onChange={(e) =>
    setFiltroStatus(
      e.target.value
    )
  }
  className="
  h-14
  px-4
  rounded-2xl
  border
  "
>

  <option value="">
    Todos Status
  </option>

  <option value="ativo">
    Ativos
  </option>

  <option value="inativo">
    Inativos
  </option>

</select>

  </div>

</div>

<p className="
text-sm
text-zinc-500
mt-4
mb-4
">

  Mostrando

{" "}

{produtosFiltrados.length}

{" "}de{" "}

{produtos.length}

{" "}produtos

</p>

<div className="bg-white rounded-[30px] border border-zinc-200 overflow-hidden">

  <table className="w-full">

    <thead>

      <tr className="border-b border-zinc-200 bg-zinc-50">

        <th className="text-left p-5 text-zinc-500 font-medium">
          Produto
        </th>

        <th className="text-left p-5 text-zinc-500 font-medium">
          Categoria
        </th>

        <th className="text-left p-5 text-zinc-500 font-medium">
          Preço
        </th>

        <th className="text-left p-5 text-zinc-500 font-medium">
          Status
        </th>


        <th className="text-right p-5 text-zinc-500 font-medium">
          Ações
        </th>

      </tr>

    </thead>

    <tbody>

      {produtosFiltrados.length === 0 ? (

  <tr>

    <td
      colSpan={5}
      className="
      text-center
      py-20
      "
    >

      <div className="text-6xl">
        🍔
      </div>

      <h2 className="
      text-2xl
      font-bold
      mt-4
      ">
        Nenhum produto encontrado
      </h2>
      <p className="text-zinc-500 mt-2">
  Tente mudar os filtros ou criar um novo produto.
</p>

    </td>

  </tr>

) : (

  produtosFiltrados.map((produto) => (

       <tr
  key={produto.id}
  className={`
  border-b
  border-zinc-100
  hover:bg-zinc-50
  hover:shadow-md
  transition-all
  duration-300

  ${
    produto.ativo
      ? ""
      : "opacity-60 bg-red-50"
  }
  `}
>

          <td className="p-5">

            <div className="flex items-center gap-4">

              <img
                src={
  produto.imagem
    ? produto.imagem
    : "/sem-imagem.png"
}
                alt={produto.nome}
                className="
                w-16
                h-16
                rounded-2xl
                object-cover
                border
                "
              />

              <div>

          <p className="font-bold text-[#1F1720] text-lg">
  {produto.nome}
</p>

{produto.destaque === "destaque" && (

  <span
    className="
    inline-block
    mt-1
    mb-1
    bg-yellow-100
    text-yellow-700
    px-2
    py-1
    rounded-full
    text-xs
    font-semibold
    "
  >
    ⭐ Destaque
  </span>

)}

{produto.destaque === "promocao" && (

  <span
    className="
    inline-block
    mt-1
    mb-1
    bg-green-100
    text-green-700
    px-2
    py-1
    rounded-full
    text-xs
    font-semibold
    "
  >
    🔥 Promoção
  </span>

)}

<p className="text-sm text-zinc-500 line-clamp-2">
  {produto.descricao}
</p>

<p className="text-xs text-zinc-400 mt-1">

  {produto.adicionais?.length || 0}
  {" "}
  adicional(is)

</p>

              </div>

            </div>

          </td>

          <td className="p-5">

            <span
              className="
              px-3
              py-1
              rounded-full
              text-sm
              bg-purple-100
              text-purple-700
              "
            >
              {produto.categoria || "Sem categoria"}
            </span>

          </td>

         <td className="p-5">

  <div className="flex flex-col">

    {(produto as any).preco_antigo &&
     (produto as any).preco_antigo > produto.preco && (

      <span
        className="
          text-xs
          text-zinc-400
          line-through
        "
      >
        R$ {(produto as any)
          .preco_antigo
          .toFixed(2)
          .replace(".", ",")}
      </span>

    )}

    <span className="font-bold text-lg">
      R$ {produto.preco
        .toFixed(2)
        .replace(".", ",")}
    </span>

    {(produto as any).preco_antigo &&
     (produto as any).preco_antigo > produto.preco && (

      <span
        className="
          text-xs
          text-green-600
          font-bold
        "
      >
        {Math.round(
          (
            (
              (produto as any).preco_antigo -
              produto.preco
            ) /
            (produto as any).preco_antigo
          ) * 100
        )}
        % OFF
      </span>

    )}

  </div>

</td>

        <td className="p-5">

  <div className="flex items-center gap-3">

    <button
      onClick={() =>
        toggleProduto(produto)
      }
      className={`
      relative
      w-14
      h-7
      rounded-full
      hover:scale-105
      active:scale-95
      transition-all
      duration-300

      ${
        produto.ativo
          ? "bg-green-500"
          : "bg-red-500"
      }
      `}
    >

      <div
        className={`
        absolute
        top-1
        w-5
        h-5
        bg-white
        rounded-full
        transition-all

        ${
          produto.ativo
            ? "left-8"
            : "left-1"
        }
        `}
      />

    </button>

    <div className="flex items-center gap-2">

  <span
    className={`
    text-sm
    font-semibold

    ${
      produto.ativo
        ? "text-green-600"
        : "text-red-600"
    }
    `}
  >
    {produto.ativo
      ? "Ativo"
      : "Inativo"}
  </span>

  {!produto.ativo && (

    <span
      className="
      bg-red-100
      text-red-600
      px-2
      py-1
      rounded-full
      text-xs
      font-bold
      "
    >
      Oculto
    </span>

  )}

</div>

  </div>

</td>

         

          <td className="p-5">

            <div className="flex justify-end gap-2">

              <button
  onClick={() =>
    router.push(
      `/admin/produtos/novo-produto?id=${produto.id}`
    )
  }
                className="
                border
                border-zinc-200
                rounded-xl
                px-4
                py-2
               hover:bg-zinc-100
hover:scale-105
active:scale-95
transition-all
duration-200
                "
              >
                ✏️ Editar
              </button>

              <button
                onClick={() => {

  setDeleteModal(
    produto.id
  )

}}
                className="
                border
                border-red-200
                text-red-500
                rounded-xl
                px-4
                py-2
                hover:bg-red-50
hover:scale-105
active:scale-95
transition-all
duration-200
                "
              >
                🗑️ Excluir
              </button>

            </div>

          </td>

        </tr>

      ))
)}

    </tbody>

  </table>

</div>

    </div>

{deleteModal && (

  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

    <div className="bg-white rounded-3xl p-8 w-full max-w-md">

      <h2 className="text-2xl font-black">
        Excluir produto?
      </h2>

      <p className="text-zinc-500 mt-3">
        Essa ação não poderá ser desfeita.
      </p>

      <div className="flex justify-end gap-3 mt-8">

        <button
          onClick={() => setDeleteModal(null)}
          className="
          px-5
          py-3
          rounded-xl
          border
          "
        >
          Cancelar
        </button>

        <button
          onClick={() => excluirProduto(deleteModal)}
          className="
          px-5
          py-3
          rounded-xl
          bg-red-600
          text-white
          "
        >
          Excluir
        </button>

      </div>

    </div>

  </div>

)}

  </main>
)
}