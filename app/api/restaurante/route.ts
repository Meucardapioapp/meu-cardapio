import { NextRequest, NextResponse } from "next/server";
import { erroInterno, getEquipeAutenticada, naoAutenticado } from "@/lib/server/auth";
import { dadosBancariosCompletos, getDadosFinanceiros } from "@/lib/server/recebedor";
import { getEstadoAssinatura, iniciarTesteNoPrimeiroAcesso } from "@/lib/server/assinatura";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { TERMOS_VERSAO } from "@/lib/legal";

/** Mostra só o final do dado (ex.: •••456). O dado completo nunca volta ao navegador. */
function mascarar(valor: string | null | undefined, visiveis = 3) {
  const limpo = String(valor ?? "").trim();
  if (!limpo) return null;
  if (limpo.length <= visiveis) return "•".repeat(limpo.length);
  return "•".repeat(Math.min(limpo.length - visiveis, 6)) + limpo.slice(-visiveis);
}

/** Dados do restaurante do dono logado (dados bancários mascarados). */
export async function GET(req: NextRequest) {
  try {
    const dono = await getEquipeAutenticada(req);
    if (!dono) return naoAutenticado();

    // Atendente: só o básico para a tela de pedidos (nada de plano ou banco).
    if (dono.papel === "atendente") {
      let ativo = true;
      try {
        ativo = Boolean((await getEstadoAssinatura(dono.restaurante.id))?.ativo);
      } catch {}
      return NextResponse.json({
        success: true,
        papel: "atendente",
        nomeMembro: dono.nomeMembro,
        restaurante: {
          id: dono.restaurante.id,
          slug: dono.restaurante.slug,
          nome_restaurante: dono.restaurante.nome_restaurante,
        },
        assinatura: null,
        lojaAtiva: ativo,
      });
    }

    const financeiro = await getDadosFinanceiros(dono.restaurante.id);

    let assinatura = null;
    try {
      assinatura = await getEstadoAssinatura(dono.restaurante.id);
      // Teste grátis conta a partir do primeiro acesso do dono ao painel.
      if (await iniciarTesteNoPrimeiroAcesso(dono.restaurante.id)) {
        assinatura = await getEstadoAssinatura(dono.restaurante.id);
      }
    } catch (e) {
      console.error("[api/restaurante] assinatura", e);
    }

    // Termos atualizados: o dono aceita de novo (uma vez por versão).
    const { data: aceite } = await supabaseAdmin
      .from("restaurantes")
      .select("termos_aceitos_em")
      .eq("id", dono.restaurante.id)
      .maybeSingle();
    const aceitoEm = aceite?.termos_aceitos_em ? new Date(aceite.termos_aceitos_em).getTime() : 0;
    const termosPendentes = aceitoEm < new Date(`${TERMOS_VERSAO}T00:00:00-03:00`).getTime();

    return NextResponse.json({
      success: true,
      papel: "dono",
      termosPendentes,
      restaurante: {
        id: dono.restaurante.id,
        slug: dono.restaurante.slug,
        nome_restaurante: dono.restaurante.nome_restaurante,
        nome_responsavel: dono.restaurante.nome_responsavel,
        email: dono.restaurante.email,
        whatsapp: dono.restaurante.whatsapp,
        criado_em: dono.restaurante.created_at,
        cpf_cnpj: mascarar(financeiro?.cpf_cnpj, 2),
        banco: financeiro?.banco ?? null,
        agencia: mascarar(financeiro?.agencia, 2),
        conta: mascarar(financeiro?.conta, 3),
        tipo_conta: financeiro?.tipo_conta ?? null,
        pix_online_ativo: Boolean(financeiro?.pagarme_recipient_id),
        dados_bancarios_ok: dadosBancariosCompletos(financeiro),
      },
      assinatura,
    });
  } catch (error) {
    return erroInterno("api/restaurante", error);
  }
}
