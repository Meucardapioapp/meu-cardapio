import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  return NextResponse.json({
    ok: true,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log(
      "WEBHOOK:",
      JSON.stringify(body, null, 2)
    );

    const paymentId =
      body?.data?.id ||
      body?.id;

    if (!paymentId) {
      return NextResponse.json({
        success: true,
      });
    }

    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        },
      }
    );

    const pagamento =
      await mpResponse.json();

    console.log(
      "STATUS MP:",
      pagamento.status
    );

    const {
      data: pedido,
    } = await supabaseAdmin
      .from("pedidos")
      .select("*")
      .eq(
        "mercadopago_payment_id",
        String(paymentId)
      )
      .single();

    if (!pedido) {
      console.log(
        "PEDIDO NÃO ENCONTRADO"
      );

      return NextResponse.json({
        success: true,
      });
    }

    if (
      pagamento.status !==
      "approved"
    ) {
      console.log(
        "PAGAMENTO AINDA NÃO APROVADO"
      );

      return NextResponse.json({
        success: true,
      });
    }

    await supabaseAdmin
      .from("pedidos")
      .update({
        payment_status:
          "approved",
      })
      .eq("id", pedido.id);

    console.log(
      "PEDIDO APROVADO:",
      pedido.id
    );

    return NextResponse.json({
      success: true,
    });

  } catch (error: any) {

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