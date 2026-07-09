"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { supabase } from "@/utils/supabase/client"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
 const pathname = usePathname()

const [menuAberto, setMenuAberto] = useState(false)

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
    nome: "Categorias" ,
    link: "/admin/categorias" ,
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
  nome: "Pagamentos",
  link: "/admin/pagamentos",
},

{
  nome: "Dados Bancários",
  link: "/admin/dados-bancarios",
},

  {
    nome: "Link do Cardápio",
    link: "/admin/link-cardapio",
  },
  
  {
    nome: "Configurações",
    link: "/admin/configuracoes",
  },
]

  return (

    <>

{menuAberto && (
  <div
    onClick={() => setMenuAberto(false)}
    className="
      lg:hidden
      fixed
      inset-0
      bg-black/50
      z-40
    "
  />
)}
  <div className="min-h-screen bg-[#D1CBD0] flex">
<aside
className={`
fixed lg:relative
lg:flex
top-0
left-0
z-50
h-screen
overflow-y-auto scrollbar-hide
w-72
bg-[#1F1C21]
border-r
border-[#332D35]
px-5 py-5
flex
flex-col
shadow-2xl
rounded-r-3xl
transform
transition-transform
duration-300

${menuAberto ? "translate-x-0" : "-translate-x-full"}

lg:translate-x-0
`}
>
      <div className="flex items-center justify-between mb-6">

  <h1 className="text-3xl font-black text-white">
    MeuCardápio
  </h1>

 <button
  onClick={() => setMenuAberto(!menuAberto)}
  className="
    lg:hidden
    text-white
    text-xl
    font-bold
    w-8
    h-8
    flex
    items-center
    justify-center
  "
>
  {menuAberto ? "✕" : "☰"}
</button>

</div>

       <nav className="flex flex-col gap-3">
  {menus.map((item) => (
    <Link
      key={item.link}
      href={item.link}
      onClick={() => setMenuAberto(false)}
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
    mt-3
      p-4
      rounded-xl
      font-semibold
      text-white
      bg-gradient-to-r
      from-[#7A1F3D]
      to-[#542129]
      hover:opacity-90
      transition
    "
  >
    Sair
  </button>

      </aside>

 <main
className="
flex-1
p-5
lg:p-10
overflow-y-auto
pt-6
lg:pt-10
"
>
        {children}
      </main>
      {!menuAberto && (
  <button
    onClick={() => setMenuAberto(true)}
    className="
      lg:hidden
      fixed
      top-4
      left-4
      z-50
      w-12
      h-12
      rounded-xl
      bg-[#1F1C21]
      text-white
      text-2xl
      shadow-xl
      flex
      items-center
      justify-center
    "
  >
    ☰
  </button>
)}
   </div>

</>
)
}