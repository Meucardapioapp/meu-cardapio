import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  COMISSAO_PIX_PERCENTUAL,
  PagarmeError,
  centavos,
  pagarme,
  recebedorPlataforma,
  telefoneParaPagarme,
} from "@/lib/server/pagarme";
import { getRecebedorId } from "@/lib/server/recebedor";
import { limitar } from "@/lib/server/rate-limit";
import { validarCPF } from "@/lib/validacoes";

/**
 * Gera o Pix de um pedido já criado.
 * O valor vem do pedido gravado no banco, nunca do navegador.
 */
export async function POST(request: NextRequest) {
  try {
    if (!await limitar(request, "criar-pix", 15, 60)) {
      return NextResponse.json(
        { success: false, error: "Muitas tentativas. Aguarde um minuto." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const pedidoId = String(body.pedidoId ?? "");
    const codigo = String(body.codigo ?? "");
    const cpf = String(body.cpf ?? "").replace(/\D/g, "");

    if (!pedidoId || !codigo) {
      return NextResponse.json(
        { success: false, error: "Pedido não informado." },
        { status: 400 }
      );
    }

    if (!validarCPF(cpf)) {
      return NextResponse.json(
        { success: false, error: "Informe um CPF válido para gerar o Pix." },
        { status: 400 }
      );
    }

    const { data: pedido } = await supabaseAdmin
      .from("pedidos")
      .select(
        "id, numero_pedido, restaurante_id, nome, telefone, total, payment_method, payment_status, pagarme_order_id, codigo_acesso"
      )
      .eq("id", pedidoId)
      .eq("codigo_acesso", codigo)
      .maybeSingle();

    if (!pedido) {
      return NextResponse.json(
        { success: false, error: "Pedido não encontrado." },
        { status: 404 }
      );
    }

    if (pedido.payment_method !== "pix" || pedido.payment_status === "approved") {
      return NextResponse.json(
        { success: false, error: "Este pedido não aguarda pagamento por Pix." },
        { status: 400 }
      );
    }

    // Se o Pix deste pedido já foi gerado e ainda vale, reaproveita.
    if (pedido.pagarme_order_id) {
      try {
        const existente = await pagarme<any>(`/orders/${pedido.pagarme_order_id}`);
        const transacao = existente?.charges?.[0]?.last_transaction;
        const expira = transacao?.expires_at ? new Date(transacao.expires_at).getTime() : 0;

        if (existente?.status === "pending" && transacao?.qr_code && expira > Date.now() + 60_000) {
          return NextResponse.json({
            success: true,
            orderId: existente.id,
            qrCode: transacao.qr_code,
            qrCodeUrl: transacao.qr_code_url,
            expiresAt: transacao.expires_at,
          });
        }
      } catch {
        // gera um novo abaixo
      }
    }

    const recipientId = await getRecebedorId(String(pedido.restaurante_id));

    if (!recipientId) {
      return NextResponse.json(
        { success: false, error: "Pix online indisponível neste restaurante." },
        { status: 400 }
      );
    }

    const totalCentavos = centavos(Number(pedido.total));

    if (totalCentavos < 100) {
      return NextResponse.json(
        { success: false, error: "Valor mínimo para Pix online é R$ 1,00." },
        { status: 400 }
      );
    }

    const comissao = Math.round(totalCentavos * COMISSAO_PIX_PERCENTUAL);
    const valorRestaurante = totalCentavos - comissao;

    const split: any[] = [
      {
        recipient_id: recipientId,
        type: "flat",
        amount: valorRestaurante,
        options: {
          liable: true,
          charge_processing_fee: true,
          charge_remainder_fee: true,
        },
      },
    ];

    if (comissao > 0) {
      split.push({
        recipient_id: recebedorPlataforma(),
        type: "flat",
        amount: comissao,
        options: {
          liable: false,
          charge_processing_fee: false,
          charge_remainder_fee: false,
        },
      });
    }

    const order = await pagarme<any>("/orders", {
      method: "POST",
      idempotencyKey: `pix-${pedido.id}-${Date.now()}`,
      body: {
        code: `pedido-${pedido.id}`,
        customer: {
          name: String(pedido.nome || "Cliente").slice(0, 64),
          email: `pedido${pedido.id}@clientes.meucardapioapp.com`,
          type: "individual",
          document: cpf,
          phones: telefoneParaPagarme(pedido.telefone),
        },
        items: [
          {
            amount: totalCentavos,
            description: `Pedido #${pedido.numero_pedido ?? pedido.id}`,
            quantity: 1,
            code: `pedido-${pedido.id}`,
          },
        ],
        payments: [
          {
            payment_method: "pix",
            pix: { expires_in: 3600 },
            split,
          },
        ],
        metadata: {
          tipo: "pedido",
          pedido_id: String(pedido.id),
          restaurante_id: String(pedido.restaurante_id),
        },
      },
    });

    await supabaseAdmin
      .from("pedidos")
      .update({ pagarme_order_id: order.id })
      .eq("id", pedido.id);

    const transacao = order?.charges?.[0]?.last_transaction;

    if (!transacao?.qr_code) {
      // A Pagar.me criou o pedido mas recusou a cobrança: registra o motivo
      // (sem dados do cliente) para aparecer nos Logs da Vercel.
      const cobranca = order?.charges?.[0];
      const motivos = (transacao?.gateway_response?.errors ?? [])
        .map((e: any) => String(e?.message ?? "").slice(0, 200))
        .filter(Boolean);
      console.error(
        "[criar-pix] cobrança recusada",
        JSON.stringify({
          pedido: pedido.id,
          order_status: order?.status,
          charge_status: cobranca?.status,
          transacao_status: transacao?.status,
          gateway_code: transacao?.gateway_response?.code,
          motivos,
          recebedor: recipientId,
        })
      );

      return NextResponse.json(
        {
          success: false,
          error: motivos.length
            ? `A Pagar.me recusou o Pix: ${motivos[0]}`
            : "Não foi possível gerar o Pix. Tente novamente.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      qrCode: transacao.qr_code,
      qrCodeUrl: transacao.qr_code_url,
      expiresAt: transacao.expires_at,
    });
  } catch (error: any) {
    console.error("[criar-pix]", error?.message ?? error);

    const mensagem =
      error instanceof PagarmeError
        ? "A Pagar.me recusou a geração do Pix. Confira o CPF e tente novamente."
        : "Não foi possível gerar o Pix. Tente novamente.";

    return NextResponse.json({ success: false, error: mensagem }, { status: 500 });
  }
}
