import { limitar } from "@/lib/server/rate-limit";
import { NextRequest, NextResponse, after } from "next/server";
import { whatsappStatusPedido } from "@/lib/server/notificacoes";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { erroInterno, getEquipeAutenticada, naoAutenticado } from "@/lib/server/auth";
import { contabilizarPedido } from "@/lib/server/fidelidade";

const STATUS_PERMITIDOS = [
  "pendente",
  "aceito",
  "preparo",
  "entrega",
  "concluido",
  "recusado",
  "cancelado",
];

/**
 * Pedidos do restaurante logado. Pix só aparece depois de pago;
 * dinheiro e cartão na entrega aparecem na hora.
 */
export async function GET(req: NextRequest) {
  try {
    const dono = await getEquipeAutenticada(req);
    if (!dono) return naoAutenticado();

    const desde = req.nextUrl.searchParams.get("desde");
    const ate = req.nextUrl.searchParams.get("ate");
    const limite = Math.min(Number(req.nextUrl.searchParams.get("limite") || 300), 2000);

    let consulta = supabaseAdmin
      .from("pedidos")
      .select("*")
      .eq("restaurante_id", dono.restaurante.id)
      .or("payment_method.eq.cash,payment_method.eq.card_delivery,payment_method.eq.pix_chave,payment_status.eq.approved")
      .order("created_at", { ascending: false })
      .limit(limite);

    if (desde) consulta = consulta.gte("created_at", desde);
    if (ate) consulta = consulta.lte("created_at", ate);

    const { data, error } = await consulta;

    if (error) throw error;

    // Pedido do QR da mesa que entrou na comanda fica só na área Restaurante.
    return NextResponse.json({ success: true, pedidos: (data ?? []).filter((p: any) => !p.comanda_id) });
  } catch (error) {
    return erroInterno("painel/pedidos GET", error);
  }
}

/** Muda o status de um pedido do restaurante logado. */
export async function PATCH(req: NextRequest) {
  try {
    if (!(await limitar(req, "painel-pedidos", 180, 60))) {
      return NextResponse.json({ success: false, error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });
    }

    const dono = await getEquipeAutenticada(req);
    if (!dono) return naoAutenticado();

    const { id, status, pagamento, motoboy } = await req.json();

    // Enviar o pedido para um motoboy (ou tirar dele).
    if (id && motoboy !== undefined) {
      let dadosMotoboy: { motoboy_id: string | null; motoboy_nome: string | null; motoboy_enviado_em: string | null } = {
        motoboy_id: null,
        motoboy_nome: null,
        motoboy_enviado_em: null,
      };

      if (motoboy) {
        const { data: m } = await supabaseAdmin
          .from("funcionarios")
          .select("id, nome, ativo")
          .eq("id", String(motoboy))
          .eq("restaurante_id", dono.restaurante.id)
          .eq("funcao", "motoboy")
          .maybeSingle();
        if (!m || !m.ativo) {
          return NextResponse.json({ success: false, error: "Motoboy não encontrado ou bloqueado." }, { status: 400 });
        }
        dadosMotoboy = { motoboy_id: m.id, motoboy_nome: m.nome, motoboy_enviado_em: new Date().toISOString() };
      }

      const { data, error } = await supabaseAdmin
        .from("pedidos")
        .update(dadosMotoboy)
        .eq("id", id)
        .eq("restaurante_id", dono.restaurante.id)
        .not("status", "in", "(concluido,recusado,cancelado)")
        .select("id, motoboy_id, motoboy_nome, motoboy_enviado_em")
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return NextResponse.json({ success: false, error: "Pedido já finalizado ou não encontrado." }, { status: 404 });
      }
      return NextResponse.json({ success: true, pedido: data });
    }

    // Pix na chave do restaurante: o restaurante confirma que o dinheiro chegou.
    if (id && (pagamento === "recebido" || pagamento === "pendente")) {
      const { data, error } = await supabaseAdmin
        .from("pedidos")
        .update({ payment_status: pagamento === "recebido" ? "approved" : "pending" })
        .eq("id", id)
        .eq("restaurante_id", dono.restaurante.id)
        .eq("payment_method", "pix_chave")
        .select("id, payment_status")
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return NextResponse.json({ success: false, error: "Pedido não encontrado." }, { status: 404 });
      }
      return NextResponse.json({ success: true, pedido: data });
    }

    if (!id || !STATUS_PERMITIDOS.includes(status)) {
      return NextResponse.json({ success: false, error: "Status inválido." }, { status: 400 });
    }

    const mudancas: Record<string, unknown> = { status };
    if (status === "concluido") mudancas.entregue_em = new Date().toISOString();

    let { data, error } = await supabaseAdmin
      .from("pedidos")
      .update(mudancas)
      .eq("id", id)
      .eq("restaurante_id", dono.restaurante.id)
      .select("id, status, payment_method, payment_status")
      .maybeSingle();

    // Banco ainda sem o SQL 14 (coluna entregue_em): grava só o status.
    if (error && mudancas.entregue_em && (error.code === "42703" || error.code === "PGRST204")) {
      ({ data, error } = await supabaseAdmin
        .from("pedidos")
        .update({ status })
        .eq("id", id)
        .eq("restaurante_id", dono.restaurante.id)
        .select("id, status, payment_method, payment_status")
        .maybeSingle());
    }

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ success: false, error: "Pedido não encontrado." }, { status: 404 });
    }

    // Recusado/cancelado sai do histórico do cliente (selo e cupom voltam).
    // Se o pedido for reaberto, volta a contar.
    if (status === "recusado" || status === "cancelado") {
      await contabilizarPedido(data.id, false);
    } else if (data.payment_method !== "pix" || data.payment_status === "approved") {
      await contabilizarPedido(data.id, true);
    }

    // WhatsApp automático para o cliente (se o restaurante ligou).
    after(() => whatsappStatusPedido(data.id, status).catch(() => {}));

    return NextResponse.json({ success: true, pedido: { id: data.id, status: data.status } });
  } catch (error) {
    return erroInterno("painel/pedidos PATCH", error);
  }
}
