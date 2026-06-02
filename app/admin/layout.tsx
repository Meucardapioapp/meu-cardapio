"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { supabase } from "@/utils/supabase/client"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  async function sair() {
    await supabase.auth.signOut()

    localStorage.removeItem("restaurante_id")

    window.location.href = "/login"
  }

  const menus = [
  {
    nome: "Dashboard",
    link: "/admin",
  },
  {
    nome: "Produtos",
    link: "/admin/produtos",
  },
  {
    nome: "Pedidos",
    link: "/admin/pedidos",
  },
  {
    nome: "Aparência",
    link: "/admin/aparencia",
  },
  {
    nome: "Horários",
    link: "/admin/horarios",
  },
  {
    nome: "Link do Cardápio",
    link: "/admin/link-cardapio",
  },
  {
    nome: "Assinatura",
    link: "/admin/assinatura",
  },
  {
    nome: "Configurações",
    link: "/admin/configuracoes",
  },
]

  return (
    <div className="min-h-screen bg-black text-white flex">
      <aside className="w-72 bg-zinc-950 border-r border-zinc-800 p-6 flex flex-col">
        <h1 className="text-3xl font-black mb-10">
          MeuCardapio
        </h1>

        <nav className="flex flex-col gap-3">
          {menus.map((item) => (
            <Link
              key={item.link}
              href={item.link}
              className={`p-4 rounded-xl transition font-semibold ${
                pathname === item.link
                  ? "bg-green-500 text-black"
                  : "bg-zinc-900 hover:bg-zinc-800"
              }`}
            >
              {item.nome}
            </Link>
          ))}
        </nav>

        <button
          onClick={sair}
          className="mt-auto bg-red-500 hover:bg-red-400 transition p-4 rounded-xl font-bold"
        >
          Sair
        </button>
      </aside>

      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}