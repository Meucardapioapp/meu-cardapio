import { NextRequest, NextResponse } from "next/server";

const VERIFY_TOKEN = "meucardapioapp";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json(
    { error: "Token inválido" },
    { status: 403 }
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  console.log("Webhook WhatsApp:");
  console.log(JSON.stringify(body, null, 2));

  return NextResponse.json({ received: true });
}