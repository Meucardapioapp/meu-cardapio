import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { erroInterno, getDonoAutenticado, naoAutenticado } from "@/lib/server/auth";
import { cancelarAssinaturaPagarme, getLinhaAssinatura } from "@/lib/server/assinatura";
import { SenhaInvalidaError, confirmarSenhaDoDono } from "@/lib/server/confirmar-senha";
import { limitar } from "@/lib/server/rate-limit";

const esquema = z.object({
  motivo: z.string().trim().min(1).max(80),
  melhorar: z.string().trim().max(1000).optional().default(""),
  senha: z.string().max(200),
});

/**
 * Cancela o plano: pede a senha, encerra a cobrança automática na Pagar.me
 * (confere lá que ficou cancelada, sem faturas pendentes) e guarda o motivo.
 * O tempo já pago continua valendo até o fim do período.
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await limitar(req, "assinatura-cancelar", 5, 600))) {
      return NextResponse.json({ success: false, error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });
    }

    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();

    const validacao = esquema.safeParse(await req.json().catch(() => null));
    if (!validacao.success) {
      return NextResponse.json({ success: false, error: "Escolha o motivo e digite sua senha." }, { status: 400 });
    }
    const { motivo, melhorar, senha } = validacao.data;

    try {
      await confirmarSenhaDoDono(dono, senha);
    } catch (e) {
      if (e instanceof SenhaInvalidaError) {
        return NextResponse.json({ success: false, error: e.message }, { status: e.status });
      }
      throw e;
    }

    const atual = await getLinhaAssinatura(dono.restaurante.id);
    const tinhaCobranca = Boolean(atual.pagarme_subscription_id) && atual.metodo === "cartao";

    // 1. Pagar.me primeiro: se não confirmar, nada muda aqui.
    if (atual.pagarme_subscription_id) {
      try {
        await cancelarAssinaturaPagarme(atual.pagarme_subscription_id);
      } catch (e) {
        console.error("[assinatura/cancelar] pagarme", e);
        return NextResponse.json(
          {
            success: false,
            error: "Não conseguimos confirmar o cancelamento com a Pagar.me agora. Nada foi alterado: tente de novo em alguns minutos.",
          },
          { status: 502 }
        );
      }
    }

    // 2. Marca como cancelada (o acesso pago continua até acesso_ate)
    const { error } = await supabaseAdmin
      .from("assinaturas")
      .update({ status: "cancelada", updated_at: new Date().toISOString() })
      .eq("restaurante_id", dono.restaurante.id);
    if (error) throw error;

    // 3. Motivo e sugestão (se a tabela do SQL 10 ainda não existir, só registra no log)
    const { error: erroMotivo } = await supabaseAdmin.from("cancelamentos").insert({
      restaurante_id: dono.restaurante.id,
      motivo,
      melhorar: melhorar || null,
      metodo: atual.metodo,
      tinha_cobranca_automatica: tinhaCobranca,
      pagarme_subscription_id: atual.pagarme_subscription_id,
      acesso_ate: atual.acesso_ate,
    });
    if (erroMotivo) console.error("[assinatura/cancelar] motivo", erroMotivo.message, { motivo, melhorar });

    return NextResponse.json({ success: true, acessoAte: atual.acesso_ate, tinhaCobranca });
  } catch (error) {
    return erroInterno("assinatura/cancelar", error);
  }
}
