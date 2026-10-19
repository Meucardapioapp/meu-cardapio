import { limitar } from "@/lib/server/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { erroInterno, getDonoAutenticado, naoAutenticado } from "@/lib/server/auth";
import { mensagemDeErroBanco } from "@/lib/server/erros";
import { normalizarCodigoCupom } from "@/lib/fidelidade";

/** Cupons do restaurante logado, com quantas pessoas usaram cada um. */
export async function GET(req: NextRequest) {
  try {
    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();

    const { data: cupons, error } = await supabaseAdmin
      .from("cupons")
      .select("*")
      .eq("restaurante_id", dono.restaurante.id)
      .order("created_at", { ascending: false });

    if (error) {
      const { status, mensagem } = mensagemDeErroBanco(error, "Não foi possível carregar os cupons.");
      return NextResponse.json({ success: false, error: mensagem }, { status });
    }

    const { data: pedidos } = await supabaseAdmin
      .from("pedidos")
      .select("cupom_id, cliente_id, telefone, total, desconto_cupom")
      .eq("restaurante_id", dono.restaurante.id)
      .eq("contabilizado", true)
      .not("cupom_id", "is", null)
      .limit(20000);

    const stats = new Map<string, { pedidos: number; pessoas: Set<string>; vendido: number; desconto: number }>();

    for (const p of pedidos ?? []) {
      const id = String(p.cupom_id);
      if (!stats.has(id)) stats.set(id, { pedidos: 0, pessoas: new Set(), vendido: 0, desconto: 0 });
      const s = stats.get(id)!;
      s.pedidos += 1;
      s.pessoas.add(String(p.cliente_id ?? String(p.telefone ?? "").replace(/\D/g, "")));
      s.vendido += Number(p.total || 0);
      s.desconto += Number(p.desconto_cupom || 0);
    }

    return NextResponse.json({
      success: true,
      cupons: (cupons ?? []).map((c) => {
        const s = stats.get(String(c.id));
        return {
          ...c,
          valor: Number(c.valor),
          pedido_minimo: Number(c.pedido_minimo || 0),
          pedidos: s?.pedidos ?? 0,
          pessoas: s?.pessoas.size ?? 0,
          vendido: Math.round((s?.vendido ?? 0) * 100) / 100,
          descontoDado: Math.round((s?.desconto ?? 0) * 100) / 100,
        };
      }),
    });
  } catch (error) {
    return erroInterno("painel/cupons GET", error);
  }
}

const esquemaCupom = z
  .object({
    codigo: z.string(),
    tipo: z.enum(["percentual", "valor"]),
    valor: z.number().positive().max(10000),
    pedidoMinimo: z.number().min(0).max(100000).optional().default(0),
    limiteUsos: z.number().int().positive().max(1000000).nullable().optional().default(null),
    usoUnicoPorCliente: z.boolean().optional().default(false),
    validoAte: z.string().nullable().optional().default(null),
    ativo: z.boolean().optional().default(true),
  })
  .refine((d) => d.tipo !== "percentual" || d.valor <= 100, {
    message: "A porcentagem vai de 1 a 100.",
  });

function paraBanco(d: z.infer<typeof esquemaCupom>) {
  let validoAte: string | null = null;
  if (d.validoAte) {
    // Data escolhida (AAAA-MM-DD): vale até o fim do dia, horário de Brasília.
    const data = /^\d{4}-\d{2}-\d{2}$/.test(d.validoAte)
      ? new Date(`${d.validoAte}T23:59:59-03:00`)
      : new Date(d.validoAte);
    if (!Number.isNaN(data.getTime())) validoAte = data.toISOString();
  }

  return {
    codigo: normalizarCodigoCupom(d.codigo),
    tipo: d.tipo,
    valor: Math.round(d.valor * 100) / 100,
    pedido_minimo: Math.round((d.pedidoMinimo ?? 0) * 100) / 100,
    limite_usos: d.limiteUsos ?? null,
    uso_unico_por_cliente: Boolean(d.usoUnicoPorCliente),
    valido_ate: validoAte,
    ativo: d.ativo !== false,
    updated_at: new Date().toISOString(),
  };
}

function respostaErro(error: any) {
  if (error?.code === "23505") {
    return NextResponse.json({ success: false, error: "Você já tem um cupom com esse código." }, { status: 400 });
  }
  const { status, mensagem } = mensagemDeErroBanco(error, "Não foi possível salvar o cupom.");
  return NextResponse.json({ success: false, error: mensagem }, { status });
}

/** Cria um cupom. */
export async function POST(req: NextRequest) {
  try {
    if (!(await limitar(req, "painel-escrita", 60, 60))) {
      return NextResponse.json({ success: false, error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });
    }

    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();

    const validacao = esquemaCupom.safeParse(await req.json().catch(() => null));
    if (!validacao.success) {
      return NextResponse.json(
        { success: false, error: validacao.error.issues[0]?.message || "Dados inválidos." },
        { status: 400 }
      );
    }

    const dados = paraBanco(validacao.data);
    if (dados.codigo.length < 3) {
      return NextResponse.json(
        { success: false, error: "O código precisa ter de 3 a 30 letras ou números, sem espaço." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("cupons")
      .insert({ ...dados, restaurante_id: dono.restaurante.id })
      .select("*")
      .single();

    if (error) return respostaErro(error);

    return NextResponse.json({ success: true, cupom: data });
  } catch (error) {
    return erroInterno("painel/cupons POST", error);
  }
}

/** Edita um cupom (ou só liga/desliga, enviando { id, ativo }). */
export async function PATCH(req: NextRequest) {
  try {
    if (!(await limitar(req, "painel-escrita", 60, 60))) {
      return NextResponse.json({ success: false, error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });
    }

    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();

    const body = await req.json().catch(() => null);
    const id = String(body?.id ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ success: false, error: "Cupom inválido." }, { status: 400 });
    }

    let dados: Record<string, unknown>;

    if (Object.keys(body).length === 2 && typeof body.ativo === "boolean") {
      dados = { ativo: body.ativo, updated_at: new Date().toISOString() };
    } else {
      const validacao = esquemaCupom.safeParse(body);
      if (!validacao.success) {
        return NextResponse.json(
          { success: false, error: validacao.error.issues[0]?.message || "Dados inválidos." },
          { status: 400 }
        );
      }
      dados = paraBanco(validacao.data);
      if (String(dados.codigo).length < 3) {
        return NextResponse.json(
          { success: false, error: "O código precisa ter de 3 a 30 letras ou números, sem espaço." },
          { status: 400 }
        );
      }
    }

    const { data, error } = await supabaseAdmin
      .from("cupons")
      .update(dados)
      .eq("id", id)
      .eq("restaurante_id", dono.restaurante.id)
      .select("*")
      .maybeSingle();

    if (error) return respostaErro(error);
    if (!data) {
      return NextResponse.json({ success: false, error: "Cupom não encontrado." }, { status: 404 });
    }

    return NextResponse.json({ success: true, cupom: data });
  } catch (error) {
    return erroInterno("painel/cupons PATCH", error);
  }
}

/** Apaga um cupom (os pedidos que usaram continuam com o código salvo). */
export async function DELETE(req: NextRequest) {
  try {
    if (!(await limitar(req, "painel-escrita", 60, 60))) {
      return NextResponse.json({ success: false, error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });
    }

    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();

    const id = String(req.nextUrl.searchParams.get("id") ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ success: false, error: "Cupom inválido." }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("cupons")
      .delete()
      .eq("id", id)
      .eq("restaurante_id", dono.restaurante.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return erroInterno("painel/cupons DELETE", error);
  }
}
