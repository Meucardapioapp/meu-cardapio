import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const orderId =
  body?.data?.order?.id;

const paymentStatus =
  body?.data?.status;

console.log("ORDER ID:", orderId);
console.log("STATUS:", paymentStatus);

    console.log("========== WEBHOOK PAGAR.ME ==========");
    console.log(JSON.stringify(body, null, 2));
    console.log("======================================");

    if (
  orderId &&
  paymentStatus === "paid"
) {
  const { error } =
    await supabaseAdmin
      .from("pedidos")
      .update({
        payment_status:
          "approved",

        status: "aceito",
      })
      .eq(
        "pagarme_order_id",
        orderId
      );

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