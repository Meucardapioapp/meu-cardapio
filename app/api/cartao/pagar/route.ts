import { NextRequest, NextResponse } from "next/server";
import {
  MercadoPagoConfig,
  Payment,
} from "mercadopago";
import { supabaseAdmin } from "@/lib/supabase-admin";

const client = new MercadoPagoConfig({
  accessToken:
    process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

console.log(
  "TOKEN DA ROTA CARTAO:",
  process.env.MERCADOPAGO_ACCESS_TOKEN?.substring(0, 30)
);

export async function POST(
  req: NextRequest
) {
  try {
    const body =
      await req.json();

      console.log("PEDIDO ID:", body.pedidoId);
console.log("RESTAURANTE ID:", body.restauranteId);

    console.log(
      "=============================="
    );

    console.log(
      "DADOS RECEBIDOS:"
    );

    console.log(
      JSON.stringify(
        body,
        null,
        2
      )
    );

    console.log(
      "=============================="
    );

const usuarioResponse = await fetch(
  "https://api.mercadopago.com/users/me",
  {
    headers: {
      Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
    },
  }
);

const usuario = await usuarioResponse.json();

console.log(
  "USUARIO MP CARTAO:",
  JSON.stringify(usuario, null, 2)
);

    const payment =
      new Payment(client);

    const resultado =
      await payment.create({
        body: {
          transaction_amount:
            Number(
              body.transaction_amount
            ),

          token:
            body.token,

          description:
            "Pedido MeuCardapio",

          installments:
            Number(
              body.installments
            ),

          payment_method_id:
            body.payment_method_id,

          issuer_id:
            body.issuer_id,

          payer: {
            email:
              body.payer.email,

            identification: {
              type:
                body.payer
                  .identification.type,

              number:
                body.payer
                  .identification.number,
            },
          },
        },
      });

    console.log(
      "=============================="
    );

    console.log(
      "STATUS:",
      resultado.status
    );

    console.log(
      "STATUS DETAIL:",
      resultado.status_detail
    );

    console.log(
      "PAYMENT ID:",
      resultado.id
    );

    console.log(
      "RESPOSTA COMPLETA:"
    );

    console.log(
      JSON.stringify(
        resultado,
        null,
        2
      )
    );

    console.log(
      "=============================="
    );

    if (body.pedidoId) {

  const { error } =
    await supabaseAdmin
      .from("pedidos")
      .update({

        mercadopago_payment_id:
          String(resultado.id),

        payment_method:
          "cartao",

        payment_status:
          resultado.status,

      })
      .eq(
        "id",
        body.pedidoId
      );

  console.log(
    "UPDATE PEDIDO:",
    error
      ? error
      : "OK"
  );
}

    return NextResponse.json({
      success: true,
      status:
        resultado.status,
      statusDetail:
        resultado.status_detail,
      paymentId:
        resultado.id,
      response:
        resultado,
    });
  } catch (error: any) {
    console.error(
      "ERRO MERCADO PAGO"
    );

    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Erro desconhecido",
      },
      {
        status: 500,
      }
    );
  }
}