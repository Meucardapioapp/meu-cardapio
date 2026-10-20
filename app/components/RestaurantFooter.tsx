"use client";

import { ArrowUpRight } from "lucide-react";

type Props = {
  corPrincipal: string;
};

const SITE = "https://meucardapioapp.com/?utm_source=cardapio&utm_medium=rodape";

/** Rodapé do cardápio: uma propaganda leve do MeuCardápioApp e os links legais. */
export default function RestaurantFooter({ corPrincipal }: Props) {
  return (
    <footer className="mx-auto mt-10 max-w-5xl px-4 pb-6">
      <a
        href={SITE}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 transition hover:border-zinc-300 hover:bg-white"
      >
        <img src="/apple-touch-icon.png" alt="" width={40} height={40} loading="lazy" className="h-10 w-10 shrink-0 rounded-xl" />
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-bold leading-tight text-zinc-900">
            Cardápio feito com <span style={{ color: "#6D1F2F" }}>MeuCardápioApp</span>
          </span>
          <span className="mt-0.5 block text-xs leading-4 text-zinc-500">
            Tem um restaurante? Venda pelo seu próprio cardápio, sem taxa por pedido.
          </span>
        </span>
        <ArrowUpRight
          size={18}
          className="shrink-0 text-zinc-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          style={{ color: corPrincipal }}
        />
      </a>

      <p className="mt-4 text-center text-[11px] text-zinc-400">
        <a href="/privacidade" className="hover:text-zinc-600">
          Privacidade
        </a>
        <span className="mx-1.5">·</span>
        <a href="/termos" className="hover:text-zinc-600">
          Termos
        </a>
        <span className="mx-1.5">·</span>
        <button type="button" onClick={() => window.dispatchEvent(new Event("preferencias-cookies"))} className="hover:text-zinc-600">
          Cookies
        </button>
        <span className="mx-1.5">·</span>© {new Date().getFullYear()} MeuCardápioApp
      </p>
    </footer>
  );
}
