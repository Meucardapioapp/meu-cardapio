import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

const response = await fetch(
  `https://api.pagar.me/core/v5/recipients/${id}`,
  {
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(process.env.PAGARME_SECRET_KEY + ":").toString("base64"),
    },
  }
);

const json = await response.json();

console.log(JSON.stringify(json, null, 2));

return NextResponse.json(json);

}