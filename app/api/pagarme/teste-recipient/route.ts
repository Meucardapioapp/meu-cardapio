import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
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
          name: "Teste Recipient",

          email: "teste@teste.com",

          document: "67583816000166",

          type: "company",

          default_bank_account: {
            holder_name:
              "VICTOR GABRIEL PORTELA MOURA",

            holder_type: "company",

            holder_document:
              "67583816000166",

            bank: "260",

            branch_number: "0001",

            branch_check_digit: "0",

            account_number: "123456",

            account_check_digit: "7",

            type: "checking",
          },
        }),
      }
    );

    const data = await response.json();

    return NextResponse.json(data);

  } catch (error: any) {

    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}