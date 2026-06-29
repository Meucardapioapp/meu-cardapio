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
  paymentMethod,
  cardToken,

  rua,
  numero,
  bairro,
  cidade,
  estado,
} = body;

    console.log("CRIAR PAGAMENTO:", body);

    const { data: restaurante, error } = await supabaseAdmin
      .from("restaurantes")
      .select("*")
      .eq("id", restauranteId)
      .single();

    if (error || !restaurante) {
      throw new Error("Restaurante não encontrado");
    }

    const recipientId = restaurante.pagarme_recipient_id;

    if (!recipientId) {
      throw new Error("Recipient não encontrado");
    }

    const taxaMarketplace = Number(total) * 0.01;
const taxaFixa = 0.99;

const valorRestaurante =
  Number(total) -
  taxaMarketplace -
  taxaFixa;

const payload = {
  customer: {
    name: nome,
    email: `cliente${Date.now()}@meucardapioapp.com`,
    type: "individual",
    document: cpf.replace(/\D/g, ""),

    address: {
      line_1: `${rua}, ${numero}`,
      line_2: bairro,
      zip_code: "69000000",
      city: cidade,
      state: estado,
      country: "BR",
    },

    phones: {
      mobile_phone: {
        country_code: "55",
        area_code: whatsapp.replace(/\D/g, "").substring(0, 2),
        number: whatsapp.replace(/\D/g, "").substring(2),
      },
    },
  },

  items: [
    {
      amount: Math.round(Number(total) * 100),
      description: "Pedido MeuCardapio",
      quantity: 1,
      code: "pedido-" + Date.now(),
    },
  ],

  payments: [
    {
      payment_method: paymentMethod,

      credit_card: {
        operation_type: "auth_and_capture",
        installments: 1,
        statement_descriptor: "MEUCARDAPIO",
        card_token: cardToken,

        billing_address: {
          line_1: `${rua}, ${numero}`,
          line_2: bairro,
          zip_code: "69000000",
          city: cidade,
          state: estado,
          country: "BR",
        },
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
          amount: Math.round((taxaMarketplace + taxaFixa) * 100),
          options: {
            liable: false,
            charge_processing_fee: false,
            charge_remainder_fee: false,
          },
        },
      ],
    },
  ],
};

console.log("PAYLOAD ENVIADO:");
console.log(JSON.stringify(payload, null, 2));

const response = await fetch(
  "https://api.pagar.me/core/v5/orders",
  {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(process.env.PAGARME_SECRET_KEY + ":").toString("base64"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }
);

const data = await response.json();

if (!response.ok) {
  return NextResponse.json(
    {
      responseStatus: response.status,
      pagarme: data,
      payload,
    },
    {
      status: 500,
    }
  );
}

console.dir(
  data.charges?.[0]?.last_transaction,
  { depth: null }
);

console.log(
  "PAGAMENTO CARTÃO:",
  JSON.stringify(data, null, 2)
);

return NextResponse.json(data);

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