import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { erroInterno, getDonoAutenticado, naoAutenticado } from "@/lib/server/auth";
import { getOperacao } from "@/lib/server/operacao";
import { emailConfigurado, pushConfigurado, whatsappConfigurado } from "@/lib/server/notificacoes";

/** Quais avisos automáticos estão disponíveis e ligados. */
export async function GET(req: NextRequest) {
  try {
    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();
    const operacao = await getOperacao(dono.restaurante.id);
    return NextResponse.json({
      success: true,
      push: pushConfigurado(),
      email: emailConfigurado(),
      emailDestino: dono.restaurante.email,
      whatsapp: whatsappConfigurado(),
      whatsappCliente: operacao.whatsappCliente,
    });
  } catch (error) {
    return erroInterno("painel/notificacoes GET", error);
  }
}

/** Liga/desliga o WhatsApp automático para os clientes. */
export async function PUT(req: NextRequest) {
  try {
    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();
    const body = await req.json().catch(() => ({}));
    if (typeof body?.whatsappCliente !== "boolean") {
      return NextResponse.json({ success: false, error: "Dados inválidos." }, { status: 400 });
    }
    const { error } = await supabaseAdmin
      .from("restaurante_operacao")
      .upsert(
        { restaurante_id: dono.restaurante.id, whatsapp_cliente: body.whatsappCliente, updated_at: new Date().toISOString() },
        { onConflict: "restaurante_id" }
      );
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return erroInterno("painel/notificacoes PUT", error);
  }
}
