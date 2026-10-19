import { limitar } from "@/lib/server/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { listarCidades } from "@/lib/localidades";

/** Cidades de um estado (lista guardada no projeto, sem depender do site do IBGE). */
export async function GET(req: NextRequest) {
  if (!(await limitar(req, "cidades", 60, 60))) {
    return NextResponse.json({ success: false, error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });
  }

  const uf = req.nextUrl.searchParams.get("uf");
  const search = req.nextUrl.searchParams.get("search");

  // Só a sigla do estado (2 letras).
  if (!uf || !/^[A-Za-z]{2}$/.test(uf)) {
    return NextResponse.json([]);
  }

  return NextResponse.json(listarCidades(uf, search));
}
