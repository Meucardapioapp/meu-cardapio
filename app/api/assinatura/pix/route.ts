import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { erroInterno, getDonoAutenticado, naoAutenticado } from "@/lib/server/auth";
import { PagarmeError, pagarme, telefoneParaPagarme } from "@/lib/server/pagarme";
import { limitar } from "@/lib/server/rate-limit";
import { validarCpfOuCnpj } from "@/lib/validacoes";
import { PLANOS, type PlanoId } from "@/lib/planos";

/** Paga 1 mês do plano por Pix, sem recorrência. */
export async function POST(req: NextRequest) {
  try {
    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();

    if (!await limitar(req, "assinatura-pix", 10, 600)) {
      return NextResponse.json(
        { success: false, error: "Muitas tentativas. Aguarde alguns minutos." },
        { status: 429 }
      );
    }

    const { plano, documento, nome } = await req.json();
    // Só existe o plano mensal (o anual foi retirado).
    void plano;
    const planoId: PlanoId = "mensal";
    const doc = String(documento ?? "").replace(/\D/g, "");

    if (!validarCpfOuCnpj(doc)) {
      return NextResponse.json({ success: false, error: "CPF ou CNPJ inválido." }, { status: 400 });
    }

    const valor = Math.round(PLANOS[planoId].preco * 100);

    let order: any;

    try {
      order = await pagarme<any>("/orders", {
        method: "POST",
        idempotencyKey: `plano-pix-${dono.restaurante.id}-${planoId}-${Date.now()}`,
        body: {
          code: `plano-${planoId}-${dono.restaurante.id}`.slice(0, 52),
          customer: {
            name: String(nome || dono.restaurante.nome_responsavel || dono.restaurante.nome_restaurante || "").slice(0, 64),
            email: dono.email || dono.restaurante.email,
            type: doc.length === 11 ? "individual" : "company",
            document: doc,
            ...(dono.restaurante.whatsapp
              ? { phones: telefoneParaPagarme(dono.restaurante.whatsapp) }
              : {}),
          },
          items: [
            {
              amount: valor,
              description: `MeuCardapioApp ${PLANOS[planoId].nome}`,
              quantity: 1,
              code: `plano-${planoId}`,
            },
          ],
          payments: [{ payment_method: "pix", pix: { expires_in: 86400 } }],
          metadata: {
            tipo: "assinatura",
            restaurante_id: dono.restaurante.id,
            plano: planoId,
          },
        },
      });
    } catch (e) {
      if (e instanceof PagarmeError) {
        return NextResponse.json(
          { success: false, error: "Não foi possível gerar o Pix. Confira o CPF/CNPJ." },
          { status: 400 }
        );
      }
      throw e;
    }

    const { error } = await supabaseAdmin.from("pagamentos_assinatura").insert({
      restaurante_id: dono.restaurante.id,
      pagarme_order_id: order.id,
      plano: planoId,
      metodo: "pix",
      valor: valor / 100,
      status: "pending",
    });

    if (error) throw error;

    const transacao = order?.charges?.[0]?.last_transaction;

    return NextResponse.json({
      success: true,
      orderId: order.id,
      qrCode: transacao?.qr_code,
      qrCodeUrl: transacao?.qr_code_url,
      expiresAt: transacao?.expires_at,
    });
  } catch (error) {
    return erroInterno("assinatura/pix", error);
  }
}
