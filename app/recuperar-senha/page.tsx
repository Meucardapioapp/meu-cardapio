"use client"

import Link from "next/link"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import Toast from "@/app/components/ui/toast"

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const [toast, setToast] = useState<{
    tipo: "sucesso" | "erro" | "aviso"
    titulo: string
    mensagem: string
  } | null>(null)

  function mostrarToast(
    tipo: "sucesso" | "erro" | "aviso",
    titulo: string,
    mensagem: string
  ) {
    setToast({
      tipo,
      titulo,
      mensagem,
    })

    setTimeout(() => {
      setToast(null)
    }, 5000)
  }

  function mascararEmail(email: string) {
    const [nome, dominio] = email.split("@")

    if (!nome || !dominio) return email

    const inicio = nome.slice(0, 2)

    return `${inicio}${"*".repeat(
      Math.max(nome.length - 2, 3)
    )}@${dominio}`
  }

  async function enviarLink() {
    if (!email) {
      mostrarToast(
        "aviso",
        "E-mail obrigatório",
        "Digite seu e-mail para continuar."
      )
      return
    }

    try {
      setLoading(true)

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo:
              window.location.origin +
              "/redefinir-senha",
          }
        )

      if (error) {
        if (
          error.message.includes(
            "For security purposes"
          )
        ) {
          mostrarToast(
            "aviso",
            "Aguarde um momento",
            "Por segurança, aguarde cerca de 60 segundos antes de solicitar um novo e-mail."
          )
        } else {
          mostrarToast(
            "erro",
            "Não foi possível enviar",
            "Tente novamente em alguns instantes."
          )
        }

        return
      }

      setEnviado(true)

      mostrarToast(
        "sucesso",
        "E-mail enviado",
        "Verifique sua caixa de entrada, spam ou lixo eletrônico."
      )

    } catch (err) {
      console.error(err)

      mostrarToast(
        "erro",
        "Erro inesperado",
        "Ocorreu um erro ao enviar o e-mail."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {toast && (
        <Toast
          tipo={toast.tipo}
          titulo={toast.titulo}
          mensagem={toast.mensagem}
        />
      )}

      {enviado ? (
        <main className="min-h-screen bg-[#F8F6F4] flex items-center justify-center p-6">

          <div className="w-full max-w-xl rounded-[36px] bg-white border border-[#ECE7E3] p-12 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">

            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center text-3xl">
                ✓
              </div>
            </div>

            <h1 className="text-4xl font-black text-center text-black">
              Verifique seu e-mail
            </h1>

            <p className="mt-5 text-center text-zinc-600 text-lg">
              Enviamos um link seguro para:
            </p>

            <p className="mt-2 text-center font-bold text-[#6D1F2F] break-all">
              {mascararEmail(email)}
            </p>

            <div className="mt-8 rounded-3xl bg-[#F8F6F4] p-6">

              <p className="font-semibold text-zinc-700 mb-4">
                Não encontrou o e-mail?
              </p>

              <ul className="space-y-2 text-zinc-600">
                <li>✓ Verifique sua caixa de spam</li>
                <li>✓ Verifique o lixo eletrônico</li>
                <li>✓ Aguarde até 2 minutos</li>
                <li>
                  ✓ Procure por
                  {" "}
                  "Redefinir sua senha do Meu CardápioApp"
                </li>
              </ul>

            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">

              <button
                onClick={() =>
                  window.open(
                    "https://mail.google.com",
                    "_blank"
                  )
                }
                className="
                  rounded-3xl
                  border
                  border-[#6D1F2F]
                  py-5
                  font-bold
                  text-[#6D1F2F]
                  transition-all
                  hover:bg-[#F8F0F2]
                "
              >
                Abrir Gmail
              </button>

              <button
                onClick={() =>
                  window.open(
                    "https://outlook.live.com/mail",
                    "_blank"
                  )
                }
                className="
                  rounded-3xl
                  border
                  border-[#6D1F2F]
                  py-5
                  font-bold
                  text-[#6D1F2F]
                  transition-all
                  hover:bg-[#F8F0F2]
                "
              >
                Abrir Outlook
              </button>

            </div>

            <button
              onClick={enviarLink}
              className="mt-4 w-full rounded-3xl bg-[#6D1F2F] py-5 font-bold text-white transition-all hover:bg-[#531723]"
            >
              Reenviar e-mail
            </button>

            <Link
              href="/login"
              className="mt-4 block w-full rounded-3xl bg-zinc-100 py-5 text-center font-bold text-zinc-700 transition-all hover:bg-zinc-200"
            >
              Voltar ao login
            </Link>

          </div>

        </main>
      ) : (
        <main className="min-h-screen bg-[#F8F6F4] flex items-center justify-center p-6">

          <div className="w-full max-w-xl rounded-[36px] bg-white border border-[#ECE7E3] p-12 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">

            <div className="mb-6">

              <span className="inline-flex rounded-full bg-[#F8F0F2] px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-[#6D1F2F]">
                Meu Cardápio
              </span>

            </div>

            <h1 className="text-4xl font-black text-black">
              Recuperar acesso
            </h1>

            <p className="mt-4 text-zinc-500 text-lg leading-relaxed">
              Digite o e-mail cadastrado na sua conta.
              Enviaremos um link seguro para redefinir sua senha.
            </p>

            <input
              type="email"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              className="mt-10 w-full rounded-3xl border border-[#E7E5E4] bg-[#F8F6F4] px-7 py-6 text-black outline-none transition-all duration-300 focus:border-[#6D1F2F] focus:bg-white"
            />

            <button
              onClick={enviarLink}
              disabled={loading}
              className="mt-6 w-full rounded-3xl bg-[#6D1F2F] py-6 font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-[#531723] disabled:opacity-70"
            >
              {loading
                ? "Enviando..."
                : "Enviar link de recuperação"}
            </button>

            <p className="mt-5 text-center text-sm text-zinc-500">
              Você receberá um e-mail com um link para criar uma nova senha.
            </p>

            <div className="mt-6 text-center">

              <Link
                href="/login"
                className="text-sm text-zinc-500 hover:text-[#6D1F2F]"
              >
                Voltar para o login
              </Link>

            </div>

          </div>

        </main>
      )}
    </>
  )
}