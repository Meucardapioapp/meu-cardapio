import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { erroInterno, getEquipeAutenticada, naoAutenticado } from "@/lib/server/auth";
import { getOperacao } from "@/lib/server/operacao";
import { limitar } from "@/lib/server/rate-limit";
import { mensagemDeErroBanco } from "@/lib/server/erros";
import { agoraNoFuso, lojaAbertaAgora } from "@/lib/horario";

async function estado(restauranteId: string) {
  const [operacao, { data: aparencia }, { data: rest }] = await Promise.all([
    getOperacao(restauranteId),
    supabaseAdmin.from("aparencia").select("*").eq("restaurante_id", restauranteId).limit(1).maybeSingle(),
    supabaseAdmin.from("restaurantes").select("uf").eq("id", restauranteId).maybeSingle(),
  ]);

  const temHorario = Boolean(
    aparencia && Object.keys(aparencia).some((k) => k.startsWith("horario_") && aparencia[k])
  );

  return {
    operacao,
    temHorario,
    abertoPeloHorario: lojaAbertaAgora(aparencia, agoraNoFuso(rest?.uf)),
  };
}

/** Pausa de pedidos, tempos e se a loja está aberta pelo horário. */
export async function GET(req: NextRequest) {
  try {
    const dono = await getEquipeAutenticada(req);
    if (!dono) return naoAutenticado();
    return NextResponse.json({ success: true, ...(await estado(dono.restaurante.id)) });
  } catch (error) {
    return erroInterno("painel/operacao GET", error);
  }
}

const esquema = z.union([
  z.object({ acao: z.literal("pausar"), minutos: z.number().int().min(5).max(24 * 60).nullable() }),
  z.object({ acao: z.literal("retomar") }),
  z.object({
    acao: z.literal("tempos"),
    entregaMin: z.number().int().min(0).max(600).nullable(),
    entregaMax: z.number().int().min(0).max(600).nullable(),
    retirada: z.number().int().min(0).max(600).nullable(),
  }),
]);

export async function PUT(req: NextRequest) {
  try {
    if (!(await limitar(req, "painel-escrita", 60, 60))) {
      return NextResponse.json({ success: false, error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });
    }

    const dono = await getEquipeAutenticada(req);
    if (!dono) return naoAutenticado();

    const validacao = esquema.safeParse(await req.json().catch(() => null));
    if (!validacao.success) {
      return NextResponse.json({ success: false, error: "Dados inválidos." }, { status: 400 });
    }

    const d = validacao.data;
    const dados: Record<string, unknown> = { restaurante_id: dono.restaurante.id, updated_at: new Date().toISOString() };

    if (d.acao === "pausar") {
      dados.pausa_indefinida = d.minutos == null;
      dados.pausado_ate = d.minutos == null ? null : new Date(Date.now() + d.minutos * 60000).toISOString();
    } else if (d.acao === "retomar") {
      dados.pausa_indefinida = false;
      dados.pausado_ate = null;
    } else {
      const min = d.entregaMin, max = d.entregaMax;
      dados.tempo_entrega_min = min != null && max != null ? Math.min(min, max) : min;
      dados.tempo_entrega_max = min != null && max != null ? Math.max(min, max) : max;
      dados.tempo_retirada = d.retirada;
    }

    const { error } = await supabaseAdmin.from("restaurante_operacao").upsert(dados, { onConflict: "restaurante_id" });

    if (error) {
      const { status, mensagem } = mensagemDeErroBanco(error, "Não foi possível salvar.");
      return NextResponse.json({ success: false, error: mensagem }, { status });
    }

    return NextResponse.json({ success: true, ...(await estado(dono.restaurante.id)) });
  } catch (error) {
    return erroInterno("painel/operacao PUT", error);
  }
}
