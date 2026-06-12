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

    console.log("=================================");
    console.log("WEBHOOK POST");
    console.log(
      "BODY COMPLETO:",
      JSON.stringify(body, null, 2)
    );
    console.log("=================================");

    const paymentId =
      body?.data?.id ||
      body?.id;

    console.log(
      "PAYMENT ID RECEBIDO:",
      paymentId
    );

    if (!paymentId) {
      console.log(
        "PAYMENT ID NÃO ENCONTRADO"
      );

      return NextResponse.json({
        success: true,
      });
    }

    const {
      data: pedido,
      error: pedidoError,
    } = await supabaseAdmin
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

    console.log(
      "ERRO BUSCA PEDIDO:",
      pedidoError
    );

    if (!pedido) {
      console.log(
        "NENHUM PEDIDO ENCONTRADO PARA O PAYMENT ID:",
        paymentId
      );

      return NextResponse.json({
        success: true,
      });
    }

    const {
      error: updateError,
    } = await supabaseAdmin
      .from("pedidos")
      .update({
        payment_status: "approved",
      })
      .eq("id", pedido.id);

    console.log(
      "ERRO UPDATE:",
      updateError
    );

    console.log(
      "PEDIDO MARCADO COMO APPROVED:",
      pedido.id
    );

    return NextResponse.json({
      success: true,
    });

  } catch (error: any) {

    console.error(
      "ERRO WEBHOOK:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Erro interno",
      },
      {
        status: 500,
      }
    );
  }
}