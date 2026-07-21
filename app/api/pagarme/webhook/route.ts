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

  const { error } = await supabaseAdmin
    .from("pedidos")
    .update({
      payment_status,
      status,
    })
    .eq("pagarme_order_id", orderId);

  if (error) {
    console.error("Erro ao atualizar pedido:", error);
  } else {
    console.log("Pedido atualizado com sucesso!");
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

  console.log("TRANSFER ID:", transferId);
  console.log("TRANSFER STATUS:", transferStatus);

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
    console.error("Erro no webhook:", error);

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