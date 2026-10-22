import { NextRequest, NextResponse } from "next/server";
import { acessoNegado, erroInterno, isDonoDaPlataforma } from "@/lib/server/auth";
import { darDiasDeTeste } from "@/lib/server/assinatura";

/**
 * Dá mais dias de teste grátis a um restaurante (só o dono da plataforma).
 * Corpo: { restauranteId: UUID, dias: 1 a 60 }
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  try {
    if (!(await isDonoDaPlataforma(req))) return acessoNegado();

    const corpo = await req.json().catch(() => null);
    const restauranteId = String(corpo?.restauranteId ?? "");
    const dias = Number(corpo?.dias);

    if (!UUID.test(restauranteId) || !Number.isInteger(dias) || dias < 1 || dias > 60) {
      return NextResponse.json(
        { success: false, error: "Dados inválidos (restaurante e 1 a 60 dias)." },
        { status: 400 }
      );
    }

    try {
      const acessoAte = await darDiasDeTeste(restauranteId, dias);
      return NextResponse.json({ success: true, acessoAte: acessoAte.toISOString() });
    } catch (e) {
      if (e instanceof Error && e.message === "Este restaurante já é assinante.") {
        return NextResponse.json({ success: false, error: e.message }, { status: 409 });
      }
      throw e;
    }
  } catch (error) {
    return erroInterno("plataforma/teste POST", error);
  }
}
