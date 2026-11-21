import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Escolhas do dono que ficam em configuracoes_pagamento:
 *  - pix_online: false = Pix online desligado (os dados bancários continuam lá);
 *  - retirada:   false = "Só trabalho com delivery".
 * Sem linha ou antes do SQL 25, os dois valem como ligados.
 */
export type FormasPedido = {
  dinheiro: boolean;
  cartao_entrega: boolean;
  pix_online: boolean;
  retirada: boolean;
  existe: boolean;
  colunasNovas: boolean;
};

export async function lerFormasPedido(restauranteId: string | number): Promise<FormasPedido> {
  const { data } = await supabaseAdmin
    .from("configuracoes_pagamento")
    .select("*")
    .eq("restaurante_id", restauranteId)
    .maybeSingle();

  const linha = (data ?? {}) as Record<string, unknown>;
  return {
    dinheiro: data ? Boolean(linha.dinheiro) : true,
    cartao_entrega: data ? Boolean(linha.cartao_entrega) : true,
    pix_online: linha.pix_online !== false,
    retirada: linha.retirada !== false,
    existe: Boolean(data),
    colunasNovas: data ? "pix_online" in linha && "retirada" in linha : true,
  };
}

/** Liga/desliga pix_online ou retirada, sem mexer no resto. */
export async function mudarFormaPedido(restauranteId: string | number, campo: "pix_online" | "retirada", ativo: boolean) {
  const atual = await lerFormasPedido(restauranteId);
  const { error } = await supabaseAdmin.from("configuracoes_pagamento").upsert(
    {
      restaurante_id: restauranteId,
      // Linha nova: mantém o padrão do cardápio (dinheiro e cartão ligados).
      dinheiro: atual.dinheiro,
      cartao_entrega: atual.cartao_entrega,
      [campo]: ativo,
    },
    { onConflict: "restaurante_id" }
  );
  if (error) throw error;
}
