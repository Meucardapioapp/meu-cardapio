import { NextResponse } from "next/server";

export async function GET() {
  console.log("WEBHOOK GET");

  return NextResponse.json({
    ok: true,
    method: "GET",
  });
}

export async function POST(request: Request) {
  const body = await request.text();

  console.log("WEBHOOK POST");
  console.log(body);

  return NextResponse.json({
    success: true,
  });
}