"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function RedefinirSenhaPage() {
  const [senha, setSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [loading, setLoading] = useState(false)
  const [sessaoValida, setSessaoValida] = useState(false)

  useEffect(() => {
    async function carregarSessao() {
      try {
        const hash = window.location.hash

        if (!hash) {
          return
        }

        const params = new URLSearchParams(
          hash.replace("#", "")
        )

        const access_token =
          params.get("access_token")

        const refresh_token =
          params.get("refresh_token")

        if (
          !access_token ||
          !refresh_token
        ) {
          alert(
            "Link inválido ou expirado. Solicite uma nova recuperação."
          )
          return
        }

        const { error } =
          await supabase.auth.setSession({
            access_token,
            refresh_token,
          })

        if (error) {
          alert(error.message)
          return
        }

        setSessaoValida(true)

      } catch (err) {
        console.error(err)
      }
    }

    carregarSessao()
  }, [])

  async function alterarSenha() {
    if (!sessaoValida) {
      alert(
        "Link inválido ou expirado. Solicite uma nova recuperação."
      )
      return
    }

    if (!senha || !confirmarSenha) {
      alert("Preencha todos os campos.")
      return
    }

    if (senha !== confirmarSenha) {
      alert("As senhas não coincidem.")
      return
    }

    if (senha.length < 6) {
      alert(
        "A senha deve ter pelo menos 6 caracteres."
      )
      return
    }

    try {
      setLoading(true)

      const { error } =
        await supabase.auth.updateUser({
          password: senha,
        })

      if (error) {
        alert(error.message)
        return
      }

      alert(
        "Senha alterada com sucesso!"
      )

      window.location.href = "/login"

    } catch (err) {
      console.error(err)
      alert("Erro ao alterar senha.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F6F4] flex items-center justify-center p-6">

      <div className="w-full max-w-xl rounded-[36px] bg-white border border-[#ECE7E3] shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-12">

        <div className="mb-6">
          <span className="inline-flex rounded-full bg-[#F8F0F2] px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-[#6D1F2F]">
            Recuperação de senha
          </span>
        </div>

        <h1 className="text-4xl font-black text-black">
          Defina uma nova senha
        </h1>

        <p className="mt-4 text-zinc-500 text-lg">
          Crie uma nova senha para voltar a acessar seu painel.
        </p>

        <div className="mt-10">

          <input
            type="password"
            placeholder="Nova senha"
            value={senha}
            onChange={(e) =>
              setSenha(e.target.value)
            }
            className="w-full rounded-3xl border border-[#E7E5E4] bg-[#F8F6F4] px-7 py-6 text-black outline-none transition-all duration-300 focus:border-[#6D1F2F] focus:bg-white"
          />

          <input
            type="password"
            placeholder="Confirmar nova senha"
            value={confirmarSenha}
            onChange={(e) =>
              setConfirmarSenha(
                e.target.value
              )
            }
            className="mt-5 w-full rounded-3xl border border-[#E7E5E4] bg-[#F8F6F4] px-7 py-6 text-black outline-none transition-all duration-300 focus:border-[#6D1F2F] focus:bg-white"
          />

          <button
            onClick={alterarSenha}
            disabled={loading}
            className="mt-6 w-full rounded-3xl bg-[#6D1F2F] py-6 font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-[#531723] hover:shadow-xl disabled:opacity-70"
          >
            {loading
              ? "Salvando..."
              : "Alterar senha"}
          </button>

          <div className="mt-5 rounded-3xl bg-[#F8F6F4] p-5 text-center">
            <p className="text-sm font-medium text-zinc-600">
              🔒 Sua nova senha será armazenada com segurança
            </p>
          </div>

        </div>

      </div>

    </main>
  )
}