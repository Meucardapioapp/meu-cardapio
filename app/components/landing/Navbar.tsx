"use client"

import Link from "next/link"
import { Menu } from "lucide-react"

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 z-50 w-full px-4 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-[#ece7e3] bg-white/90 px-4 py-3 shadow-lg backdrop-blur-md md:px-8">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#6D1F2F] text-lg font-black text-white shadow-md">
            V
          </div>

          <div className="leading-tight">
            <h1 className="text-base font-black text-black md:text-lg">
              MeuCardapioApp
            </h1>

            <p className="text-xs text-zinc-500 md:text-sm">
              Cardápio Digital Premium
            </p>
          </div>
        </Link>

        {/* MENU DESKTOP */}
        <nav className="hidden items-center gap-8 lg:flex">
          <a
            href="#beneficios"
            className="text-sm font-medium text-zinc-700 transition hover:text-[#6D1F2F]"
          >
            Benefícios
          </a>

          <a
            href="#dashboard"
            className="text-sm font-medium text-zinc-700 transition hover:text-[#6D1F2F]"
          >
            Dashboard
          </a>

          <a
            href="#pagamentos"
            className="text-sm font-medium text-zinc-700 transition hover:text-[#6D1F2F]"
          >
            Pagamentos
          </a>

          <a
            href="#precos"
            className="text-sm font-medium text-zinc-700 transition hover:text-[#6D1F2F]"
          >
            Preços
          </a>

          <a
            href="#faq"
            className="text-sm font-medium text-zinc-700 transition hover:text-[#6D1F2F]"
          >
            FAQ
          </a>
        </nav>

        {/* AÇÕES */}
        <div className="flex items-center gap-3">
          <Link
  href="/login"
  className="hidden text-sm font-semibold text-zinc-700 transition hover:text-[#6D1F2F] lg:block"
>
  Entrar
</Link>

        <Link
  href="/cadastro"
  className="rounded-xl bg-[#6D1F2F] px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-105 hover:bg-[#531723]"
>
  Criar Cardápio
</Link> 

          {/* MOBILE */}
          <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 lg:hidden">
            <Menu size={20} />
          </button>
        </div>
      </div>
    </header>
  )
}