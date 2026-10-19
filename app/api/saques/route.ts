import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { erroInterno, getDonoAutenticado, naoAutenticado } from "@/lib/server/auth";

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

    return NextResponse.json({ success: true, saques: data });
  } catch (error) {
    return erroInterno("saques", error);
  }
}
