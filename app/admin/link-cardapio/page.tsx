"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

import QRCode from "react-qr-code"

import {
  Copy,
  ExternalLink,
  Download,
  Share2,
} from "lucide-react"

import {
  FaWhatsapp,
  FaInstagram,
  FaFacebookF,
  FaLink,
} from "react-icons/fa"

export default function LinkCardapioPage() {
  const [loading, setLoading] =
    useState(true)

  const [nomeRestaurante, setNomeRestaurante] =
    useState("")

  const [slug, setSlug] =
    useState("")

  const [whatsapp, setWhatsapp] =
    useState("")

    const [mounted, setMounted] =
  useState(false)

useEffect(() => {
  setMounted(true)
}, [])

  useEffect(() => {
    carregarRestaurante()
  }, [])

  if (!mounted) {
  return null
}

  async function carregarRestaurante() {
    try {
      const restauranteId =
        localStorage.getItem(
          "restaurante_id"
        )

      if (!restauranteId) {
        toast.error(
          "Restaurante não encontrado"
        )
        return
      }

      const { data, error } =
        await supabase
          .from("restaurantes")
          .select(
            "nome_restaurante, slug, whatsapp"
          )
          .eq("id", restauranteId)
          .single()

      if (error) throw error

      setNomeRestaurante(
        data.nome_restaurante || ""
      )

      setSlug(
        data.slug || ""
      )

      setWhatsapp(
        data.whatsapp || ""
      )

    } catch (error) {
      console.log(error)

      toast.error(
        "Erro ao carregar restaurante"
      )
    } finally {
      setLoading(false)
    }
  }

  const link =
    slug
      ? `https://meucardapioapp.com/${slug}`
      : ""

  async function copiarLink() {
    if (!link) return

    await navigator.clipboard.writeText(
      link
    )

    toast.success(
      "Link copiado com sucesso!"
    )
  }

  function abrirCardapio() {
    if (!link) return

    window.open(
      link,
      "_blank"
    )
  }

  function compartilharWhatsapp() {
    if (!link) return

    const mensagem =
      encodeURIComponent(
        `Confira nosso cardápio:\n\n${link}`
      )

    window.open(
      `https://wa.me/?text=${mensagem}`,
      "_blank"
    )
  }

  function compartilharInstagram() {
    copiarLink()

    toast.success(
      "Link copiado para compartilhar no Instagram"
    )
  }

  function compartilharFacebook() {
    if (!link) return

    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        link
      )}`,
      "_blank"
    )
  }

  function baixarQrCode() {
    const svg =
      document.getElementById(
        "qr-code"
      )

    if (!svg) return

    const svgData =
      new XMLSerializer().serializeToString(
        svg
      )

    const canvas =
      document.createElement("canvas")

    const ctx =
      canvas.getContext("2d")

    const img =
      new Image()

    img.onload = () => {
      canvas.width = 1000
      canvas.height = 1000

      ctx?.fillRect(
        0,
        0,
        1000,
        1000
      )

      ctx?.drawImage(
        img,
        0,
        0,
        1000,
        1000
      )

      const png =
        canvas.toDataURL(
          "image/png"
        )

      const a =
        document.createElement(
          "a"
        )

      a.href = png

      a.download =
        `qrcode-${slug}.png`

      a.click()

      toast.success(
        "QR Code baixado!"
      )
    }

    img.src =
      "data:image/svg+xml;base64," +
      btoa(svgData)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        Carregando...
      </div>
    )
  }

  return (
    <main className="max-w-6xl mx-auto space-y-8">

      {/* HEADER */}

      <div>

        <div className="inline-flex items-center gap-2 bg-[#FDECEC] text-[#7A1F3D] px-4 py-2 rounded-full font-semibold mb-4">
          <Share2 size={16} />
          Compartilhamento
        </div>

        <h1 className="text-5xl font-black text-[#1F1720]">
          Link do Cardápio
        </h1>

        <p className="text-zinc-500 text-lg mt-4 max-w-3xl">
          Compartilhe seu cardápio online
          com clientes através de links,
          QR Code e redes sociais.
        </p>

      </div>

      {/* CARD PRINCIPAL */}

      <div className="bg-white border rounded-3xl p-8 shadow-sm">

        <h2 className="text-3xl font-bold mb-2">
          {nomeRestaurante}
        </h2>

        <p className="text-zinc-500 mb-6">
          Seu cardápio está online
        </p>

        <div className="flex flex-col lg:flex-row gap-4">

          <div className="flex-1 bg-zinc-50 border rounded-2xl p-5 break-all text-zinc-700">
            {link}
          </div>

          <button
            onClick={copiarLink}
            className="
            px-6
            py-4
            rounded-2xl
            text-white
            font-bold
            transition-all
            duration-200
            hover:scale-[1.03]
            active:scale-95
            "
            style={{
              background:
                "linear-gradient(135deg,#7A1F3D,#542129)"
            }}
          >
            Copiar
          </button>

        </div>

        <div className="flex flex-wrap gap-4 mt-6">

          <button
            onClick={abrirCardapio}
            className="
            flex
            items-center
            gap-2
            border
            rounded-2xl
            px-6
            py-4
            bg-white
            hover:bg-zinc-50
            transition-all
            duration-200
            hover:scale-[1.02]
            active:scale-95
            "
          >
            <ExternalLink size={18} />
            Abrir Cardápio
          </button>

          <button
            onClick={
              compartilharWhatsapp
            }
            className="
            flex
            items-center
            gap-2
            border
            rounded-2xl
            px-6
            py-4
            bg-white
            hover:bg-zinc-50
            transition-all
            duration-200
            hover:scale-[1.02]
            active:scale-95
            "
          >
            <FaWhatsapp />
            WhatsApp
          </button>

        </div>

      </div>

      {/* QR CODE */}

      <div className="bg-white border rounded-3xl p-8">

        <h2 className="text-3xl font-bold mb-2">
          QR Code
        </h2>

        <p className="text-zinc-500 mb-8">
          Escaneie para abrir o cardápio
        </p>

        <div className="flex flex-col items-center">

          <div className="bg-white p-6 rounded-3xl shadow-lg">

            <QRCode
              id="qr-code"
              value={link}
              size={320}
            />

          </div>

          <button
            onClick={baixarQrCode}
            className="
            mt-8
            flex
            items-center
            gap-2
            px-8
            py-4
            rounded-2xl
            text-white
            font-bold
            transition-all
            duration-200
            hover:scale-[1.03]
            active:scale-95
            "
            style={{
              background:
                "linear-gradient(135deg,#7A1F3D,#542129)"
            }}
          >
            <Download size={18} />
            Baixar QR Code
          </button>

        </div>

      </div>

      {/* COMPARTILHAMENTO */}

      <div className="bg-white border rounded-3xl p-8">

        <h2 className="text-3xl font-bold mb-8">
          Compartilhamento Rápido
        </h2>

        <div className="grid md:grid-cols-4 gap-4">

          <button
            onClick={
              compartilharWhatsapp
            }
            className="
            p-6
            rounded-3xl
            border
            hover:border-green-500
            transition-all
            duration-200
            hover:scale-[1.03]
            active:scale-95
            bg-white
            "
          >
            <FaWhatsapp
              size={34}
              className="mx-auto text-green-500"
            />

            <p className="font-bold mt-4">
              WhatsApp
            </p>
          </button>

          <button
            onClick={
              compartilharInstagram
            }
            className="
            p-6
            rounded-3xl
            border
            hover:border-pink-500
            transition-all
            duration-200
            hover:scale-[1.03]
            active:scale-95
            bg-white
            "
          >
            <FaInstagram
              size={34}
              className="mx-auto text-pink-500"
            />

            <p className="font-bold mt-4">
              Instagram
            </p>
          </button>

          <button
            onClick={
              compartilharFacebook
            }
            className="
            p-6
            rounded-3xl
            border
            hover:border-blue-500
            transition-all
            duration-200
            hover:scale-[1.03]
            active:scale-95
            bg-white
            "
          >
            <FaFacebookF
              size={34}
              className="mx-auto text-blue-600"
            />

            <p className="font-bold mt-4">
              Facebook
            </p>
          </button>

          <button
            onClick={copiarLink}
            className="
            p-6
            rounded-3xl
            border
            hover:border-[#7A1F3D]
            transition-all
            duration-200
            hover:scale-[1.03]
            active:scale-95
            bg-white
            "
          >
            <FaLink
              size={34}
              className="mx-auto text-[#7A1F3D]"
            />

            <p className="font-bold mt-4">
              Copiar Link
            </p>
          </button>

        </div>

      </div>

    </main>
  )
}