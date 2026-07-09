"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

export default function NavbarDesktop() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex h-20 max-w-[1500px] items-center justify-between border-b border-[#ECE7E3] bg-white/95 px-8 backdrop-blur-xl lg:px-10">

        {/* Logo */}
        <Link
          href="/"
          className="transition-opacity hover:opacity-80"
        >
          <h1 className="text-3xl font-black tracking-tight text-zinc-900">
            Meu
            <span className="text-[#6D1F2F]">
              Cardapio
            </span>
            App
          </h1>
        </Link>

        {/* Menu */}
        <nav className="hidden items-center gap-12 xl:flex">

          <a
            href="#como-funciona"
            className="text-base font-semibold text-zinc-700 transition hover:text-[#6D1F2F]"
          >
            Como funciona
          </a>

          <a
            href="#beneficios"
            className="text-base font-semibold text-zinc-700 transition hover:text-[#6D1F2F]"
          >
            Benefícios
          </a>

          <a
            href="#dashboard"
            className="text-base font-semibold text-zinc-700 transition hover:text-[#6D1F2F]"
          >
            Dashboard
          </a>

          <a
            href="#faq"
            className="text-base font-semibold text-zinc-700 transition hover:text-[#6D1F2F]"
          >
            FAQ
          </a>

        </nav>

        {/* Ações */}
        <div className="flex items-center gap-4">

          <Link
            href="/login"
            className="hidden text-base font-semibold text-zinc-700 transition hover:text-[#6D1F2F] lg:block"
          >
            Entrar
          </Link>

          <Link
            href="/cadastro"
            className="rounded-full bg-[#6D1F2F] px-7 py-3 text-base font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#531723] hover:shadow-lg"
          >
            Criar grátis
          </Link>

          <button
            aria-label="Abrir menu"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#ECE7E3] bg-white transition hover:bg-zinc-100 xl:hidden"
          >
            <Menu
              size={20}
              strokeWidth={2.3}
              className="text-zinc-700"
            />
          </button>

        </div>

      </div>
    </header>
  );
}