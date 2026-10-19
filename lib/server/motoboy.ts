import "server-only";

import type { NextRequest } from "next/server";
import { getFuncionariosLogados } from "@/lib/server/funcionario";

/** Motoboy = funcionário com a função "motoboy" (o login é o mesmo da equipe). */
export {
  normalizarTelefone,
  gerarPin,
  hashPin,
  pinConfere,
  gravarSessao,
  apagarSessao,
  COOKIE_EQUIPE as COOKIE_MOTOBOY,
} from "@/lib/server/funcionario";

export function formatarTelefone(d: string) {
  return d.length === 11
    ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
    : d.length === 10
      ? `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
      : d;
}

export type MotoboyLogado = {
  id: string;
  nome: string;
  telefone: string;
  restaurante_id: string;
  restaurante_nome: string;
};

/** Cadastros de motoboy da sessão (pode trabalhar para mais de um restaurante). */
export async function getMotoboyLogado(req: NextRequest): Promise<MotoboyLogado[] | null> {
  const todos = await getFuncionariosLogados(req);
  const motoboys = (todos ?? []).filter((f) => f.funcao === "motoboy");
  return motoboys.length ? motoboys : null;
}
