import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { CupomInvalidoError, aplicarCupom } from "@/lib/server/cupom";
import { limitar } from "@/lib/server/rate-limit";

/**
 * Confere um cupom no checkout e devolve o desconto para mostrar ao cliente.
 * O valor final é recalculado de novo no servidor ao criar o pedido.
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await limitar(req, "cupom-validar", 20, 60))) {
      return NextResponse.json(
        { success: false, error: "Muitas tentativas. Aguarde um minuto." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const restauranteId = String(body?.restauranteId ?? "").slice(0, 64);
    const subtotal = Number(body?.subtotal);
    const telefone = String(body?.telefone ?? "").slice(0, 30);

    if (!restauranteId || !Number.isFinite(subtotal) || subtotal < 0) {
      return NextResponse.json({ success: false, error: "Dados inválidos." }, { status: 400 });
    }

    let clienteId: string | null = null;

    if (telefone) {
      const { data } = await supabaseAdmin
        .from("clientes")
        .select("id")
        .eq("telefone", telefone)
        .eq("restaurante_id", restauranteId)
        .maybeSingle();
      clienteId = data ? String(data.id) : null;
    }

    const { cupom, desconto } = await aplicarCupom({
      restauranteId,
      codigo: body?.codigo,
      subtotal,
      clienteId,
    });

    return NextResponse.json({
      success: true,
      cupom: { codigo: cupom.codigo, tipo: cupom.tipo, valor: Number(cupom.valor) },
      desconto,
    });
  } catch (error) {
    if (error instanceof CupomInvalidoError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    console.error("[cupom/validar]", error);
    return NextResponse.json(
      { success: false, error: "Não foi possível conferir o cupom agora." },
      { status: 500 }
    );
  }
}
