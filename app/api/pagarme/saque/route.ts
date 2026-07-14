import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { restauranteId, valor } = body;

    if (!restauranteId) {
      return NextResponse.json(
        {
          success: false,
          error: "Restaurante não informado",
        },
        { status: 400 }
      );
    }

    if (!valor || valor <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Valor inválido",
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

    const amount = Math.round(valor * 100);

    const response = await fetch(
      `https://api.pagar.me/core/v5/recipients/${restaurante.pagarme_recipient_id}/transfers`,
      {
        method: "POST",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              process.env.PAGARME_SECRET_KEY + ":"
            ).toString("base64"),
          "Content-Type": "application/json",
          "User-Agent": "MeuCardapioApp",
        },
        body: JSON.stringify({
          amount,
        }),
      }
    );

    const transfer = await response.json();

    console.log("TRANSFER:");
    console.log(transfer);

const taxa = 3.67;

const valorLiquido = valor;

const saldoConsumido = valorLiquido + taxa;

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: transfer,
        },
        {
          status: response.status,
        }
      );
    }

const { error: insertError } = await supabaseAdmin
  .from("saques")
  .insert({
    restaurante_id: restauranteId,
    pagarme_recipient_id:
      restaurante.pagarme_recipient_id,
    pagarme_withdrawal_id: transfer.id,

    valor: saldoConsumido,

    taxa,

    valor_liquido: valorLiquido,

    status:
      transfer.status ?? "processing",
  });

if (insertError) {
  console.error("ERRO AO SALVAR SAQUE:");
  console.error(insertError);
}

    return NextResponse.json({
      success: true,
      transfer,
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