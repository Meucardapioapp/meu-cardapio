import { NextResponse } from "next/server";
import { apagarSessao } from "@/lib/server/funcionario";

export async function POST() {
  const res = NextResponse.json({ success: true });
  apagarSessao(res);
  return res;
}
