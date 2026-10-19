"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import EntrarEquipe, { sairEquipe } from "@/app/components/equipe/EntrarEquipe";

type Cadastro = { id: string; nome: string; funcao: string; setor: string | null; restaurante: string; pagina: string };

const ROTULO: Record<string, string> = { garcom: "🧑‍🍳 Garçom — anotar pedidos", cozinha: "🔥 Cozinha — preparar pedidos", motoboy: "🛵 Motoboy — entregas" };

/** Link único da equipe: entra e vai para o app certo (garçom, cozinha ou motoboy). */
export default function EntradaEquipe() {
  const [cadastros, setCadastros] = useState<Cadastro[] | null | undefined>(undefined);

  useEffect(() => {
    fetch("/api/equipe-app/eu", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const lista: Cadastro[] = d?.success ? d.cadastros : [];
        const paginas = [...new Set(lista.map((c) => c.pagina))];
        if (paginas.length === 1) window.location.replace(paginas[0]);
        else setCadastros(lista.length ? lista : null);
      })
      .catch(() => setCadastros(null));
  }, []);

  if (cadastros === undefined) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-zinc-50">
        <Loader2 className="animate-spin text-zinc-400" size={32} />
      </div>
    );
  }

  if (!cadastros) return <EntrarEquipe titulo="Equipe" emoji="👋" />;

  const funcoes = [...new Map(cadastros.map((c) => [c.pagina, c])).values()];
  return (
    <div className="min-h-dvh bg-zinc-50 flex items-center justify-center p-5">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 border">
        <p className="text-2xl font-black">Olá, {cadastros[0].nome.split(" ")[0]}!</p>
        <p className="text-sm text-zinc-500 mt-1">O que você vai fazer agora?</p>
        <div className="mt-4 space-y-2">
          {funcoes.map((c) => (
            <a key={c.pagina} href={c.pagina} className="flex h-14 items-center rounded-xl border-2 px-4 font-bold">
              {ROTULO[c.funcao] ?? c.funcao}
            </a>
          ))}
        </div>
        <button onClick={sairEquipe} className="mt-5 w-full text-sm font-semibold text-zinc-500 underline">Sair</button>
      </div>
    </div>
  );
}
