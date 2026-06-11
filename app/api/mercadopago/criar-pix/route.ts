import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {

const body = await request.json();

console.log("BODY COMPLETO:", body);

console.log(
  "BODY STRING:",
  JSON.stringify(body)
);

console.log(
  "RESTAURANTE ID:",
  body.restauranteId
);

console.log(
  "TIPO RESTAURANTE ID:",
  typeof body.restauranteId
);

console.log(
  "VALOR USADO NO SELECT:",
  String(body.restauranteId)
);

console.log(
  "BODY RECEBIDO PIX:",
  JSON.stringify(body)
);

const {
  data: restaurante,
  error: restauranteError,
} = await supabaseAdmin
  .from("restaurantes")
  .select("*")
  .eq(
    "id",
    String(body.restauranteId)
  )
  .single();

console.log(
  "RESULTADO RESTAURANTE:",
  restaurante
);

console.log(
  "ERRO RESTAURANTE:",
  restauranteError
);
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


    if (restauranteError || !restaurante) {
  throw new Error(
    JSON.stringify({
      body,
      restauranteId: body.restauranteId,
      restauranteError,
    })
  );
}

    console.log(
      "TOKEN ENCONTRADO:",
      !!restaurante.mercadopago_access_token
    );

    if (!restaurante.mercadopago_access_token) {
      return NextResponse.json(
        {
          success: false,
          error: "Mercado Pago não conectado",
        },
        {
          status: 400,
        }
      );
    }

    const client = new MercadoPagoConfig({
      accessToken:
        restaurante.mercadopago_access_token,
    });

    const valorFinal = parseFloat(
      totalRecebido.toFixed(2)
    );

    const payment = new Payment(client);

   const resultado = await payment.create({
  body: {
    transaction_amount: valorFinal,

    description: "Pedido MeuCardápio",

    payment_method_id: "pix",

    payer: {
      email: "cliente@meucardapio.com",
      first_name: "Cliente",
      last_name: "MeuCardapio",
    },
  },
});

console.log(
  "RESPOSTA MP:",
  JSON.stringify(resultado, null, 2)
);

    console.log(
      "PAGAMENTO CRIADO:",
      resultado.id
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