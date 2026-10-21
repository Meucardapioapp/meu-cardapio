import { NextRequest, NextResponse } from "next/server";
import { isDonoDaPlataforma } from "@/lib/server/auth";

/** Diz só se quem está logado é o dono da plataforma (usado no login). */
export async function GET(req: NextRequest) {
  return NextResponse.json({ dono: await isDonoDaPlataforma(req) });
}
