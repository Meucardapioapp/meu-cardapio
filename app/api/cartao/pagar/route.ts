import { NextRequest, NextResponse } from "next/server";
import {
  MercadoPagoConfig,
  Payment,
} from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken:
    process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export async function POST(
  req: NextRequest
) {
  try {
    const body =
      await req.json();

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