import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const eventType = body?.type;

    const orderId =
      body?.data?.order?.id ??
      body?.data?.id;

    const paymentStatus =
      body?.data?.order?.status ??
      body?.data?.status;

    console.log("EVENT:", eventType);
    console.log("ORDER ID:", orderId);
    console.log("STATUS:", paymentStatus);

    console.log("========== WEBHOOK PAGAR.ME ==========");
    console.log(JSON.stringify(body, null, 2));
    console.log("======================================");

    if (orderId) {
      let payment_status = "pending";
      let status = "pendente";

      if (paymentStatus === "paid") {
        payment_status = "approved";
        status = "aceito";
      } else if (paymentStatus === "failed") {
        payment_status = "failed";
        status = "recusado";
      } else if (paymentStatus === "processing") {
        payment_status = "processing";
        status = "pendente";
      }

      // Busca o pedido ANTES de atualizar
      // para saber se ele já estava aprovado.
      const { data: pedido, error: pedidoError } =
        await supabaseAdmin
          .from("pedidos")
          .select(
            "id, total, payment_method, payment_status"
          )
          .eq("pagarme_order_id", orderId)
          .maybeSingle();

      if (pedidoError) {
        console.error(
          "Erro ao buscar pedido:",
          pedidoError
        );
      }

      // Atualiza o status do pedido
      const { error } = await supabaseAdmin
        .from("pedidos")
        .update({
          payment_status,
          status,
        })
        .eq("pagarme_order_id", orderId);

      if (error) {
        console.error(
          "Erro ao atualizar pedido:",
          error
        );
      } else {
        console.log(
          "Pedido atualizado com sucesso!"
        );
      }

      // ==========================================
      // NOTIFICAÇÃO PUSHCUT - PIX PAGO
      // ==========================================

      const metodoPagamento =
        String(
          pedido?.payment_method ?? ""
        ).toLowerCase();

      const eraAprovado =
        pedido?.payment_status === "approved";

      if (
        paymentStatus === "paid" &&
        metodoPagamento === "pix" &&
        pedido &&
        !eraAprovado
      ) {
        try {
          const valorPedido =
            Number(pedido.total ?? 0);

          // 1% da venda + R$ 0,99
          const comissao =
            valorPedido * 0.01 + 0.99;

          const comissaoFormatada =
            comissao.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });

          const pushcutUrl =
            process.env.PUSHCUT_NOVA_VENDA_PIX_URL;

          if (pushcutUrl) {
            const pushcutResponse =
              await fetch(pushcutUrl, {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
                  title: `Pix - R$ ${comissaoFormatada}`,
                  text: `Pix - R$ ${comissaoFormatada}`,
                }),
              });

            if (!pushcutResponse.ok) {
              console.error(
                "Erro Pushcut:",
                pushcutResponse.status
              );
            } else {
              console.log(
                `Notificação enviada: Pix - R$ ${comissaoFormatada}`
              );
            }
          } else {
            console.warn(
              "PUSHCUT_NOVA_VENDA_PIX_URL não configurada."
            );
          }
        } catch (pushcutError) {
          console.error(
            "Erro ao enviar notificação PIX:",
            pushcutError
          );
        }
      }
    }

    // ======================================================
    // ATUALIZAÇÃO DE SAQUES / TRANSFERÊNCIAS PAGAR.ME
    // ======================================================

    if (
      eventType === "transfer.created" ||
      eventType === "transfer.updated" ||
      eventType === "transfer.paid" ||
      eventType === "transfer.failed" ||
      eventType === "transfer.canceled"
    ) {
      const transferId =
        body?.data?.id ??
        body?.data?.transfer?.id;

      const transferStatus =
        body?.data?.status ??
        body?.data?.transfer?.status;

      console.log(
        "TRANSFER ID:",
        transferId
      );

      console.log(
        "TRANSFER STATUS:",
        transferStatus
      );

      if (transferId && transferStatus) {
        const { error: saqueError } =
          await supabaseAdmin
            .from("saques")
            .update({
              status: transferStatus,
            })
            .eq(
              "pagarme_withdrawal_id",
              transferId
            );

        if (saqueError) {
          console.error(
            "Erro ao atualizar saque:",
            saqueError
          );
        } else {
          console.log(
            "Saque atualizado com sucesso!"
          );
        }
      }
    }

    return NextResponse.json(
      {
        received: true,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Erro no webhook:",
      error
    );

    return NextResponse.json(
      {
        received: false,
      },
      {
        status: 500,
      }
    );
  }
}