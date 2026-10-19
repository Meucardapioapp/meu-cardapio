import "server-only";

import { createHash } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Limite de tentativas por IP (ou por outra chave, como e-mail).
 *
 * Fica guardado no banco (função `registrar_tentativa`), então vale para
 * todas as instâncias da Vercel. Se o banco não responder, usa um limite
 * em memória como reserva — nunca deixa a rota sem proteção.
 */
const memoria = new Map<string, { inicio: number; total: number }>();

export function ipDaRequisicao(req: Request) {
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "desconhecido"
  );
}

/** Não guardamos IP nem e-mail em texto: só um resumo (hash). */
function resumo(valor: string) {
  const sal = process.env.RATE_LIMIT_SALT || "meucardapioapp";
  return createHash("sha256").update(`${sal}:${valor}`).digest("hex").slice(0, 32);
}

function limitarEmMemoria(id: string, maximo: number, janelaSegundos: number) {
  const agora = Date.now();
  const atual = memoria.get(id);

  if (!atual || agora - atual.inicio > janelaSegundos * 1000) {
    memoria.set(id, { inicio: agora, total: 1 });

    if (memoria.size > 5000) {
      for (const [k, v] of memoria) {
        if (agora - v.inicio > janelaSegundos * 1000) memoria.delete(k);
      }
    }

    return true;
  }

  atual.total += 1;
  return atual.total <= maximo;
}

async function registrar(id: string, maximo: number, janelaSegundos: number) {
  try {
    const { data, error } = await supabaseAdmin.rpc("registrar_tentativa", {
      p_chave: id,
      p_maximo: maximo,
      p_janela_segundos: janelaSegundos,
    });

    if (!error && typeof data === "boolean") return data;
  } catch {
    // cai para a memória
  }

  return limitarEmMemoria(id, maximo, janelaSegundos);
}

/** true = pode continuar; false = passou do limite. */
export async function limitar(
  req: Request,
  acao: string,
  maximo: number,
  janelaSegundos: number
) {
  return registrar(`${acao}:${resumo(ipDaRequisicao(req))}`, maximo, janelaSegundos);
}

/** Limite por uma chave qualquer (ex.: e-mail ou telefone). */
export async function limitarChave(
  acao: string,
  chave: string,
  maximo: number,
  janelaSegundos: number
) {
  return registrar(`${acao}:${resumo(chave.trim().toLowerCase())}`, maximo, janelaSegundos);
}
