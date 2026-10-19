import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getProgramaFidelidade, getSelosCliente } from "@/lib/server/fidelidade";
import { tokenDoCliente } from "@/lib/server/cliente-token";
import { limitar } from "@/lib/server/rate-limit";

/**
 * Programa de fidelidade do restaurante (público) e, se o aparelho tiver
 * o token do cliente, os selos dele. Usado no cardápio e no checkout.
 */
export async function GET(req: NextRequest) {
  const restauranteId = req.nextUrl.searchParams.get("restauranteId") || "";
  const token = tokenDoCliente(req);

  if (!(await limitar(req, "fidelidade", 120, 60))) {
    return NextResponse.json({ success: false, error: "Muitas tentativas." }, { status: 429 });
  }

  if (!restauranteId) {
    return NextResponse.json({ success: false, error: "Restaurante não informado." }, { status: 400 });
  }

  try {
    const programa = await getProgramaFidelidade(restauranteId);

    if (!programa) {
      return NextResponse.json({ success: true, programa: null, cliente: null });
    }

    let cliente = null;

    if (token) {
      const { data } = await supabaseAdmin
        .from("clientes")
        .select("id")
        .eq("token_acesso", token)
        .eq("restaurante_id", restauranteId)
        .maybeSingle();

      if (data) {
        const { selos } = await getSelosCliente(String(data.id), restauranteId);
        cliente = {
          selos,
          premioDisponivel: selos >= programa.pedidosNecessarios,
        };
      }
    }

    return NextResponse.json({ success: true, programa, cliente });
  } catch (error) {
    console.error("[api/fidelidade]", error);
    return NextResponse.json({ success: true, programa: null, cliente: null });
  }
}
