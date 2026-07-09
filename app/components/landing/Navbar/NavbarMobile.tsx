"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  House,
  Star,
  LayoutDashboard,
  CircleHelp,
  MessageCircle,
  ArrowRight,
  Mail,
} from "lucide-react";

export default function NavbarMobile() {
  const [open, setOpen] = useState(false);

  const fechar = () => setOpen(false);

  return (
    <>
      {/* NAVBAR */}

      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur">

        <div className="flex h-16 items-center justify-between px-5">

          {/* Menu */}

          <button
            onClick={() => setOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-zinc-100 transition"
          >
            <Menu size={24} />
          </button>

          {/* Logo */}

          <Link href="/" className="text-xl font-black">

            Meu
            <span className="text-[#6D1F2F]">
              CardapioApp
            </span>

          </Link>

          {/* CTA */}

          <Link
            href="/cadastro"
            className="rounded-xl bg-[#6D1F2F] px-3 py-2 text-sm font-bold text-white"
          >
            Criar grátis
          </Link>

        </div>

      </header>

      {/* Overlay */}

      <div
        onClick={fechar}
        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition duration-300 ${
          open
            ? "opacity-100 visible"
            : "opacity-0 invisible"
        }`}
      />

      {/* Drawer */}

      <aside
        className={`fixed left-0 top-0 z-[70] h-screen w-[85%] max-w-[340px] bg-white transition duration-300 ${
          open
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >

        {/* Cabeçalho */}

        <div className="border-b border-zinc-200 p-6">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-2xl font-black">
                Meu
                <span className="text-[#6D1F2F]">
                  CardapioApp
                </span>
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Cardápio Digital Premium
              </p>

            </div>

            <button
              onClick={fechar}
              className="rounded-xl p-2 hover:bg-zinc-100"
            >
              <X />
            </button>

          </div>

        </div>

        {/* Links */}

        <div className="px-6 py-4">

          <nav className="space-y-1">

            <a
              href="#como-funciona"
              onClick={fechar}
              className="flex items-center gap-4 rounded-xl py-4 px-2 hover:bg-zinc-100"
            >
              <House size={20} />
              Como funciona
            </a>

            <a
              href="#beneficios"
              onClick={fechar}
              className="flex items-center gap-4 rounded-xl py-4 px-2 hover:bg-zinc-100"
            >
              <Star size={20} />
              Benefícios
            </a>

            <a
              href="#dashboard"
              onClick={fechar}
              className="flex items-center gap-4 rounded-xl py-4 px-2 hover:bg-zinc-100"
            >
              <LayoutDashboard size={20} />
              Dashboard
            </a>

            <a
              href="#faq"
              onClick={fechar}
              className="flex items-center gap-4 rounded-xl py-4 px-2 hover:bg-zinc-100"
            >
              <CircleHelp size={20} />
              FAQ
            </a>

          </nav>

          <div className="my-6 h-px bg-zinc-200" />

          {/* CTA */}

          <Link
            href="/cadastro"
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#6D1F2F] text-lg font-bold text-white"
          >
            Criar meu cardápio

            <ArrowRight size={18} />

          </Link>

          <Link
            href="/login"
            className="mt-3 flex h-14 items-center justify-center rounded-2xl border border-zinc-200 font-semibold"
          >
            Entrar
          </Link>

          <div className="my-6 h-px bg-zinc-200" />

          {/* Contato */}

          <div className="space-y-4 text-zinc-700">

            <a
              href="#"
              className="flex items-center gap-3"
            >
             <House size={20} />

              Instagram
            </a>

            <a
              href="https://wa.me/5592999999999"
              className="flex items-center gap-3"
            >
              <MessageCircle size={20} />

              WhatsApp
            </a>

            <a
              href="mailto:contato@meucardapioapp.com"
              className="flex items-center gap-3"
            >
              <Mail size={20} />

              contato@meucardapioapp.com
            </a>

          </div>

        </div>

      </aside>
    </>
  );
}