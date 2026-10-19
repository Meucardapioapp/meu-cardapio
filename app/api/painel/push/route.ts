import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { erroInterno, getEquipeAutenticada, naoAutenticado } from "@/lib/server/auth";
import { limitar } from "@/lib/server/rate-limit";
import { enviarPushRestaurante, pushConfigurado } from "@/lib/server/notificacoes";

/** Inscrição do aparelho para receber "Novo pedido" no celular. */

export async function GET(req: NextRequest) {
  const membro = await getEquipeAutenticada(req);
  if (!membro) return naoAutenticado();
  return NextResponse.json({
    success: true,
    disponivel: pushConfigurado(),
    chavePublica: pushConfigurado() ? process.env.VAPID_PUBLIC_KEY : null,
  });
}

export async function POST(req: NextRequest) {
  try {
    if (!(await limitar(req, "painel-push", 20, 60))) {
      return NextResponse.json({ success: false, error: "Muitas tentativas." }, { status: 429 });
    }
    const membro = await getEquipeAutenticada(req);
    if (!membro) return naoAutenticado();
    if (!pushConfigurado()) {
      return NextResponse.json({ success: false, error: "Notificações ainda não ativadas no sistema." }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));

    if (body?.teste === true) {
      await enviarPushRestaurante(membro.restaurante.id, {
        titulo: "✅ Notificações ligadas!",
        corpo: "Você vai receber um aviso aqui a cada pedido novo.",
        tag: "teste",
      });
      return NextResponse.json({ success: true });
    }

    const endpoint = String(body?.endpoint ?? "");
    const p256dh = String(body?.keys?.p256dh ?? "");
    const auth = String(body?.keys?.auth ?? "");
    if (!/^https:\/\//.test(endpoint) || endpoint.length > 1000 || !p256dh || p256dh.length > 200 || !auth || auth.length > 100) {
      return NextResponse.json({ success: false, error: "Inscrição inválida." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("push_inscricoes").upsert(
      {
        restaurante_id: membro.restaurante.id,
        auth_user_id: membro.userId,
        endpoint,
        p256dh,
        auth,
        aparelho: String(req.headers.get("user-agent") ?? "").slice(0, 120),
      },
      { onConflict: "endpoint" }
    );
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return erroInterno("painel/push POST", error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const membro = await getEquipeAutenticada(req);
    if (!membro) return naoAutenticado();
    const body = await req.json().catch(() => ({}));
    const endpoint = String(body?.endpoint ?? "").slice(0, 1000);
    if (endpoint) {
      await supabaseAdmin
        .from("push_inscricoes")
        .delete()
        .eq("endpoint", endpoint)
        .eq("restaurante_id", membro.restaurante.id);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return erroInterno("painel/push DELETE", error);
  }
}
