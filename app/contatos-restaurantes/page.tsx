"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ExternalLink, MessageCircle, Search, ShieldCheck } from "lucide-react"
import { supabase } from "@/lib/supabase"

type Restaurante = {
  id: string
  nome_restaurante: string | null
  whatsapp: string | null
  slug: string | null
}

export default function ContatosRestaurantesPage() {
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([])
  const [busca, setBusca] = useState("")
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState("")

  useEffect(() => {
    async function carregarRestaurantes() {
      try {
        setLoading(true)
        setErro("")

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.access_token) {
          setErro("Você precisa estar logado.")
          return
        }

        const response = await fetch("/api/contatos-restaurantes", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        })

        const resultado = await response.json()

        if (!response.ok) {
          setErro(resultado.error || "Não foi possível carregar os restaurantes.")
          return
        }

        setRestaurantes(resultado.restaurantes || [])
      } catch (error) {
        console.error(error)
        setErro("Erro ao carregar os restaurantes.")
      } finally {
        setLoading(false)
      }
    }

    carregarRestaurantes()
  }, [])

  const restaurantesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    if (!termo) {
      return restaurantes
    }

    return restaurantes.filter((restaurante) =>
      (restaurante.nome_restaurante || "").toLowerCase().includes(termo)
    )
  }, [busca, restaurantes])

function gerarLinkWhatsApp(numero: string | null) {
  if (!numero) return null

  let telefone = numero.replace(/\D/g, "")

  if (!telefone) return null

  if (!telefone.startsWith("55")) {
    telefone = `55${telefone}`
  }

  const mensagem = `Olá, tudo bem? Me chamo Victor e sou seu assessor no seu cardápio digital do MeuCardapioApp.

Percebi que você criou sua conta conosco, porém ainda não começou a utilizar seu cardápio. Queria entender se aconteceu alguma coisa ou se existe algo em que eu possa te ajudar.

Estou à disposição para te auxiliar a deixar tudo pronto e agilizar suas vendas pelo cardápio digital. 😊
`

  return `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`
}
  function gerarLinkCardapio(slug: string | null) {
    if (!slug) return null

    return `https://meucardapioapp.com/${slug}`
  }

  return (
    <main className="min-h-screen bg-[#F8F6F4] px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-start justify-between gap-6">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#6D1F2F]" />
              <span className="text-sm font-medium text-[#6D1F2F]">
                Área privada
              </span>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-[#24181B]">
              Contatos dos restaurantes
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Acesse rapidamente o WhatsApp e o cardápio de cada restaurante.
            </p>
          </div>

          <div className="rounded-xl border border-[#ECE7E3] bg-white px-5 py-3">
            <p className="text-xs text-gray-500">Restaurantes</p>
            <p className="text-2xl font-semibold text-[#6D1F2F]">
              {restaurantes.length}
            </p>
          </div>
        </div>

        <div className="mb-5 rounded-2xl border border-[#ECE7E3] bg-white p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar restaurante..."
              className="h-11 w-full rounded-xl border border-[#ECE7E3] bg-[#FCFBFA] pl-10 pr-4 text-sm outline-none transition focus:border-[#6D1F2F]"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#ECE7E3] bg-white">
          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <p className="text-sm text-gray-500">
                Carregando restaurantes...
              </p>
            </div>
          ) : erro ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
              <ShieldCheck className="mb-3 h-8 w-8 text-[#6D1F2F]" />

              <p className="font-medium text-gray-900">
                {erro}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Essa área é exclusiva da conta administrativa.
              </p>
            </div>
          ) : restaurantesFiltrados.length === 0 ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <p className="text-sm text-gray-500">
                Nenhum restaurante encontrado.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#ECE7E3]">
              {restaurantesFiltrados.map((restaurante) => {
               const whatsappUrl = gerarLinkWhatsApp(restaurante.whatsapp)
                const cardapioUrl = gerarLinkCardapio(restaurante.slug)

                return (
                  <div
                    key={restaurante.id}
                    className="flex flex-col gap-5 px-6 py-5 transition hover:bg-[#FCFBFA] md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold text-[#24181B]">
                        {restaurante.nome_restaurante || "Restaurante sem nome"}
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        {restaurante.whatsapp || "WhatsApp não informado"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {whatsappUrl ? (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#168C4A] px-4 text-sm font-medium text-white transition hover:opacity-90"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Falar no WhatsApp
                        </a>
                      ) : (
                        <span className="inline-flex h-10 items-center rounded-xl bg-gray-100 px-4 text-sm text-gray-400">
                          WhatsApp não informado
                        </span>
                      )}

                      {cardapioUrl ? (
                        <a
                          href={cardapioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#ECE7E3] bg-white px-4 text-sm font-medium text-[#6D1F2F] transition hover:bg-[#F8F6F4]"
                        >
                          Abrir cardápio
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : (
                        <span className="inline-flex h-10 items-center rounded-xl bg-gray-100 px-4 text-sm text-gray-400">
                          Cardápio indisponível
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Área administrativa privada • Somente o proprietário autorizado pode acessar.
        </p>
      </div>
    </main>
  )
}