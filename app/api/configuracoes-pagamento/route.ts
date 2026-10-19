import { limitar } from "@/lib/server/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getRecebedorId } from "@/lib/server/recebedor";
import { restaurantePodeReceberPedidos } from "@/lib/server/assinatura";
import { getOperacao } from "@/lib/server/operacao";
import { pixChaveAtivo } from "@/lib/server/pixChave";

/**
 * Formas de pagamento aceitas pelo restaurante (público, usado no checkout).
 * Também informa se o restaurante está recebendo pedidos online (plano ativo).
 */
export async function GET(req: NextRequest) {
    if (!(await limitar(req, "config-pagamento", 120, 60))) {
      return NextResponse.json({ success: false, error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });
    }

  const restauranteId = req.nextUrl.searchParams.get("restauranteId");

  if (!restauranteId) {
    return NextResponse.json({ error: "Restaurante não informado" }, { status: 400 });
  }

  try {
    const [{ data }, recebedor, planoAtivo, operacao, pixChave] = await Promise.all([
      supabaseAdmin
        .from("configuracoes_pagamento")
        .select("dinheiro, cartao_entrega")
        .eq("restaurante_id", restauranteId)
        .maybeSingle(),
      getRecebedorId(restauranteId).catch(() => null),
      restaurantePodeReceberPedidos(restauranteId),
      getOperacao(restauranteId),
      pixChaveAtivo(restauranteId).catch(() => false),
    ]);
    const pedidosAtivos = planoAtivo && !operacao.pausado;

    return NextResponse.json({
      // Sem configuração salva: aceita dinheiro e cartão na entrega.
      dinheiro: data ? Boolean(data.dinheiro) : true,
      cartao_entrega: data ? Boolean(data.cartao_entrega) : true,
      pix_online: Boolean(recebedor),
      pix_chave: pixChave,
      pedidos_ativos: pedidosAtivos,
      pausado: operacao.pausado,
      tempo_entrega_min: operacao.tempoEntregaMin,
      tempo_entrega_max: operacao.tempoEntregaMax,
      tempo_retirada: operacao.tempoRetirada,
    });
  } catch (error) {
    console.error("[configuracoes-pagamento]", error);

    return NextResponse.json({
      dinheiro: false,
      cartao_entrega: false,
      pix_online: false,
      pedidos_ativos: true,
    });
  }
}
