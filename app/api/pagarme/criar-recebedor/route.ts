import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      restauranteId,
      cpfCnpj,
      banco,
      agencia,
      conta,
      tipoConta,
    } = body;

    const agenciaPartes =
  agencia.split("-");

const agenciaNumero =
  agenciaPartes[0] || "";

const agenciaDv =
  agenciaPartes[1] || "0";

const contaPartes =
  conta.split("-");

const contaNumero =
  contaPartes[0] || "";

const contaDv =
  contaPartes[1] || "0";

const documentoLimpo =
  cpfCnpj.replace(/\D/g, "");

const tipoPessoa =
  documentoLimpo.length === 11
    ? "individual"
    : "company";

    if (!restauranteId) {
      return NextResponse.json(
        {
          success: false,
          error: "Restaurante não informado",
        },
        { status: 400 }
      );
    }

    const {
  data: restaurante,
} = await supabaseAdmin
  .from("restaurantes")
  .select("*")
  .eq("id", restauranteId)
  .single();

  if (!restaurante) {
  return NextResponse.json(
    {
      success: false,
      error: "Restaurante não encontrado",
    },
    {
      status: 404,
    }
  );
}

const responsePagarme = await fetch(
  "https://api.pagar.me/core/v5/recipients",
  {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.PAGARME_SECRET_KEY + ":"
        ).toString("base64"),
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      name: restaurante.nome_responsavel,

      email: restaurante.email,

      document: documentoLimpo,

      type: tipoPessoa,

      default_bank_account: {
        holder_name:
          restaurante.nome_responsavel,

        holder_type: tipoPessoa,

        holder_document:
          documentoLimpo,

        bank: banco,

        branch_number:
          agenciaNumero,

        branch_check_digit:
          agenciaDv,

        account_number:
          contaNumero,

        account_check_digit:
          contaDv,

        type:
          tipoConta === "poupanca"
            ? "savings"
            : "checking",
      },
    }),
  }
);

const recipient =
  await responsePagarme.json();

  console.log("RECIPIENT PAGARME:");
console.log(recipient);

console.log("ID:", recipient.id);
console.log("STATUS:", recipient.status);

console.log(
  "RECIPIENT:",
  recipient
);

if (!responsePagarme.ok) {
  return NextResponse.json(
    {
      success: false,
      error:
        recipient.message ||
        "Erro ao criar recipient",
      details: recipient,
    },
    {
      status: 400,
    }
  );
}


   await supabaseAdmin
  .from("restaurantes")
  .update({
    cpf_cnpj: cpfCnpj,

    banco,

    agencia,

    conta,

    tipo_conta: tipoConta,

    pagarme_recipient_id:
      recipient.id,

    pagarme_status:
      recipient.status,

    digito_agencia:
      agenciaDv,

    digito_conta:
      contaDv,
  })
  .eq("id", restauranteId);

    return NextResponse.json({
      success: true,
    });

  } catch (error: any) {
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