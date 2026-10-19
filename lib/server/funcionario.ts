import "server-only";

import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Acesso da equipe pelo celular (garçom, cozinha e motoboy):
 * celular + PIN de 4 números criado pelo restaurante.
 * A sessão fica num cookie assinado pelo servidor. Gerar um PIN novo ou
 * bloquear o funcionário derruba a sessão na hora.
 */

export type Funcao = "garcom" | "cozinha" | "motoboy";
export const FUNCOES: Funcao[] = ["garcom", "cozinha", "motoboy"];
export const NOME_FUNCAO: Record<Funcao, string> = { garcom: "Garçom", cozinha: "Cozinha", motoboy: "Motoboy" };
export const PAGINA_FUNCAO: Record<Funcao, string> = { garcom: "/garcom", cozinha: "/cozinha", motoboy: "/entregador" };

export const COOKIE_EQUIPE = "eq_sessao";
const DIAS_SESSAO = 60;

function segredo(uso: string) {
  const base = process.env.DADOS_CRIPTO_CHAVE || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base) throw new Error("Falta DADOS_CRIPTO_CHAVE");
  // "motoboy:" mantém válidos os PINs criados antes (SQL 14).
  return createHmac("sha256", base).update(`motoboy:${uso}`).digest();
}

/** Só números, sem o 55 do Brasil: (11) 91234-5678 → 11912345678 */
export function normalizarTelefone(valor: unknown) {
  let d = String(valor ?? "").replace(/\D/g, "");
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
  return /^\d{10,11}$/.test(d) ? d : "";
}

/** PIN de 4 números, sem sequências óbvias (1234, 1111...). */
export function gerarPin(): string {
  for (;;) {
    const pin = String(randomInt(0, 10000)).padStart(4, "0");
    if (/^(\d)\1{3}$/.test(pin)) continue;
    if ("0123456789012".includes(pin) || "9876543210987".includes(pin)) continue;
    return pin;
  }
}

/** O PIN é guardado embaralhado com uma chave que só o servidor tem. */
export function hashPin(funcionarioId: string, pin: string) {
  return "h1:" + createHmac("sha256", segredo("pin")).update(`${funcionarioId}:${pin}`).digest("base64url");
}

export function pinConfere(funcionarioId: string, pin: string, hash: string) {
  const a = Buffer.from(hashPin(funcionarioId, pin));
  const b = Buffer.from(String(hash || ""));
  return a.length === b.length && timingSafeEqual(a, b);
}

type Sessao = { m: { id: string; v: number }[]; exp: number };

function assinar(dados: string) {
  return createHmac("sha256", segredo("sessao")).update(dados).digest("base64url");
}

export function gravarSessao(res: NextResponse, funcionarios: { id: string; sessao_versao: number }[]) {
  const sessao: Sessao = {
    m: funcionarios.slice(0, 10).map((x) => ({ id: x.id, v: x.sessao_versao })),
    exp: Date.now() + DIAS_SESSAO * 86400000,
  };
  const dados = Buffer.from(JSON.stringify(sessao)).toString("base64url");
  res.cookies.set(COOKIE_EQUIPE, `${dados}.${assinar(dados)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DIAS_SESSAO * 86400,
  });
}

export function apagarSessao(res: NextResponse) {
  res.cookies.set(COOKIE_EQUIPE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

function lerSessao(req: NextRequest): Sessao | null {
  const valor = req.cookies.get(COOKIE_EQUIPE)?.value || "";
  const [dados, assinatura] = valor.split(".");
  if (!dados || !assinatura) return null;

  const esperado = Buffer.from(assinar(dados));
  const recebido = Buffer.from(assinatura);
  if (esperado.length !== recebido.length || !timingSafeEqual(esperado, recebido)) return null;

  try {
    const s = JSON.parse(Buffer.from(dados, "base64url").toString("utf8")) as Sessao;
    if (!Array.isArray(s?.m) || !s.m.length || !(s.exp > Date.now())) return null;
    return s;
  } catch {
    return null;
  }
}

export type FuncionarioLogado = {
  id: string;
  nome: string;
  telefone: string;
  funcao: Funcao;
  setor: string | null;
  restaurante_id: string;
  restaurante_nome: string;
};

/** Cadastros válidos da sessão (a pessoa pode trabalhar em mais de um restaurante). */
/** Pedido que muda dados vindo de outro site (CSRF): recusa. */
function origemEstranha(req: NextRequest) {
  if (req.method === "GET" || req.method === "HEAD") return false;
  const origem = req.headers.get("origin");
  if (!origem) return false;
  try {
    return new URL(origem).host !== (req.headers.get("x-forwarded-host") || req.headers.get("host"));
  } catch {
    return true;
  }
}

export async function getFuncionariosLogados(req: NextRequest): Promise<FuncionarioLogado[] | null> {
  if (origemEstranha(req)) return null;
  const sessao = lerSessao(req);
  if (!sessao) return null;

  const { data, error } = await supabaseAdmin
    .from("funcionarios")
    .select("id, nome, telefone, funcao, setor, restaurante_id, ativo, sessao_versao, restaurantes(nome_restaurante)")
    .in("id", sessao.m.map((x) => x.id));

  if (error || !data) return null;

  const validos = data.filter((row: any) => {
    const naSessao = sessao.m.find((x) => x.id === row.id);
    return row.ativo && naSessao && naSessao.v === row.sessao_versao;
  });

  if (!validos.length) return null;

  return validos.map((row: any) => ({
    id: String(row.id),
    nome: row.nome,
    telefone: row.telefone,
    funcao: (FUNCOES.includes(row.funcao) ? row.funcao : "motoboy") as Funcao,
    setor: row.setor ?? null,
    restaurante_id: String(row.restaurante_id),
    restaurante_nome: (Array.isArray(row.restaurantes) ? row.restaurantes[0] : row.restaurantes)?.nome_restaurante || "",
  }));
}

/**
 * O cadastro da sessão para uma função. Se a pessoa for garçom em dois
 * restaurantes, o app manda qual está usando no cabeçalho "x-funcionario".
 */
export async function getFuncionario(req: NextRequest, funcao: Funcao): Promise<FuncionarioLogado | null> {
  const todos = await getFuncionariosLogados(req);
  const daFuncao = (todos ?? []).filter((f) => f.funcao === funcao);
  if (!daFuncao.length) return null;
  const escolhido = req.headers.get("x-funcionario");
  return daFuncao.find((f) => f.id === escolhido) ?? daFuncao[0];
}
