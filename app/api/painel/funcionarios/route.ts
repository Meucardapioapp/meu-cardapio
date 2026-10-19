import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { erroInterno, getDonoAutenticado, getEquipeAutenticada, naoAutenticado } from "@/lib/server/auth";
import { limitar } from "@/lib/server/rate-limit";
import { FUNCOES, gerarPin, hashPin, normalizarTelefone, type Funcao } from "@/lib/server/funcionario";
import { getConfigSalao } from "@/lib/server/salao";

/**
 * Equipe com acesso pelo celular: garçons, cozinha e motoboys.
 * O dono gerencia; o atendente do painel só vê a lista (para mandar pedidos ao motoboy).
 */

const MAX_FUNCIONARIOS = 60;

const muitas = () =>
  NextResponse.json({ success: false, error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });

const semTabela = (error: any) => ["42P01", "PGRST205", "42703", "PGRST204"].includes(error?.code);

export async function GET(req: NextRequest) {
  try {
    const equipe = await getEquipeAutenticada(req);
    if (!equipe) return naoAutenticado();
    const r = equipe.restaurante.id;

    const funcao = req.nextUrl.searchParams.get("funcao");
    let consulta = supabaseAdmin
      .from("funcionarios")
      .select("id, nome, telefone, funcao, setor, ativo, ultimo_acesso, created_at")
      .eq("restaurante_id", r)
      .order("nome", { ascending: true });
    if (funcao && FUNCOES.includes(funcao as Funcao)) consulta = consulta.eq("funcao", funcao);

    const { data, error } = await consulta;
    if (error) return NextResponse.json({ success: true, funcionarios: [], motoboys: [], indisponivel: true });

    const desdeParam = req.nextUrl.searchParams.get("desde");
    const desde = desdeParam && !isNaN(Date.parse(desdeParam)) ? new Date(desdeParam) : new Date(Date.now() - 24 * 3600 * 1000);
    const desdeIso = desde.toISOString();
    const umDia = new Date(Math.min(desde.getTime(), Date.now() - 24 * 3600 * 1000)).toISOString();

    const [{ data: pedidos }, { data: comandas }, { data: prontos }, config] = await Promise.all([
      supabaseAdmin
        .from("pedidos")
        .select("motoboy_id, status, taxa_entrega, entregue_em")
        .eq("restaurante_id", r)
        .not("motoboy_id", "is", null)
        .gte("motoboy_enviado_em", umDia)
        .limit(5000),
      supabaseAdmin
        .from("comandas")
        .select("garcom_id, status, taxa_valor, taxa_servico, total")
        .eq("restaurante_id", r)
        .not("garcom_id", "is", null)
        .or(`status.eq.aberta,fechada_em.gte."${desdeIso}"`)
        .limit(5000),
      supabaseAdmin
        .from("comanda_itens")
        .select("pronto_por_id, quantidade")
        .eq("restaurante_id", r)
        .not("pronto_por_id", "is", null)
        .gte("pronto_em", desdeIso)
        .limit(20000),
      getConfigSalao(r).catch(() => ({ setores: ["Cozinha", "Churrasqueira", "Bar"] })),
    ]);

    const resumo = (f: any) => {
      if (f.funcao === "garcom") {
        const minhas = (comandas ?? []).filter((c) => c.garcom_id === f.id);
        const fechadas = minhas.filter((c) => c.status === "fechada");
        return {
          abertas: minhas.filter((c) => c.status === "aberta").length,
          mesas: fechadas.length,
          comDez: fechadas.filter((c) => c.taxa_servico && Number(c.taxa_valor) > 0).length,
          dez: fechadas.reduce((s, c) => s + Number(c.taxa_valor || 0), 0),
          vendido: fechadas.reduce((s, c) => s + Number(c.total || 0), 0),
        };
      }
      if (f.funcao === "cozinha") {
        return { itens: (prontos ?? []).filter((i) => i.pronto_por_id === f.id).reduce((s, i) => s + Number(i.quantidade), 0) };
      }
      const r2 = { entregas: 0, taxas: 0, emRota: 0 };
      for (const p of (pedidos ?? []).filter((p) => p.motoboy_id === f.id)) {
        if (p.status === "concluido" && p.entregue_em && new Date(p.entregue_em) >= desde) {
          r2.entregas += 1;
          r2.taxas += Number(p.taxa_entrega || 0);
        } else if (!["concluido", "recusado", "cancelado"].includes(p.status)) {
          r2.emRota += 1;
        }
      }
      return r2;
    };

    const dono = equipe.papel === "dono";
    const funcionarios = (data ?? []).map((f) => ({
      id: f.id,
      nome: f.nome,
      telefone: f.telefone,
      funcao: f.funcao,
      setor: f.setor,
      ativo: f.ativo,
      ultimo_acesso: dono ? f.ultimo_acesso : null,
      resumo: resumo(f),
    }));

    return NextResponse.json({
      success: true,
      setores: config.setores,
      funcionarios,
      // Nome antigo (tela de Pedidos)
      motoboys: funcionarios.filter((f) => f.funcao === "motoboy"),
    });
  } catch (error) {
    return erroInterno("painel/funcionarios GET", error);
  }
}

function dadosValidos(body: any, parcial = false) {
  const saida: Record<string, unknown> = {};
  if (!parcial || body?.nome !== undefined) {
    const nome = String(body?.nome ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
    if (nome.length < 2) return { erro: "Digite o nome." };
    saida.nome = nome;
  }
  if (!parcial || body?.telefone !== undefined) {
    const telefone = normalizarTelefone(body?.telefone);
    if (!telefone) return { erro: "Digite o celular com DDD. Ex.: (65) 99999-9999" };
    saida.telefone = telefone;
  }
  if (!parcial || body?.funcao !== undefined) {
    const funcao = String(body?.funcao ?? "");
    if (!FUNCOES.includes(funcao as Funcao)) return { erro: "Escolha a função: garçom, cozinha ou motoboy." };
    saida.funcao = funcao;
  }
  // Setor só vale para a cozinha ("Todos" = vê tudo).
  if (saida.funcao !== undefined || body?.setor !== undefined) {
    const funcao = (saida.funcao ?? body?.funcaoAtual) as string;
    saida.setor = funcao === "cozinha" ? String(body?.setor ?? "").trim().slice(0, 24) || "Todos" : null;
  }
  return { dados: saida };
}

function erroBanco(error: any) {
  if (error?.code === "23505") {
    return NextResponse.json({ success: false, error: "Esse celular já está cadastrado na equipe." }, { status: 400 });
  }
  if (semTabela(error)) {
    return NextResponse.json({ success: false, error: "Rode o SQL 15 no Supabase para ativar a equipe." }, { status: 400 });
  }
  return null;
}

/** Cadastra e devolve o PIN UMA vez. */
export async function POST(req: NextRequest) {
  try {
    if (!(await limitar(req, "painel-funcionarios", 30, 60))) return muitas();
    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();

    const v = dadosValidos(await req.json().catch(() => ({})));
    if ("erro" in v) return NextResponse.json({ success: false, error: v.erro }, { status: 400 });

    const { count } = await supabaseAdmin
      .from("funcionarios")
      .select("id", { count: "exact", head: true })
      .eq("restaurante_id", dono.restaurante.id);
    if ((count ?? 0) >= MAX_FUNCIONARIOS) {
      return NextResponse.json({ success: false, error: `Limite de ${MAX_FUNCIONARIOS} pessoas na equipe.` }, { status: 400 });
    }

    const id = randomUUID();
    const pin = gerarPin();
    const { data, error } = await supabaseAdmin
      .from("funcionarios")
      .insert({ id, restaurante_id: dono.restaurante.id, ...v.dados, pin_hash: hashPin(id, pin) })
      .select("id, nome, telefone, funcao, setor, ativo, ultimo_acesso")
      .single();

    if (error) return erroBanco(error) ?? Promise.reject(error);
    return NextResponse.json({ success: true, funcionario: { ...data, resumo: {} }, motoboy: { ...data, resumo: { entregas: 0, taxas: 0, emRota: 0 } }, pin });
  } catch (error) {
    return erroInterno("painel/funcionarios POST", error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!(await limitar(req, "painel-funcionarios", 30, 60))) return muitas();
    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();

    const body = await req.json().catch(() => ({}));
    const id = String(body?.id ?? "");
    const { data: atual } = await supabaseAdmin
      .from("funcionarios")
      .select("id, sessao_versao, funcao")
      .eq("id", id)
      .eq("restaurante_id", dono.restaurante.id)
      .maybeSingle();
    if (!atual) return NextResponse.json({ success: false, error: "Pessoa não encontrada." }, { status: 404 });

    // PIN novo: o celular antigo é desconectado.
    if (body?.acao === "novo-pin") {
      const pin = gerarPin();
      const { error } = await supabaseAdmin
        .from("funcionarios")
        .update({ pin_hash: hashPin(id, pin), sessao_versao: atual.sessao_versao + 1 })
        .eq("id", id);
      if (error) throw error;
      return NextResponse.json({ success: true, pin });
    }

    if (typeof body?.ativo === "boolean") {
      const { error } = await supabaseAdmin
        .from("funcionarios")
        .update({ ativo: body.ativo, sessao_versao: atual.sessao_versao + 1 })
        .eq("id", id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    const v = dadosValidos({ ...body, funcaoAtual: atual.funcao }, true);
    if ("erro" in v) return NextResponse.json({ success: false, error: v.erro }, { status: 400 });
    const { error } = await supabaseAdmin.from("funcionarios").update(v.dados).eq("id", id);
    if (error) return erroBanco(error) ?? Promise.reject(error);
    return NextResponse.json({ success: true });
  } catch (error) {
    return erroInterno("painel/funcionarios PATCH", error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!(await limitar(req, "painel-funcionarios", 30, 60))) return muitas();
    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();

    const body = await req.json().catch(() => ({}));
    const { error } = await supabaseAdmin
      .from("funcionarios")
      .delete()
      .eq("id", String(body?.id ?? ""))
      .eq("restaurante_id", dono.restaurante.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return erroInterno("painel/funcionarios DELETE", error);
  }
}
