"use client"

import Link from "next/link"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Toast from "@/app/components/ui/toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [loading, setLoading] = useState(false)
  const [mostrarSenha, setMostrarSenha] =
    useState(false)
    
    const [toast, setToast] = useState<{
  tipo: "sucesso" | "erro" | "aviso"
  titulo: string
  mensagem: string
} | null>(null)

  async function login() {
    try {
      setLoading(true)

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: senha.trim(),
        })

      if (error) {
  setToast({
    tipo: "erro",
    titulo: "Não foi possível entrar",
    mensagem: "E-mail ou senha incorretos.",
  })

  setTimeout(() => {
    setToast(null)
  }, 5000)

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
  setToast({
    tipo: "erro",
    titulo: "Conta não encontrada",
    mensagem:
      "Não encontramos um restaurante vinculado a esta conta.",
  })

  setTimeout(() => {
    setToast(null)
  }, 5000)

  return
}

      localStorage.setItem(
        "restaurante_id",
        restaurante.id
      )

      window.location.href =
        "/admin/"

   } catch (err) {
  console.log(err)

  setToast({
    tipo: "erro",
    titulo: "Erro inesperado",
    mensagem:
      "Não foi possível concluir o login.",
  })

  setTimeout(() => {
    setToast(null)
  }, 5000)

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

    <main className="min-h-screen bg-[#F8F6F4] flex items-center justify-center p-6">

      <div
        className="
          w-full
          max-w-xl
          rounded-[36px]
          bg-white
          border
          border-[#ECE7E3]
          p-12
          shadow-[0_20px_60px_rgba(0,0,0,0.08)]
          hover:shadow-[0_30px_80px_rgba(109,31,47,0.10)]
          transition-all
          duration-500
        "
      >

        <div className="mb-8">
          <span className="inline-flex rounded-full bg-[#F8F0F2] px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-[#6D1F2F]">
            meu cardápio
          </span>
        </div>

        <h1 className="text-5xl font-black text-black leading-none">
          Entrar
        </h1>

        <p className="mt-5 text-zinc-500 text-lg leading-relaxed">
          Gerencie pedidos, produtos e acompanhe o crescimento do seu negócio.
        </p>

       <form
  className="mt-10"
  onSubmit={(e) => {
    e.preventDefault()
    login()
  }}
>

          <input
            type="email"
            placeholder="Seu e-mail"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="
              w-full
              rounded-3xl
              border
              border-[#E7E5E4]
              bg-[#F8F6F4]
              px-7
              py-6
              text-black
              outline-none
              transition-all
              duration-300
              focus:border-[#6D1F2F]
              focus:bg-white
              focus:shadow-md
            "
          />

          <div className="relative mt-5">

            <input
              type={
                mostrarSenha
                  ? "text"
                  : "password"
              }
              placeholder="Sua senha"
              value={senha}
              onChange={(e) =>
                setSenha(e.target.value)
              }
              className="
                w-full
                rounded-3xl
                border
                border-[#E7E5E4]
                bg-[#F8F6F4]
                px-7
                py-6
                pr-16
                text-black
                outline-none
                transition-all
                duration-300
                focus:border-[#6D1F2F]
                focus:bg-white
                focus:shadow-md
              "
            />

            <button
              type="button"
              onClick={() =>
                setMostrarSenha(
                  !mostrarSenha
                )
              }
              className="
                absolute
                right-6
                top-1/2
                -translate-y-1/2
                text-zinc-500
                hover:text-[#6D1F2F]
                transition-colors
              "
            >
              {mostrarSenha ? (
                <EyeOff size={20} />
              ) : (
                <Eye size={20} />
              )}
            </button>

          </div>

          <div className="mt-4 flex justify-end">

            <Link
  href="/recuperar-senha"
  className="
    text-sm
    font-medium
    text-[#6D1F2F]
    transition-all
    hover:underline
  "
>
  Esqueci minha senha
</Link>

          </div>

          <button
  type="submit"
  disabled={loading}
            className="
              mt-6
              w-full
              rounded-3xl
              bg-[#6D1F2F]
              py-6
              font-bold
              text-white
              shadow-lg
              transition-all
              duration-300
              hover:-translate-y-1
              hover:bg-[#531723]
              hover:shadow-2xl
              disabled:opacity-70
            "
          >
            {loading
              ? "Entrando..."
              : "Entrar no painel"}
          </button>

          <div className="mt-5 rounded-3xl bg-[#F8F6F4] p-5 text-center">

            <p className="text-sm font-medium text-zinc-600">
              🔒 Dados protegidos por criptografia
            </p>

          </div>

          <div className="mt-8 text-center">

            <p className="text-zinc-500">
              Novo por aqui?{" "}

              <Link
                href="/cadastro"
                className="
                  font-bold
                  text-[#6D1F2F]
                  hover:underline
                "
              >
                Criar minha conta
              </Link>

            </p>

          </div>

        </form>

         </div>

    </main>
  </>
)
}   