import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { textoDoPremio, type ProgramaFidelidade } from "@/lib/fidelidade";

/** Programa de fidelidade do restaurante (null = não existe ou está desligado). */
export async function getProgramaFidelidade(
  restauranteId: string,
  { mesmoDesligado = false } = {}
): Promise<ProgramaFidelidade | null> {
  let { data, error } = await supabaseAdmin
    .from("fidelidade")
    .select("*")
    .eq("restaurante_id", restauranteId)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    // Tabela antiga sem updated_at (SQL 04 ainda não rodado).
    ({ data, error } = await supabaseAdmin
      .from("fidelidade")
      .select("*")
      .eq("restaurante_id", restauranteId)
      .limit(1)
      .maybeSingle());
  }

  if (error) throw error;
  if (!data) return null;
  if (!data.ativo && !mesmoDesligado) return null;

  const programa: ProgramaFidelidade = {
    ativo: Boolean(data.ativo),
    pedidosNecessarios: Math.max(1, Number(data.pedidos_necessarios || 10)),
    tipoPremio: data.tipo_premio === "produto" ? "produto" : "dinheiro",
    valorDesconto: Number(data.valor_desconto || 0),
    premioDescricao: String(data.premio_descricao || "").trim(),
    textoPremio: "",
  };

  programa.textoPremio = textoDoPremio(programa);

  return programa;
}

/** Selos do cliente neste restaurante. */
export async function getSelosCliente(clienteId: string, restauranteId: string) {
  const { data } = await supabaseAdmin
    .from("cliente_fidelidade")
    .select("selos, desconto_disponivel")
    .eq("cliente_id", clienteId)
    .eq("restaurante_id", restauranteId)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  return {
    selos: Number(data?.selos || 0),
    descontoDisponivel: Boolean(data?.desconto_disponivel),
  };
}

/**
 * Conta (entrar = true) ou desconta (entrar = false) o pedido no
 * histórico do cliente, nos selos e no uso do cupom.
 * Cada pedido conta uma única vez (controle feito no banco).
 */
export async function contabilizarPedido(
  pedidoId: string | number,
  entrar: boolean,
  { pedidoNovo = false } = {}
) {
  const { error } = await supabaseAdmin.rpc("contabilizar_pedido", {
    p_pedido: pedidoId,
    p_entrar: entrar,
  });

  if (!error) return;

  console.error("[fidelidade] contabilizar_pedido", error.message);

  // Reserva enquanto o SQL 04 não foi rodado: soma só no histórico,
  // e só uma vez (na criação do pedido ou no Pix pago).
  if (!entrar || !pedidoNovo) return;

  const { data: pedido } = await supabaseAdmin
    .from("pedidos")
    .select("cliente_id, total")
    .eq("id", pedidoId)
    .maybeSingle();

  if (!pedido?.cliente_id) return;

  const { data: cliente } = await supabaseAdmin
    .from("clientes")
    .select("total_pedidos, total_gasto")
    .eq("id", pedido.cliente_id)
    .maybeSingle();

  await supabaseAdmin
    .from("clientes")
    .update({
      total_pedidos: (cliente?.total_pedidos ?? 0) + 1,
      total_gasto: (cliente?.total_gasto ?? 0) + Number(pedido.total || 0),
      ultimo_pedido: new Date(),
    })
    .eq("id", pedido.cliente_id);
}
