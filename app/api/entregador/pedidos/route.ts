import { NextRequest, NextResponse, after } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { erroInterno } from "@/lib/server/auth";
import { limitar } from "@/lib/server/rate-limit";
import { getMotoboyLogado } from "@/lib/server/motoboy";
import { contabilizarPedido } from "@/lib/server/fidelidade";
import { whatsappStatusPedido } from "@/lib/server/notificacoes";

const FECHADOS = ["concluido", "recusado", "cancelado"];

function semSessao() {
  return NextResponse.json({ success: false, error: "Entre com seu celular e PIN.", sair: true }, { status: 401 });
}

/** Pedidos enviados para o motoboy logado. */
export async function GET(req: NextRequest) {
  try {
    const motoboys = await getMotoboyLogado(req);
    if (!motoboys) return semSessao();

    const ids = motoboys.map((m) => m.id);
    const desde = new Date(Date.now() - 36 * 3600 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
      .from("pedidos")
      .select(
        "id, numero_pedido, restaurante_id, motoboy_id, cliente, telefone, rua, numero, bairro, complemento, referencia, observacoes, itens, total, total_pago, taxa_entrega, troco_para, payment_method, payment_status, status, distancia_km, motoboy_enviado_em, motoboy_saiu_em, entregue_em, created_at"
      )
      .in("motoboy_id", ids)
      .gte("motoboy_enviado_em", desde)
      .order("motoboy_enviado_em", { ascending: true })
      .limit(150);

    if (error) throw error;

    const restIds = [...new Set(motoboys.map((m) => m.restaurante_id))];
    const { data: rests } = await supabaseAdmin
      .from("restaurantes")
      .select("id, nome_restaurante, whatsapp, cidade, estado")
      .in("id", restIds);

    const restaurantes = Object.fromEntries(
      (rests ?? []).map((r: any) => [
        String(r.id),
        { nome: r.nome_restaurante || "", whatsapp: r.whatsapp || "", cidade: r.cidade || "", estado: r.estado || "" },
      ])
    );

    const tresHoras = Date.now() - 3 * 3600 * 1000;
    const pedidos = data ?? [];

    const ativos = pedidos.filter((p) => !FECHADOS.includes(p.status));

    // Entregues: só o resumo (sem telefone nem endereço completo do cliente).
    const entregues = pedidos
      .filter((p) => p.status === "concluido")
      .map((p) => ({
        id: p.id,
        numero_pedido: p.numero_pedido,
        restaurante_id: p.restaurante_id,
        bairro: p.bairro,
        taxa_entrega: p.taxa_entrega,
        entregue_em: p.entregue_em || p.motoboy_enviado_em,
      }))
      .reverse();

    const cancelados = pedidos
      .filter((p) => (p.status === "cancelado" || p.status === "recusado") && new Date(p.motoboy_enviado_em).getTime() > tresHoras)
      .map((p) => ({ id: p.id, numero_pedido: p.numero_pedido, restaurante_id: p.restaurante_id, bairro: p.bairro }));

    return NextResponse.json({
      success: true,
      motoboy: { nome: motoboys[0].nome, telefone: motoboys[0].telefone },
      restaurantes,
      ativos,
      entregues,
      cancelados,
    });
  } catch (error) {
    return erroInterno("entregador/pedidos GET", error);
  }
}

/** "Saí para entrega" e "Entreguei". */
export async function PATCH(req: NextRequest) {
  try {
    if (!(await limitar(req, "motoboy-acao", 60, 60))) {
      return NextResponse.json({ success: false, error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });
    }

    const motoboys = await getMotoboyLogado(req);
    if (!motoboys) return semSessao();

    const body = await req.json().catch(() => ({}));
    const id = Number(body?.id);
    const acao = body?.acao;

    if (!Number.isFinite(id) || (acao !== "saiu" && acao !== "entregue")) {
      return NextResponse.json({ success: false, error: "Ação inválida." }, { status: 400 });
    }

    const { data: pedido } = await supabaseAdmin
      .from("pedidos")
      .select("id, status, payment_method, payment_status, motoboy_saiu_em")
      .eq("id", id)
      .in("motoboy_id", motoboys.map((m) => m.id))
      .maybeSingle();

    if (!pedido) {
      return NextResponse.json({ success: false, error: "Este pedido não está mais com você." }, { status: 404 });
    }

    if (FECHADOS.includes(pedido.status)) {
      const msg = pedido.status === "concluido" ? "Este pedido já foi entregue." : "O restaurante cancelou este pedido.";
      return NextResponse.json({ success: false, error: msg }, { status: 409 });
    }

    const agora = new Date().toISOString();
    const status = acao === "saiu" ? "entrega" : "concluido";
    const mudancas: Record<string, unknown> = { status };
    if (acao === "saiu" || !pedido.motoboy_saiu_em) mudancas.motoboy_saiu_em = pedido.motoboy_saiu_em || agora;
    if (acao === "entregue") mudancas.entregue_em = agora;

    const { error } = await supabaseAdmin.from("pedidos").update(mudancas).eq("id", id);
    if (error) throw error;

    if (pedido.payment_method !== "pix" || pedido.payment_status === "approved") {
      await contabilizarPedido(id, true);
    }

    if (pedido.status !== status) {
      after(() => whatsappStatusPedido(id, status).catch(() => {}));
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    return erroInterno("entregador/pedidos PATCH", error);
  }
}
