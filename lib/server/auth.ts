import "server-only";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Restaurante do dono autenticado.
 *
 * Toda rota do painel deve usar esta função em vez de aceitar
 * `restauranteId` vindo do navegador: o ID sai sempre do usuário logado.
 */
export type DonoAutenticado = {
  userId: string;
  email: string | null;
  restaurante: {
    id: string;
    slug: string;
    nome_restaurante: string | null;
    nome_responsavel: string | null;
    email: string | null;
    whatsapp: string | null;
    created_at: string | null;
  };
};

function lerToken(req: Request): string | null {
  const authorization = req.headers.get("authorization");

  if (!authorization?.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const token = authorization.slice(7).trim();

  return token || null;
}

type UsuarioToken = { id: string; email: string | null };

/**
 * Confere o token do usuário. Com as chaves novas do Supabase (assinatura
 * assimétrica), a conferência é feita aqui mesmo, sem ir ao servidor do
 * Supabase a cada clique — o painel fica bem mais rápido. Se não der,
 * pergunta ao Supabase como antes.
 */
export async function getUsuarioAutenticado(req: Request): Promise<UsuarioToken | null> {
  const token = lerToken(req);

  if (!token) return null;

  try {
    const { data, error } = await (supabaseAdmin.auth as any).getClaims(token);
    const claims = data?.claims;
    if (!error && claims?.sub && claims?.role === "authenticated") {
      if (!claims.exp || claims.exp * 1000 > Date.now()) {
        return { id: String(claims.sub), email: claims.email ?? null };
      }
      return null;
    }
  } catch {
    // segue para a conferência pelo Supabase
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) return null;

  return { id: user.id, email: user.email ?? null };
}

// Restaurante do usuário: guarda por 30 s (evita uma consulta a cada clique).
const cacheDono = new Map<string, { ate: number; dono: DonoAutenticado }>();

export async function getDonoAutenticado(
  req: Request
): Promise<DonoAutenticado | null> {
  const user = await getUsuarioAutenticado(req);

  if (!user) return null;

  const guardado = cacheDono.get(user.id);
  if (guardado && guardado.ate > Date.now()) return guardado.dono;

  const { data: restaurante, error } = await supabaseAdmin
    .from("restaurantes")
    .select(
      "id, slug, nome_restaurante, nome_responsavel, email, whatsapp, created_at"
    )
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error || !restaurante) return null;

  const dono: DonoAutenticado = {
    userId: user.id,
    email: user.email ?? null,
    restaurante: {
      ...restaurante,
      id: String(restaurante.id),
    },
  };

  cacheDono.set(user.id, { ate: Date.now() + 30_000, dono });
  if (cacheDono.size > 500) cacheDono.delete(cacheDono.keys().next().value as string);

  return dono;
}

export type MembroAutenticado = DonoAutenticado & { papel: "dono" | "atendente"; nomeMembro: string | null };

const cacheMembro = new Map<string, { ate: number; membro: MembroAutenticado | null }>();

/** Esquece o cache de um atendente (ao remover ou bloquear o acesso). */
export function esquecerMembro(userId: string) {
  cacheMembro.delete(userId);
}

/**
 * Dono OU atendente da equipe. Use só nas rotas que o atendente pode usar
 * (pedidos, impressão, pausa). Todas as outras continuam com getDonoAutenticado.
 */
export async function getEquipeAutenticada(req: Request): Promise<MembroAutenticado | null> {
  const dono = await getDonoAutenticado(req);
  if (dono) return { ...dono, papel: "dono", nomeMembro: dono.restaurante.nome_responsavel };

  const user = await getUsuarioAutenticado(req);
  if (!user) return null;

  const guardado = cacheMembro.get(user.id);
  if (guardado && guardado.ate > Date.now()) return guardado.membro;

  let membro: MembroAutenticado | null = null;
  const { data: vinculo, error } = await supabaseAdmin
    .from("equipe")
    .select("restaurante_id, nome, ativo")
    .eq("auth_user_id", user.id)
    .eq("ativo", true)
    .maybeSingle();

  if (!error && vinculo) {
    const { data: restaurante } = await supabaseAdmin
      .from("restaurantes")
      .select("id, slug, nome_restaurante, nome_responsavel, email, whatsapp, created_at")
      .eq("id", vinculo.restaurante_id)
      .maybeSingle();
    if (restaurante) {
      membro = {
        userId: user.id,
        email: user.email ?? null,
        restaurante: { ...restaurante, id: String(restaurante.id) },
        papel: "atendente",
        nomeMembro: vinculo.nome ?? null,
      };
    }
  }

  cacheMembro.set(user.id, { ate: Date.now() + 30_000, membro });
  if (cacheMembro.size > 500) cacheMembro.delete(cacheMembro.keys().next().value as string);
  return membro;
}

/** Dono da plataforma (você), definido em OWNER_USER_ID. */
export async function isDonoDaPlataforma(req: Request) {
  const user = await getUsuarioAutenticado(req);

  return Boolean(
    user &&
      process.env.OWNER_USER_ID &&
      user.id === process.env.OWNER_USER_ID
  );
}

export function naoAutenticado() {
  return NextResponse.json(
    { success: false, error: "Sessão expirada. Entre novamente." },
    { status: 401 }
  );
}

export function acessoNegado() {
  return NextResponse.json(
    { success: false, error: "Acesso negado." },
    { status: 403 }
  );
}

/** Erro genérico para o navegador; o detalhe fica só no log do servidor. */
export function erroInterno(contexto: string, error: unknown) {
  console.error(`[${contexto}]`, error instanceof Error ? error.message : error);

  return NextResponse.json(
    { success: false, error: "Erro interno. Tente novamente." },
    { status: 500 }
  );
}
