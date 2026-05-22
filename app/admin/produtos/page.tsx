"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/utils/supabase/client"
import {
  Plus,
  Trash2,
  Pencil,
  X,
  Upload,
  Save,
} from "lucide-react"

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
  imagem: string
  destaque: string
  adicionais?: Extra[]
}

export default function ProdutosPage() {

  const [produtos, setProdutos] = useState<Produto[]>([])

  const [loading, setLoading] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)

  const [deleteModal, setDeleteModal] = useState<string | null>(null)

  const [nome, setNome] = useState("")
  const [descricao, setDescricao] = useState("")
  const [preco, setPreco] = useState("")
  const [destaque, setDestaque] = useState("normal")

  const [imagem, setImagem] = useState<File | null>(null)

  const [extras, setExtras] = useState<Extra[]>([])

  const [extraNome, setExtraNome] = useState("")
  const [extraPreco, setExtraPreco] = useState("")

  useEffect(() => {
    fetchProdutos()
  }, [])

  async function fetchProdutos() {

    const { data } = await supabase
      .from("produtos")
      .select("*")
      .order("created_at", { ascending: false })

    if (!data) return

    const produtosComExtras = await Promise.all(

      data.map(async (produto) => {

        const { data: adicionais } = await supabase
          .from("adicionais")
          .select("*")
          .eq("produto_id", produto.id)

        return {
          ...produto,
          adicionais: adicionais || [],
        }
      })
    )

    setProdutos(produtosComExtras as Produto[])
  }

  function resetForm() {

    setNome("")
    setDescricao("")
    setPreco("")
    setImagem(null)
    setExtras([])
    setDestaque("normal")
    setEditingId(null)
  }

  function adicionarExtra() {

    if (!extraNome || !extraPreco) return

    setExtras([
      ...extras,
      {
        nome: extraNome,
        preco: Number(extraPreco),
      },
    ])

    setExtraNome("")
    setExtraPreco("")
  }

  async function uploadImagem(file: File) {

    const fileName = `${Date.now()}-${file.name}`

    const { error } = await supabase.storage
      .from("products")
      .upload(fileName, file)

    if (error) {

      console.log(error)

      return null
    }

    const { data } = supabase.storage
      .from("products")
      .getPublicUrl(fileName)

    return data.publicUrl
  }

  async function criarProduto() {

    try {

      setLoading(true)

      let imageUrl = ""

      if (imagem) {

        const uploaded = await uploadImagem(imagem)

        if (!uploaded) {

          alert("Erro upload")

          return
        }

        imageUrl = uploaded
      }

      const { data, error } = await supabase
        .from("produtos")
        .insert([
          {
            nome,
            descricao,
            preco: Number(preco),
            imagem: imageUrl,
            destaque,
          },
        ])
        .select()
        .single()

      if (error) {

        console.log(error)

        alert("Erro ao criar produto")

        return
      }

      if (extras.length > 0) {

        const extrasInsert = extras.map((extra) => ({
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

      alert("Produto criado")

    } catch (error) {

      console.log(error)

    } finally {

      setLoading(false)
    }
  }

  function editarProduto(produto: Produto) {

    setEditingId(produto.id)

    setNome(produto.nome)
    setDescricao(produto.descricao)
    setPreco(String(produto.preco))
    setDestaque(produto.destaque)

    setExtras(produto.adicionais || [])
  }

  async function salvarEdicao() {

    if (!editingId) return

    try {

      setLoading(true)

      let imageUrl: string | undefined = undefined

      if (imagem instanceof File) {

        const uploaded = await uploadImagem(imagem)

        if (!uploaded) {

          alert("Erro upload")

          return
        }

        imageUrl = uploaded
      }

      const updateData: any = {
        nome,
        descricao,
        preco: Number(preco),
        destaque,
      }

      if (imageUrl) {
        updateData.imagem = imageUrl
      }

      const { error } = await supabase
        .from("produtos")
        .update(updateData)
        .eq("id", editingId)

      if (error) {

        console.log(error)

        alert("Erro edição")

        return
      }

      await supabase
        .from("adicionais")
        .delete()
        .eq("produto_id", editingId)

      if (extras.length > 0) {

        const extrasInsert = extras.map((extra) => ({
          produto_id: editingId,
          nome: extra.nome,
          preco: extra.preco,
        }))

        await supabase
          .from("adicionais")
          .insert(extrasInsert)
      }

      await fetchProdutos()

      resetForm()

      alert("Produto atualizado")

    } catch (error) {

      console.log(error)

    } finally {

      setLoading(false)
    }
  }

  async function excluirProduto(id: string) {

    try {

      await supabase
        .from("adicionais")
        .delete()
        .eq("produto_id", id)

      const { error } = await supabase
        .from("produtos")
        .delete()
        .eq("id", id)

      if (error) {

        console.log(error)

        alert("Erro excluir")

        return
      }

      setProdutos((prev) =>
        prev.filter((item) => item.id !== id)
      )

      setDeleteModal(null)

    } catch (error) {

      console.log(error)
    }
  }

  return (

    <main className="min-h-screen bg-black text-white p-6">

      <div className="max-w-5xl mx-auto">

        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 mb-8">

          <div className="flex items-center gap-3 mb-6">

            <Plus className="text-green-400" />

            <div>
              <h1 className="text-3xl font-bold">
                {editingId ? "Editar Produto" : "Novo Produto"}
              </h1>

              <p className="text-zinc-400">
                Sistema profissional SaaS
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">

            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do produto"
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
            />

            <input
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              placeholder="Preço"
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
            />

            <label className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3 cursor-pointer">

              <Upload size={18} />

              <span>
                Selecionar imagem
              </span>

              <input
                type="file"
                hidden
                onChange={(e) =>
                  setImagem(
                    e.target.files?.[0] || null
                  )
                }
              />
            </label>

            <select
              value={destaque}
              onChange={(e) => setDestaque(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
            >
              <option value="normal">Normal</option>
              <option value="destaque">Destaque</option>
              <option value="promocao">Promoção</option>
              <option value="mais vendido">Mais vendido</option>
            </select>
          </div>

          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição"
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 w-full h-32 mb-6"
          />

          <div className="bg-zinc-900 rounded-2xl p-4 mb-6">

            <h2 className="text-2xl font-bold mb-4">
              Adicionais
            </h2>

            <div className="grid md:grid-cols-3 gap-4">

              <input
                value={extraNome}
                onChange={(e) =>
                  setExtraNome(e.target.value)
                }
                placeholder="Nome do adicional"
                className="bg-black border border-zinc-800 rounded-xl p-4"
              />

              <input
                value={extraPreco}
                onChange={(e) =>
                  setExtraPreco(e.target.value)
                }
                placeholder="Preço"
                className="bg-black border border-zinc-800 rounded-xl p-4"
              />

              <button
                onClick={adicionarExtra}
                className="bg-green-500 hover:bg-green-400 transition rounded-xl font-bold"
              >
                Adicionar Extra
              </button>
            </div>

            <div className="flex flex-wrap gap-3 mt-4">

              {extras.map((extra, index) => (

                <div
                  key={index}
                  className="bg-black border border-zinc-800 rounded-xl px-4 py-2 flex items-center gap-2"
                >
                  <span>
                    {extra.nome}
                  </span>

                  <span className="text-green-400">
                    R$ {extra.preco}
                  </span>

                  <button
                    onClick={() =>
                      setExtras(
                        extras.filter((_, i) => i !== index)
                      )
                    }
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {editingId ? (

            <div className="flex gap-4">

              <button
                onClick={salvarEdicao}
                disabled={loading}
                className="bg-green-500 hover:bg-green-400 transition px-8 py-4 rounded-2xl font-bold flex items-center gap-2"
              >
                <Save size={18} />
                Salvar
              </button>

              <button
                onClick={resetForm}
                className="bg-zinc-800 px-8 py-4 rounded-2xl font-bold"
              >
                Cancelar
              </button>
            </div>

          ) : (

            <button
              onClick={criarProduto}
              disabled={loading}
              className="bg-green-500 hover:bg-green-400 transition px-8 py-4 rounded-2xl font-bold"
            >
              Criar Produto
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">

          {produtos.map((produto) => (

            <div
              key={produto.id}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden"
            >
              <div className="h-72 bg-zinc-900">

                {produto.imagem ? (

                  <img
                    src={produto.imagem}
                    className="w-full h-full object-cover"
                  />

                ) : (

                  <div className="w-full h-full flex items-center justify-center text-6xl text-zinc-500">
                    Produto
                  </div>
                )}
              </div>

              <div className="p-4">

                <div className="flex justify-between mb-2">

                  <h2 className="text-3xl font-bold">
                    {produto.nome}
                  </h2>

                  <span className="text-green-400 text-2xl font-bold">
                    R$ {produto.preco}
                  </span>
                </div>

                <p className="text-zinc-400 mb-4">
                  {produto.descricao}
                </p>

                <div className="space-y-2 mb-4">

                  {produto.adicionais?.map((extra, index) => (

                    <div
                      key={index}
                      className="bg-black border border-zinc-800 rounded-xl px-3 py-2 flex justify-between"
                    >
                      <span>
                        + {extra.nome}
                      </span>

                      <span className="text-green-400">
                        R$ {extra.preco}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">

                  <button
                    onClick={() =>
                      editarProduto(produto)
                    }
                    className="flex-1 bg-yellow-500 hover:bg-yellow-400 transition rounded-xl py-3 font-bold flex items-center justify-center gap-2"
                  >
                    <Pencil size={16} />
                    Editar
                  </button>

                  <button
                    onClick={() =>
                      setDeleteModal(produto.id)
                    }
                    className="flex-1 bg-red-500 hover:bg-red-400 transition rounded-xl py-3 font-bold flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    Excluir
                  </button>
                </div>
              </div>

              {deleteModal === produto.id && (

                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">

                  <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 w-full max-w-md">

                    <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">

                      <Trash2
                        size={40}
                        className="text-red-500"
                      />
                    </div>

                    <h2 className="text-3xl font-bold text-center mb-4">
                      Excluir Produto
                    </h2>

                    <p className="text-zinc-400 text-center mb-8">
                      Essa ação não poderá ser desfeita.
                    </p>

                    <div className="flex gap-4">

                      <button
                        onClick={() =>
                          setDeleteModal(null)
                        }
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 transition rounded-2xl py-4 font-bold"
                      >
                        Cancelar
                      </button>

                      <button
                        onClick={() =>
                          excluirProduto(produto.id)
                        }
                        className="flex-1 bg-red-500 hover:bg-red-400 transition rounded-2xl py-4 font-bold"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
