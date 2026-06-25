import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("========== WEBHOOK PAGAR.ME ==========");
    console.log(JSON.stringify(body, null, 2));
    console.log("======================================");

    return NextResponse.json(
      {
        received: true,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erro no webhook:", error);

    return NextResponse.json(
      {
        received: false,
      },
      {
        status: 500,
      }
    );
  }
}