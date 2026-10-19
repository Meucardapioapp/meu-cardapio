import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { erroInterno, getDonoAutenticado, naoAutenticado } from "@/lib/server/auth";
import { getRecebedorId } from "@/lib/server/recebedor";
import { PagarmeError, pagarme } from "@/lib/server/pagarme";
import { limitar } from "@/lib/server/rate-limit";
import { SenhaInvalidaError, confirmarSenhaDoDono } from "@/lib/server/confirmar-senha";

const HORAS_TRAVA_APOS_TROCAR_CONTA = 24;

const TAXA_SAQUE = 3.67;

/** Histórico de saques do restaurante logado, sincronizado com a Pagar.me. */
export async function GET(req: NextRequest) {
  try {
    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();

    const recipientId = await getRecebedorId(dono.restaurante.id);

    const { data: saques, error } = await supabaseAdmin
      .from("saques")
      .select("*")
      .eq("restaurante_id", dono.restaurante.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (recipientId && saques?.some((s) => s.pagarme_withdrawal_id)) {
      try {
        const resposta = await pagarme<any>(`/recipients/${recipientId}/transfers`);
        const transferencias: any[] = Array.isArray(resposta) ? resposta : resposta?.data || [];

        for (const saque of saques) {
          const t = transferencias.find((x) => x.id === saque.pagarme_withdrawal_id);

          if (t?.status && t.status !== saque.status) {
            await supabaseAdmin.from("saques").update({ status: t.status }).eq("id", saque.id);
            saque.status = t.status;
          }
        }
      } catch (e) {
        console.error("[saque] sincronização", e);
      }
    }

    return NextResponse.json({ success: true, saques: saques || [] });
  } catch (error) {
    return erroInterno("pagarme/saque GET", error);
  }
}

/** Solicita um saque do saldo disponível para a conta bancária cadastrada. */
export async function POST(req: NextRequest) {
  try {
    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();

    if (!(await limitar(req, "saque", 5, 3600))) {
      return NextResponse.json(
        { success: false, error: "Muitas solicitações de saque. Tente de novo em 1 hora." },
        { status: 429 }
      );
    }

    const { valor, senha } = await req.json();

    if (
      typeof valor !== "number" ||
      !Number.isFinite(valor) ||
      valor < 1 ||
      valor > 1_000_000 ||
      Math.round(valor * 100) !== Math.round(valor * 100 * 1000) / 1000
    ) {
      return NextResponse.json(
        { success: false, error: "Valor inválido para saque" },
        { status: 400 }
      );
    }

    // Sacar exige a senha de novo.
    try {
      await confirmarSenhaDoDono(dono, senha);
    } catch (e) {
      if (e instanceof SenhaInvalidaError) {
        return NextResponse.json({ success: false, error: e.message }, { status: e.status });
      }
      throw e;
    }

    // Conta bancária trocada há pouco: espera 24 h (golpe comum é trocar a conta e sacar na hora).
    const { data: financeiro } = await supabaseAdmin
      .from("restaurantes_financeiro")
      .select("conta_alterada_em")
      .eq("restaurante_id", dono.restaurante.id)
      .maybeSingle();

    const alteradaEm = financeiro?.conta_alterada_em ? new Date(financeiro.conta_alterada_em).getTime() : 0;
    const liberaEm = alteradaEm + HORAS_TRAVA_APOS_TROCAR_CONTA * 3600 * 1000;

    if (alteradaEm && liberaEm > Date.now()) {
      const horas = Math.ceil((liberaEm - Date.now()) / 3600000);
      return NextResponse.json(
        {
          success: false,
          error: `Por segurança, os saques ficam travados por 24 horas depois de trocar a conta bancária. Libera em ${horas}h.`,
        },
        { status: 423 }
      );
    }

    const recipientId = await getRecebedorId(dono.restaurante.id);

    if (!recipientId) {
      return NextResponse.json(
        { success: false, error: "Cadastre seus dados bancários primeiro." },
        { status: 400 }
      );
    }

    let transferencia: any;

    try {
      transferencia = await pagarme<any>("/transfers", {
        method: "POST",
        idempotencyKey: crypto.randomUUID(),
        body: {
          amount: Math.round(valor * 100),
          recipient_id: recipientId,
          metadata: { restaurante_id: dono.restaurante.id },
        },
      });
    } catch (e) {
      if (e instanceof PagarmeError) {
        return NextResponse.json(
          { success: false, error: e.message || "A Pagar.me recusou o saque." },
          { status: 400 }
        );
      }
      throw e;
    }

    const { error } = await supabaseAdmin.from("saques").insert({
      restaurante_id: dono.restaurante.id,
      pagarme_recipient_id: recipientId,
      valor: valor + TAXA_SAQUE,
      taxa: TAXA_SAQUE,
      valor_liquido: valor,
      status: transferencia.status || "pending",
      pagarme_withdrawal_id: transferencia.id,
      created_at: new Date().toISOString(),
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return erroInterno("pagarme/saque POST", error);
  }
}
