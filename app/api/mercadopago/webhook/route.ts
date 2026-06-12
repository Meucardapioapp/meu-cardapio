import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  console.log("WEBHOOK GET");

  return NextResponse.json({
    ok: true,
    method: "GET",
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log("WEBHOOK POST");
    console.log(JSON.stringify(body));

    const paymentId = body?.data?.id;

    if (!paymentId) {
      return NextResponse.json({
        success: true,
      });
    }

    const { data: pedido } = await supabaseAdmin
      .from("pedidos")
      .select("*")
      .eq(
        "mercadopago_payment_id",
        String(paymentId)
      )
      .single();

    console.log(
      "PEDIDO ENCONTRADO:",
      pedido
    );

    if (!pedido) {
      return NextResponse.json({
        success: true,
      });
    }

    await supabaseAdmin
      .from("pedidos")
      .update({
        payment_status: "approved",
      })
      .eq("id", pedido.id);

    console.log(
      "PEDIDO MARCADO COMO APPROVED"
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 500,
      }
    );
  }
}