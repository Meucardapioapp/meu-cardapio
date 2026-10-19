import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { calcularDescontoCupom, normalizarCodigoCupom } from "@/lib/fidelidade";

export type Cupom = {
  id: string;
  codigo: string;
  tipo: "percentual" | "valor";
  valor: number;
  pedido_minimo: number;
  limite_usos: number | null;
  uso_unico_por_cliente: boolean;
  valido_ate: string | null;
  ativo: boolean;
  usos: number;
};

export class CupomInvalidoError extends Error {}

const reais = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Confere se o cupom vale para este pedido e calcula o desconto
 * (sobre os produtos, sem a taxa de entrega). Lança CupomInvalidoError
 * com a mensagem para o cliente quando não vale.
 */
export async function aplicarCupom(params: {
  restauranteId: string;
  codigo: unknown;
  subtotal: number;
  clienteId?: string | null;
}) {
  const codigo = normalizarCodigoCupom(params.codigo);

  if (codigo.length < 3) {
    throw new CupomInvalidoError("Cupom inválido.");
  }

  const { data, error } = await supabaseAdmin
    .from("cupons")
    .select("*")
    .eq("restaurante_id", params.restauranteId)
    .eq("codigo", codigo)
    .maybeSingle();

  if (error) throw error;

  const cupom = data as Cupom | null;

  if (!cupom || !cupom.ativo) {
    throw new CupomInvalidoError("Cupom inválido ou desativado.");
  }

  if (cupom.valido_ate && new Date(cupom.valido_ate).getTime() < Date.now()) {
    throw new CupomInvalidoError("Este cupom já venceu.");
  }

  if (cupom.limite_usos != null && cupom.usos >= cupom.limite_usos) {
    throw new CupomInvalidoError("Este cupom já atingiu o limite de usos.");
  }

  const minimo = Number(cupom.pedido_minimo || 0);

  if (minimo > 0 && params.subtotal < minimo) {
    throw new CupomInvalidoError(`Este cupom vale para pedidos a partir de ${reais(minimo)}.`);
  }

  if (cupom.uso_unico_por_cliente && params.clienteId) {
    const { count } = await supabaseAdmin
      .from("pedidos")
      .select("id", { count: "exact", head: true })
      .eq("cupom_id", cupom.id)
      .eq("cliente_id", params.clienteId)
      .eq("contabilizado", true);

    if ((count ?? 0) > 0) {
      throw new CupomInvalidoError("Você já usou este cupom.");
    }
  }

  const desconto = calcularDescontoCupom(
    { tipo: cupom.tipo, valor: Number(cupom.valor) },
    params.subtotal
  );

  return { cupom, desconto };
}
