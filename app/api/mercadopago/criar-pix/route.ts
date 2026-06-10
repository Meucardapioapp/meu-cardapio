import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";

console.log("CHEGOU NO CRIAR PIX");

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export async function POST(request: Request) {
  throw new Error("TESTE VICTOR");
  try {
    const body = await request.json();
console.log("BODY COMPLETO:", body);
console.log("RESTAURANTE ID:", body.restauranteId);

    console.log("BODY RECEBIDO:", body);

    const totalRecebido = Number(body.total);

    if (isNaN(totalRecebido) || totalRecebido <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Valor inválido",
        },
        {
          status: 400,
        }
      );
    }

    const valorFinal = parseFloat(
      totalRecebido.toFixed(2)
    );

    console.log(
      "TOTAL RECEBIDO:",
      totalRecebido
    );

    console.log(
      "VALOR FINAL PIX:",
      valorFinal
    );

    const payment = new Payment(client);

    const resultado = await payment.create({
      body: {
        transaction_amount: valorFinal,

        description:
          "Pedido MeuCardápio",

        payment_method_id: "pix",

        payer: {
          email:
            "cliente@meucardapio.com",

          first_name:
            "Cliente",

          last_name:
            "MeuCardapio",
        },
      },
    });

    console.log(
      "PAGAMENTO CRIADO:",
      resultado.id
    );

    console.log(
      "TEM QR BASE64?",
      !!resultado
        .point_of_interaction
        ?.transaction_data
        ?.qr_code_base64
    );

    console.log(
      "TAMANHO BASE64:",
      resultado
        .point_of_interaction
        ?.transaction_data
        ?.qr_code_base64
        ?.length
    );

    console.log(
      "QR CODE:",
      resultado
        .point_of_interaction
        ?.transaction_data
        ?.qr_code
    );

    return NextResponse.json({
      success: true,

      id: resultado.id,

      qr_code:
        resultado
          .point_of_interaction
          ?.transaction_data
          ?.qr_code,

      qr_code_base64:
        resultado
          .point_of_interaction
          ?.transaction_data
          ?.qr_code_base64,
    });

  } catch (error: any) {

    console.error(
      "ERRO MERCADO PAGO:"
    );

    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Erro ao gerar PIX",
      },
      {
        status: 500,
      }
    );
  }
}