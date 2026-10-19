"use client";

import { Check, X } from "lucide-react";
import { REGRAS_SENHA, forcaSenha, senhaValida } from "@/lib/senha";

const NIVEIS = [
  { nome: "Fraca", cor: "#DC2626", largura: "33%" },
  { nome: "Média", cor: "#F59E0B", largura: "66%" },
  { nome: "Forte", cor: "#16A34A", largura: "100%" },
];

/** Barra de força + lista do que falta na senha. */
export default function MedidorSenha({ senha }: { senha: string }) {
  if (!senha) return null;

  const forca = forcaSenha(senha);
  const nivel = NIVEIS[senhaValida(senha) ? Math.max(forca, 1) : 0];

  return (
    <div className="mt-3" aria-live="polite">
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-zinc-500">Força da senha</span>
        <span style={{ color: nivel.cor }}>{nivel.nome}</span>
      </div>
      <div className="mt-1 h-2 w-full rounded-full bg-zinc-200 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: nivel.largura, backgroundColor: nivel.cor }}
        />
      </div>
      <ul className="mt-3 grid gap-1 text-sm">
        {REGRAS_SENHA.map((regra) => {
          const ok = regra.teste(senha);
          return (
            <li key={regra.id} className={`flex items-center gap-2 ${ok ? "text-green-700" : "text-zinc-500"}`}>
              {ok ? <Check size={14} /> : <X size={14} />}
              {regra.texto}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
