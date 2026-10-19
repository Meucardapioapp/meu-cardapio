import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { erroInterno, getEquipeAutenticada, naoAutenticado } from "@/lib/server/auth";

/** Pedido completo para o dono do restaurante (impressão da comanda). */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const dono = await getEquipeAutenticada(req);
    if (!dono) return naoAutenticado();

    const { id } = await params;

    const { data: pedido } = await supabaseAdmin
      .from("pedidos")
      .select("*")
      .eq("id", id)
      .eq("restaurante_id", dono.restaurante.id)
      .maybeSingle();

    if (!pedido) {
      return NextResponse.json({ success: false, error: "Pedido não encontrado." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      pedido,
      restaurante: { nome: dono.restaurante.nome_restaurante },
    });
  } catch (error) {
    return erroInterno("painel/pedido", error);
  }
}
