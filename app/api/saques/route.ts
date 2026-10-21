import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { erroInterno, getDonoAutenticado, naoAutenticado } from "@/lib/server/auth";
import { getRecebedorId } from "@/lib/server/recebedor";
import { sincronizarSaques } from "@/lib/server/saques";

export async function GET(req: NextRequest) {
  try {
    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();

    const { data, error } = await supabaseAdmin
      .from("saques")
      .select("*")
      .eq("restaurante_id", dono.restaurante.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Status sempre igual ao da Pagar.me.
    const lista = data ?? [];
    try {
      await sincronizarSaques(lista, await getRecebedorId(String(dono.restaurante.id)));
    } catch (e) {
      console.error("[saques] sincronização", e);
    }

    return NextResponse.json({ success: true, saques: lista });
  } catch (error) {
    return erroInterno("saques", error);
  }
}
