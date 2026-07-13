import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  try {
    const restauranteId =
      req.nextUrl.searchParams.get("restauranteId");

    if (!restauranteId) {
      return NextResponse.json(
        {
          success: false,
          error: "Restaurante não informado",
        },
        { status: 400 }
      );
    }

    const { data: restaurante, error } =
      await supabaseAdmin
        .from("restaurantes")
        .select("pagarme_recipient_id")
        .eq("id", restauranteId)
        .single();

    if (error || !restaurante) {
      return NextResponse.json(
        {
          success: false,
          error: "Restaurante não encontrado",
        },
        { status: 404 }
      );
    }

    if (!restaurante.pagarme_recipient_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Recipient não encontrado",
        },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api.pagar.me/core/v5/recipients/${restaurante.pagarme_recipient_id}/balance`,
      {
        method: "GET",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              process.env.PAGARME_SECRET_KEY + ":"
            ).toString("base64"),
          "Content-Type": "application/json",
        },
      }
    );

    const balance = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: balance,
        },
        {
          status: response.status,
        }
      );
    }

    const saldoDisponivel =
      (balance.available_amount ?? 0) / 100;

    const saldoProcessando =
      Math.max(balance.waiting_funds_amount ?? 0, 0) / 100;

    const saldoTransferido =
      (balance.transferred_amount ?? 0) / 100;

    const saldoTotal =
      saldoDisponivel + saldoProcessando;

    return NextResponse.json({
      success: true,

      saldoTotal,

      saldoDisponivel,

      saldoProcessando,

      saldoTransferido,

      recipient: balance.recipient,
    });

  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}