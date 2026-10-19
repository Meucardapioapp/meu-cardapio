import { limitar } from "@/lib/server/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { erroInterno, getDonoAutenticado, naoAutenticado } from "@/lib/server/auth";
import { contabilizarPedido } from "@/lib/server/fidelidade";

export async function DELETE(req: NextRequest) {
  try {
    if (!(await limitar(req, "painel-escrita", 60, 60))) {
      return NextResponse.json({ success: false, error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });
    }

    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();

    const { pedidoId } = await req.json();

    if (!pedidoId) {
      return NextResponse.json({ error: "Pedido não informado" }, { status: 400 });
    }

    const { data: existe } = await supabaseAdmin
      .from("pedidos")
      .select("id")
      .eq("id", pedidoId)
      .eq("restaurante_id", dono.restaurante.id)
      .maybeSingle();

    if (!existe) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    // Tira o pedido do histórico do cliente antes de apagar.
    await contabilizarPedido(existe.id, false);

    const { data, error } = await supabaseAdmin
      .from("pedidos")
      .delete()
      .eq("id", pedidoId)
      .eq("restaurante_id", dono.restaurante.id)
      .select("id")
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Pedido excluído com sucesso" });
  } catch (error) {
    return erroInterno("pedido/excluir", error);
  }
}
