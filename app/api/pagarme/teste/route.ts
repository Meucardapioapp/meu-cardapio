import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://api.pagar.me/core/v5/recipients",
      {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              process.env.PAGARME_SECRET_KEY + ":"
            ).toString("base64"),
        },
      }
    );

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({
      erro: error.message,
    });
  }
}