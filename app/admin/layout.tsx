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
  nome: "Endereço do Restaurante",
  link: "/admin/restaurante",
},

{
  nome: "Taxa de Entrega",
  link: "/admin/entrega",
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
  <div className="min-h-screen bg-[#D1CBD0] flex">
 <aside
className="
w-72
bg-[#1F1C21]
border-r
border-[#332D35]
p-6
flex
flex-col
shadow-2xl
rounded-r-3xl
"
>
        <h1 className="text-3xl font-black mb-10 text-white">
  MeuCardápio
</h1>

        <nav className="flex flex-col gap-3">
          {menus.map((item) => (
            <Link
              key={item.link}
              href={item.link}
              className={`p-4 rounded-xl transition font-semibold ${
                pathname === item.link
? "bg-gradient-to-r from-[#7A1F3D] to-[#542129] text-white shadow-lg"
: "bg-[#2B2630] hover:bg-[#39323F] text-white"
              }`}
            >
              {item.nome}
            </Link>
          ))}
        </nav>

        <button
          onClick={sair}
         className="
mt-auto
bg-gradient-to-r
from-[#7A1F3D]
to-[#542129]
hover:opacity-90
transition
p-4
rounded-xl
font-bold
text-white
"
        >
          Sair
        </button>
      </aside>

     <main className="flex-1 p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}