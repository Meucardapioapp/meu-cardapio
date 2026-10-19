import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { erroInterno, getDonoAutenticado, naoAutenticado } from "@/lib/server/auth";

/** Avaliações recebidas pelo restaurante. */
export async function GET(req: NextRequest) {
  try {
    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();

    const { data, error } = await supabaseAdmin
      .from("avaliacoes")
      .select("id, pedido_id, nota, comentario, nome, visivel, created_at")
      .eq("restaurante_id", dono.restaurante.id)
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) {
      return NextResponse.json({ success: true, avaliacoes: [], indisponivel: true });
    }
    return NextResponse.json({ success: true, avaliacoes: data ?? [] });
  } catch (error) {
    return erroInterno("painel/avaliacoes GET", error);
  }
}

/** Mostrar ou esconder um comentário no cardápio. */
export async function PATCH(req: NextRequest) {
  try {
    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();
    const body = await req.json().catch(() => ({}));
    const id = String(body?.id ?? "").slice(0, 64);
    if (!id || typeof body?.visivel !== "boolean") {
      return NextResponse.json({ success: false, error: "Dados inválidos." }, { status: 400 });
    }
    const { error } = await supabaseAdmin
      .from("avaliacoes")
      .update({ visivel: body.visivel })
      .eq("id", id)
      .eq("restaurante_id", dono.restaurante.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return erroInterno("painel/avaliacoes PATCH", error);
  }
}
