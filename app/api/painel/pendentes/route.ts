import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { erroInterno, getEquipeAutenticada, naoAutenticado } from "@/lib/server/auth";

/** Pedidos novos aguardando o restaurante aceitar (usado pelo alerta sonoro). */
export async function GET(req: NextRequest) {
  try {
    const dono = await getEquipeAutenticada(req);
    if (!dono) return naoAutenticado();

    const { data, error } = await supabaseAdmin
      .from("pedidos")
      .select("id, numero_pedido, nome, cliente, total, created_at, payment_method")
      .eq("restaurante_id", dono.restaurante.id)
      .eq("status", "pendente")
      .or("payment_method.eq.cash,payment_method.eq.card_delivery,payment_method.eq.pix_chave,payment_status.eq.approved")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      restauranteId: dono.restaurante.id,
      pedidos: data ?? [],
    });
  } catch (error) {
    return erroInterno("painel/pendentes", error);
  }
}
