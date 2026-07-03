import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ip =
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  request.headers.get("x-real-ip") ||
  "";

const userAgent =
  request.headers.get("user-agent") || "";

const {
  total,
  restauranteId,
  pedidoId,

  itens,

  nome,
  email,
  cpf,
  whatsapp,

  paymentMethod,
  cardToken,
  googlePayToken,

  rua,
  numero,
  complemento,
  bairro,
  cidade,
  estado,
  cep,
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
    email,
    type: "individual",
    document: cpf.replace(/\D/g, ""),

    address: {
      line_1: `${rua}, ${numero}`,
      line_2: complemento
  ? `${complemento} - ${bairro}`
  : bairro,
      zip_code: cep.replace(/\D/g, ""),
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

metadata: {
  ip,
  user_agent: userAgent,
},

},
  

 items: itens.map((item: any, index: number) => ({
  amount: Math.round(Number(item.preco) * 100),

  description: item.nome,

  quantity: item.quantity,

  code: item.id
    ? String(item.id)
    : `item-${index}`,
})),

  payments: [
    {
      payment_method:
  paymentMethod === "google_pay"
    ? "credit_card"
    : paymentMethod,
credit_card: {
  operation_type: "auth_and_capture",
  installments: 1,
  statement_descriptor: "MEUCARDAPIO",

  ...(paymentMethod === "google_pay"
    ? {
        payload: {
          type: "google_pay",
          google_pay: googlePayToken,
        },
      }
    : {
        card_token: cardToken,
      }),

  card: {
        billing_address: {
          line_1: `${rua}, ${numero}`,
          line_2: complemento
  ? `${complemento} - ${bairro}`
  : bairro,
          zip_code: cep.replace(/\D/g, ""),
          city: cidade,
          state: estado,
          country: "BR",
        },
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
  console.error("ERRO PAGAR.ME");
  console.error(JSON.stringify(data, null, 2));

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

const {
  data: pedidoAtualizado,
  error: updateError,
} = await supabaseAdmin
  .from("pedidos")
  .update({
    pagarme_order_id: data.id,

    payment_status:
      data.status === "paid"
        ? "paid"
        : "pending",
  })
  .eq("id", pedidoId)
  .select();

console.log("ORDER ID PAGARME:", data.id);
console.log("PEDIDO ID:", pedidoId);
console.log("UPDATE:", pedidoAtualizado);
console.log("ERRO UPDATE:", updateError);

console.dir(
  data.charges?.[0]?.last_transaction,
  { depth: null }
);

console.log(
  "PAGAMENTO CARTÃO:",
  JSON.stringify(data, null, 2)
);

console.log("PAYLOAD ENVIADO:");
console.log(JSON.stringify(payload, null, 2));

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