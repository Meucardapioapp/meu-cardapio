import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
  total,
  restauranteId,
  pedidoId,
  nome,
  cpf,
  whatsapp,
} = body;

console.log("PEDIDO ID:", pedidoId);

    const {
      data: restaurante,
      error,
    } = await supabaseAdmin
      .from("restaurantes")
      .select("*")
      .eq("id", restauranteId)
      .single();

    if (error || !restaurante) {
      throw new Error(
        "Restaurante não encontrado"
      );
    }

    const recipientId =
      restaurante.pagarme_recipient_id;

    if (!recipientId) {
      throw new Error(
        "Recipient não encontrado"
      );
    }

    const taxaMarketplace =
      Number(total) * 0.01;

    const taxaFixa = 0.99;

    const valorRestaurante =
      Number(total) -
      taxaMarketplace -
      taxaFixa;

    const response = await fetch(
      "https://api.pagar.me/core/v5/orders",
      {
        method: "POST",

        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              process.env
                .PAGARME_SECRET_KEY + ":"
            ).toString("base64"),

          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
customer: {
  name: nome,

  email: `cliente${Date.now()}@meucardapioapp.com`,

  type: "individual",

  document: cpf.replace(/\D/g, ""),

  phones: {
    mobile_phone: {
      country_code: "55",

      area_code: whatsapp
        .replace(/\D/g, "")
        .substring(0, 2),

      number: whatsapp
        .replace(/\D/g, "")
        .substring(2),
    },
  },
},
  items: [
            {
              amount: Math.round(
                Number(total) * 100
              ),

              description:
                "Pedido MeuCardapio",

              quantity: 1,

              code:
                "pedido-" +
                Date.now(),
            },
          ],

         

          payments: [
  {
    payment_method: "pix",

    pix: {
      expires_in: 3600,
    },

    split: [
      {
        recipient_id: recipientId,
        type: "flat",
        amount: Math.round(valorRestaurante * 100),
        options: {
          liable: true,
          charge_processing_fee: true,
          charge_remainder_fee: true,
        },
      },
      {
        recipient_id: "re_cmqqtnnl86t240l9tgpsra25y",
        type: "flat",
        amount: Math.round(
          (taxaMarketplace + taxaFixa) * 100
        ),
        options: {
          liable: false,
          charge_processing_fee: false,
          charge_remainder_fee: false,
        },
      },
    ],
  },
],
        }),
      }
    );

    const data =
      await response.json();

      await supabaseAdmin
  .from("pedidos")
  .update({
    pagarme_order_id: data.id,
  })
  .eq("id", pedidoId);

console.log(
  "STATUS PAGARME:",
  response.status
);

console.log(
  "RESPOSTA PAGARME:",
  JSON.stringify(data, null, 2)
);

    console.log(
      "PAGARME PIX:",
      JSON.stringify(
        data,
        null,
        2
      )
    );



console.log(
  "LAST TRANSACTION:",
  JSON.stringify(
    data?.charges?.[0]?.last_transaction,
    null,
    2
  )
);

console.log(
  "DATA COMPLETA:",
  JSON.stringify(data, null, 2)
);

    return NextResponse.json({
  success: true,

  orderId: data.id,

  qrCode:
    data?.charges?.[0]
      ?.last_transaction?.qr_code,

  qrCodeUrl:
    data?.charges?.[0]
      ?.last_transaction?.qr_code_url,

  expiresAt:
    data?.charges?.[0]
      ?.last_transaction?.expires_at,
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