"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { supabase } from "@/lib/supabase"

export default function CadastroPage() {

  const router = useRouter()

  const [loading, setLoading] =
    useState(false)

  const [nomeResponsavel, setNomeResponsavel] =
    useState("")

  const [nomeRestaurante, setNomeRestaurante] =
    useState("")

  const [telefone, setTelefone] =
    useState("")

  const [whatsapp, setWhatsapp] =
    useState("")

  const [cidade, setCidade] =
    useState("")

  const [slug, setSlug] =
    useState("")

  const [categoria, setCategoria] =
    useState("Açaí")

  const [email, setEmail] =
    useState("")

  const [senha, setSenha] =
    useState("")

  const [confirmarSenha, setConfirmarSenha] =
    useState("")

  async function cadastrar() {

    try {

      setLoading(true)

      if (
        !nomeResponsavel ||
        !nomeRestaurante ||
        !telefone ||
        !whatsapp ||
        !cidade ||
        !slug ||
        !email ||
        !senha ||
        !confirmarSenha
      ) {
        alert("Preencha todos os campos")
        return
      }

      if (senha !== confirmarSenha) {
        alert("As senhas não coincidem")
        return
      }

      const { data, error } =
        await supabase.auth.signUp({
          email,
          password: senha,
        })

      if (error) {

        console.log(
          "ERRO AUTH:",
          JSON.stringify(
            error,
            null,
            2
          )
        )

        alert(error.message)

        return
      }

      const user = data.user

      if (!user) {
        alert("Erro ao criar usuário")
        return
      }

      const {
        data: restaurante,
        error: restauranteError
      } = await supabase
        .from("restaurantes")
        .insert({
          auth_user_id: user.id,
          nome_responsavel: nomeResponsavel,
          nome_restaurante: nomeRestaurante,
          telefone,
          whatsapp,
          cidade,
          slug,
          categoria,
          email,
        })
        .select()
        .single()

      if (restauranteError) {

        console.log(
          "ERRO RESTAURANTE:",
          JSON.stringify(
            restauranteError,
            null,
            2
          )
        )

        alert(
          JSON.stringify(
            restauranteError,
            null,
            2
          )
        )

        return
      }

      localStorage.setItem(
        "restaurante_id",
        restaurante.id
      )

      router.push("/admin")

    } catch (error) {

      console.log(
        "ERRO GERAL:",
        JSON.stringify(
          error,
          null,
          2
        )
      )

      alert("Erro inesperado")

    } finally {

      setLoading(false)

    }
  }

  return (
    <main className="min-h-screen bg-[#F8F6F4] flex items-center justify-center p-6">

      <div className="w-full max-w-3xl rounded-[32px] bg-white border border-[#ECE7E3] shadow-2xl p-8">

        <h1 className="text-5xl font-black text-black mb-2">
          Criar Conta
        </h1>

        <p className="text-zinc-500 mb-8">
          Crie sua loja profissional
        </p>

        <div className="grid md:grid-cols-2 gap-4 mb-4">

          <input
            type="text"
            placeholder="Nome responsável"
            value={nomeResponsavel}
            onChange={(e) =>
              setNomeResponsavel(e.target.value)
            }
            className="bg-[#F8F6F4] border border-[#E7E5E4] text-black rounded-2xl p-4 outline-none focus:border-[#6D1F2F]"
          />

          <input
            type="text"
            placeholder="Nome restaurante"
            value={nomeRestaurante}
            onChange={(e) =>
              setNomeRestaurante(e.target.value)
            }
            className="bg-[#F8F6F4] border border-[#E7E5E4] text-black rounded-2xl p-4 outline-none focus:border-[#6D1F2F]"
          />

          <input
            type="text"
            placeholder="Telefone"
            value={telefone}
            onChange={(e) =>
              setTelefone(e.target.value)
            }
            className="bg-[#F8F6F4] border border-[#E7E5E4] text-black rounded-2xl p-4 outline-none focus:border-[#6D1F2F]"
          />

          <input
            type="text"
            placeholder="WhatsApp"
            value={whatsapp}
            onChange={(e) =>
              setWhatsapp(e.target.value)
            }
            className="bg-[#F8F6F4] border border-[#E7E5E4] text-black rounded-2xl p-4 outline-none focus:border-[#6D1F2F]"
          />

          <input
            type="text"
            placeholder="Cidade"
            value={cidade}
            onChange={(e) =>
              setCidade(e.target.value)
            }
            className="bg-[#F8F6F4] border border-[#E7E5E4] text-black rounded-2xl p-4 outline-none focus:border-[#6D1F2F]"
          />

          <input
            type="text"
            placeholder="Slug do cardápio, ex: vyora-acai"
            value={slug}
            onChange={(e) =>
              setSlug(e.target.value)
            }
            className="bg-[#F8F6F4] border border-[#E7E5E4] text-black rounded-2xl p-4 outline-none focus:border-[#6D1F2F]"
          />

        </div>

        <select
          value={categoria}
          onChange={(e) =>
            setCategoria(e.target.value)
          }
          className="w-full bg-[#F8F6F4] border border-[#E7E5E4] text-black rounded-2xl p-4 outline-none mb-4 focus:border-[#6D1F2F]"
        >
          <option>Açaí</option>
          <option>Hamburguer</option>
          <option>Pizza</option>
          <option>Sushi</option>
          <option>Outros</option>
        </select>

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

        <input
          type="password"
          placeholder="Confirmar senha"
          value={confirmarSenha}
          onChange={(e) =>
            setConfirmarSenha(e.target.value)
          }
          className="w-full bg-[#F8F6F4] border border-[#E7E5E4] text-black rounded-2xl p-4 outline-none mb-6 focus:border-[#6D1F2F]"
        />

        <button
          onClick={cadastrar}
          disabled={loading}
          className="w-full bg-[#6D1F2F] hover:bg-[#531723] transition-all duration-300 rounded-2xl p-4 font-bold text-white shadow-lg disabled:opacity-50"
        >
          {loading
            ? "Criando..."
            : "Criar Conta"}
        </button>

        <p className="text-zinc-500 text-center mt-6">
          Já possui conta?{" "}

          <Link
            href="/login"
            className="text-[#6D1F2F] font-bold"
          >
            Entrar
          </Link>
        </p>

      </div>

    </main>
  )
}