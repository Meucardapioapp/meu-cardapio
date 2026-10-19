import { NextResponse } from "next/server";
import { listarEstados } from "@/lib/localidades";

/** Estados do Brasil (lista guardada no projeto, sem depender do site do IBGE). */
export async function GET() {
  return NextResponse.json(listarEstados(), {
    headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
  });
}
