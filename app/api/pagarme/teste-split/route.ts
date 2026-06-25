import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    platformRecipient:
      process.env.PAGARME_PLATFORM_RECIPIENT_ID,
  });
}