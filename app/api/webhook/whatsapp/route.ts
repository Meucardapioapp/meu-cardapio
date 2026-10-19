import { NextRequest, NextResponse } from "next/server";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (VERIFY_TOKEN && mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json(
    { error: "Token inválido" },
    { status: 403 }
  );
}

export async function POST(req: NextRequest) {
  // Integração do WhatsApp ainda não implementada: apenas confirma o recebimento.
  await req.text();

  return NextResponse.json({ received: true });
}