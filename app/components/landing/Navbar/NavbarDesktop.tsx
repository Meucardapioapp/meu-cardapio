"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

export default function NavbarDesktop() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
     <div className="mx-auto flex h-16 max-w-7xl items-center justify-between border-b border-[#ECE7E3] bg-white/95 px-4 backdrop-blur-xl md:px-8">

        {/* LOGO */}
        <Link
          href="/"
          className="flex items-center transition-opacity hover:opacity-80"
        >
          <h1 className="text-lg font-bold tracking-tight text-zinc-900 md:text-2xl">
            Meu<span className="text-[#6D1F2F]">Cardapio</span>App
          </h1>
        </Link>

        {/* MENU DESKTOP */}
        <nav className="hidden items-center gap-8 xl:flex">

          <a
            href="#como-funciona"
            className="text-sm font-medium text-zinc-700 transition hover:text-[#6D1F2F]"
          >
            Como funciona
          </a>

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
            href="#faq"
            className="text-sm font-medium text-zinc-700 transition hover:text-[#6D1F2F]"
          >
            FAQ
          </a>

        </nav>

        {/* AÇÕES */}
        <div className="flex items-center gap-2">

          <Link
            href="/login"
            className="hidden text-sm font-medium text-zinc-700 transition hover:text-[#6D1F2F] lg:block"
          >
            Entrar
          </Link>

          <Link
            href="/cadastro"
            className="rounded-full bg-[#6D1F2F] px-4 py-2 text-[13px] font-semibold text-white transition-all duration-300 hover:bg-[#531723]"
          >
            Criar grátis
          </Link>

          <button
            aria-label="Abrir menu"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ECE7E3] bg-white transition hover:bg-zinc-100 lg:hidden"
          >
            <Menu
              size={18}
              strokeWidth={2.3}
              className="text-zinc-700"
            />
          </button>

        </div>

      </div>
    </header>
  );
}