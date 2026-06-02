"use client"

import {
  Copy,
  ExternalLink,
  Share2,
  QrCode,
  Eye,
  MousePointerClick,
  ShoppingBag,
} from "lucide-react"

export default function LinkCardapioPage() {
  const link =
    "https://meucardapioapp.com/seu-restaurante"

  async function copiarLink() {
    await navigator.clipboard.writeText(link)
    alert("Link copiado!")
  }

  function abrirCardapio() {
    window.open(link, "_blank")
  }

  function compartilharWhatsapp() {
    const mensagem = encodeURIComponent(
      `Confira nosso cardápio: ${link}`
    )

    window.open(
      `https://wa.me/?text=${mensagem}`,
      "_blank"
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* HEADER */}

      <div>
        <h1 className="text-5xl font-black mb-3">
          Link do Cardápio
        </h1>

        <p className="text-zinc-400 text-lg">
          Compartilhe seu cardápio e receba pedidos
          diretamente dos seus clientes.
        </p>
      </div>

      {/* CARD PRINCIPAL */}

      <div className="bg-gradient-to-br from-zinc-950 to-zinc-900 border border-zinc-800 rounded-3xl p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-green-500 flex items-center justify-center">
            <Share2
              className="text-black"
              size={24}
            />
          </div>

          <div>
            <h2 className="text-3xl font-bold">
              Seu Cardápio está Online
            </h2>

            <p className="text-zinc-400">
              Compartilhe o link abaixo e receba
              pedidos 24 horas por dia.
            </p>
          </div>
        </div>

        <div className="bg-black border border-zinc-800 rounded-2xl p-5 mb-6">
          <p className="text-green-400 text-lg font-medium break-all">
            {link}
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={copiarLink}
            className="bg-green-500 hover:bg-green-400 text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition"
          >
            <Copy size={18} />
            Copiar Link
          </button>

          <button
            onClick={abrirCardapio}
            className="bg-zinc-900 border border-zinc-700 hover:border-zinc-600 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition"
          >
            <ExternalLink size={18} />
            Abrir Cardápio
          </button>

          <button
            onClick={compartilharWhatsapp}
            className="bg-zinc-900 border border-zinc-700 hover:border-zinc-600 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition"
          >
            <Share2 size={18} />
            Compartilhar WhatsApp
          </button>
        </div>
      </div>

      {/* KPIs */}

      <div className="grid md:grid-cols-3 gap-5">
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Eye className="text-green-400" />
          </div>

          <h3 className="text-4xl font-black">
            0
          </h3>

          <p className="text-zinc-400 mt-2">
            Visualizações do Cardápio
          </p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <MousePointerClick className="text-green-400" />
          </div>

          <h3 className="text-4xl font-black">
            0
          </h3>

          <p className="text-zinc-400 mt-2">
            Cliques no WhatsApp
          </p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <ShoppingBag className="text-green-400" />
          </div>

          <h3 className="text-4xl font-black">
            0
          </h3>

          <p className="text-zinc-400 mt-2">
            Pedidos Recebidos
          </p>
        </div>
      </div>

      {/* QR CODE + PREVIEW */}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <QrCode className="text-green-400" />

            <h3 className="text-2xl font-bold">
              QR Code
            </h3>
          </div>

          <div className="h-72 bg-black border border-dashed border-zinc-700 rounded-2xl flex items-center justify-center mb-6">
            <p className="text-zinc-500">
              QR Code disponível em breve
            </p>
          </div>

          <button className="w-full bg-zinc-900 border border-zinc-700 py-3 rounded-xl font-semibold hover:border-zinc-500 transition">
            Baixar QR Code
          </button>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
          <h3 className="text-2xl font-bold mb-6">
            Preview do Cardápio
          </h3>

          <div className="bg-black rounded-2xl border border-zinc-800 overflow-hidden">
            <div className="h-32 bg-zinc-800"></div>

            <div className="p-5">
              <div className="w-16 h-16 rounded-full bg-green-500 mb-4"></div>

              <h4 className="text-xl font-bold">
                Meu Restaurante
              </h4>

              <p className="text-zinc-500 mb-5">
                Seu cardápio digital
              </p>

              <div className="space-y-3">
                <div className="bg-zinc-900 rounded-lg h-12"></div>
                <div className="bg-zinc-900 rounded-lg h-12"></div>
                <div className="bg-zinc-900 rounded-lg h-12"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COMPARTILHAMENTO */}

      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
        <h3 className="text-2xl font-bold mb-6">
          Compartilhamento Rápido
        </h3>

        <div className="grid md:grid-cols-3 gap-4">
          <button className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-5 rounded-2xl font-semibold transition">
            WhatsApp
          </button>

          <button className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-5 rounded-2xl font-semibold transition">
            Instagram
          </button>

          <button className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-5 rounded-2xl font-semibold transition">
            Facebook
          </button>
        </div>
      </div>
    </div>
  )
}