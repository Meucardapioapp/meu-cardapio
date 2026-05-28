"use client"

import Link from "next/link"
import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [loading, setLoading] = useState(false)

  async function login() {
    try {
      setLoading(true)

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: senha.trim(),
        })

      if (error) {
        alert(error.message)
        return
      }

      const userId = data.user.id

      const {
        data: restaurante,
        error: restauranteError,
      } = await supabase
        .from("restaurantes")
        .select("*")
        .eq("auth_user_id", userId)
        .single()

      if (
        restauranteError ||
        !restaurante
      ) {
        alert(
          "Restaurante não encontrado"
        )

        return
      }

      localStorage.setItem(
        "restaurante_id",
        restaurante.id
      )

      window.location.href =
        "/admin/produtos"

    } catch (err) {

      console.log(err)

      alert("Erro ao entrar")

    } finally {

      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F6F4] flex items-center justify-center p-6">

      <div className="w-full max-w-md rounded-[32px] bg-white border border-[#ECE7E3] shadow-2xl p-8">

        <h1 className="text-5xl font-black text-black mb-2">
          Entrar
        </h1>

        <p className="text-zinc-500 mb-8">
          Acesse seu painel
        </p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="w-full bg-[#F8F6F4] border border-[#E7E5E4] text-black rounded-2xl p-4 outline-none mb-4 focus:border-[#6D1F2F]"
        />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) =>
            setSenha(e.target.value)
          }
          className="w-full bg-[#F8F6F4] border border-[#E7E5E4] text-black rounded-2xl p-4 outline-none mb-6 focus:border-[#6D1F2F]"
        />

        <button
          onClick={login}
          disabled={loading}
          className="w-full bg-[#6D1F2F] hover:bg-[#531723] transition-all duration-300 rounded-2xl p-4 font-bold text-white shadow-lg"
        >
          {loading
            ? "Entrando..."
            : "Entrar"}
        </button>

        <p className="text-zinc-500 text-center mt-6">
          Não possui conta?{" "}

          <Link
            href="/cadastro"
            className="text-[#6D1F2F] font-bold"
          >
            Criar agora
          </Link>
        </p>

      </div>

    </main>
  )
}