"use client";

import Link from "next/link";
import {
  ArrowRight,
  Mail,
  Phone,
  MessageCircle,
  ChevronRight,
  Gift,
  BarChart3,
  CircleHelp,
  UserPlus,
} from "lucide-react";

export default function FooterMobile() {
  return (
    <footer className="bg-[#111111] text-white">

      {/* CTA */}
      <div className="px-5 pt-6">

        <div className="overflow-hidden rounded-[28px] bg-gradient-to-br from-[#6D1F2F] via-[#5A1827] to-[#2D0C14] p-7 shadow-2xl">

          <p className="mt-4 text-[16px] leading-7 text-zinc-200">
Aumente o lucro do seu delivery, 
gere uma melhor experiencia ao seu cliente e não pague nada por isso

          </p>

          <Link
            href="/cadastro"
            className="mt-7 flex h-14 items-center justify-center gap-2 rounded-2xl bg-white font-bold text-[#6D1F2F] transition hover:scale-[1.02]"
          >
            Criar meu cardápio
            <ArrowRight size={18} />
          </Link>

        </div>

      </div>

      {/* Conteúdo */}
      <div className="mx-auto max-w-md px-6 pt-10 pb-8">

        {/* Logo */}
        <div className="flex items-center gap-4">

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6D1F2F] text-3xl font-black">
            M
          </div>

          <div>

            <h3 className="text-2xl font-black">
              MeuCardapioApp
            </h3>

            <p className="text-sm text-zinc-400">
              Cardápio Digital Premium
            </p>

          </div>

        </div>

        

        <div className="my-8 h-px bg-white/10" />

        {/* Navegação + Contato */}
        <div className="grid grid-cols-2 gap-8">

          {/* Navegação */}

          <div>

            <h4 className="mb-5 text-lg font-bold">
              Navegação
            </h4>

            <div className="space-y-4">

              <Link
                href="#beneficios"
                className="flex items-center justify-between text-zinc-300 transition hover:text-white"
              >
                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
                    <Gift size={18} />
                  </div>

                  <span>Benefícios</span>

                </div>

                <ChevronRight size={18} />

              </Link>

              <Link
                href="#dashboard"
                className="flex items-center justify-between text-zinc-300 transition hover:text-white"
              >
                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
                    <BarChart3 size={18} />
                  </div>

                  <span>Dashboard</span>

                </div>

                <ChevronRight size={18} />

              </Link>

              <Link
                href="#faq"
                className="flex items-center justify-between text-zinc-300 transition hover:text-white"
              >
                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
                    <CircleHelp size={18} />
                  </div>

                  <span>FAQ</span>

                </div>

                <ChevronRight size={18} />

              </Link>

              <Link
                href="/cadastro"
                className="flex items-center justify-between text-zinc-300 transition hover:text-white"
              >
                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
                    <UserPlus size={18} />
                  </div>

                  <span>Criar conta</span>

                </div>

                <ChevronRight size={18} />

              </Link>

            </div>

          </div>

          {/* CONTATO começa na Parte 2 */}

                    <div>

            <h4 className="mb-5 text-lg font-bold">
              Contato
            </h4>

            <div className="space-y-4">

              <a
                href="https://wa.me/"
                className="flex items-center gap-3 text-zinc-300 transition hover:text-white"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
                  <MessageCircle size={18} />
                </div>

                <div>
                  <p className="font-medium">
                    WhatsApp
                  </p>

                  <p className="text-xs text-zinc-500">
                    (92) 99233--8863
                  </p>
                </div>

              </a>

              <a
                href="mailto:contato@meucardapioapp.com"
                className="flex items-center gap-3 text-zinc-300 transition hover:text-white"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
                  <Mail size={18} />
                </div>

                <div>
                  <p className="font-medium">
                    E-mail
                  </p>

                  <p className="text-xs text-zinc-500 break-all">
                    contato@meucardapioapp.com
                  </p>
                </div>

              </a>

              <div className="flex items-center gap-3 text-zinc-300">

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
                  <Phone size={18} />
                </div>

                <div>
                  <p className="font-medium">
                    Suporte
                  </p>

                  <p className="text-xs text-zinc-500">
                    Segunda a Sexta
                  </p>
                </div>

              </div>

            </div>

          </div>

        </div>

     

        <div className="my-8 h-px bg-white/10" />

        {/* Links inferiores */}

        <div className="flex flex-wrap justify-center gap-x-5 gap-y-3 text-sm text-zinc-500">

          <Link href="/privacidade">
            Privacidade
          </Link>

          <Link href="/termos">
            Termos
          </Link>

          <Link href="/cookies">
            Cookies
          </Link>

          <Link href="/contato">
            Contato
          </Link>

        </div>

        <p className="mt-8 text-center text-xs leading-6 text-zinc-600">
          © 2026 <strong className="text-zinc-400">MeuCardapioApp</strong>.
          Todos os direitos reservados.
        </p>

      </div>

    </footer>
  );
}
