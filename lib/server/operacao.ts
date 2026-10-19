import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";

export type Operacao = {
  pausado: boolean;
  /** null = pausado até o dono reativar. */
  pausadoAte: string | null;
  tempoEntregaMin: number | null;
  tempoEntregaMax: number | null;
  tempoRetirada: number | null;
  /** Avisar o cliente pelo WhatsApp a cada mudança do pedido. */
  whatsappCliente: boolean;
};

const PADRAO: Operacao = {
  pausado: false,
  pausadoAte: null,
  tempoEntregaMin: null,
  tempoEntregaMax: null,
  tempoRetirada: null,
  whatsappCliente: false,
};

/** Pausa de pedidos e tempos de preparo/entrega do restaurante. */
export async function getOperacao(restauranteId: string): Promise<Operacao> {
  const { data, error } = await supabaseAdmin
    .from("restaurante_operacao")
    .select("*")
    .eq("restaurante_id", restauranteId)
    .maybeSingle();

  if (error || !data) return PADRAO; // tabela ainda não criada (SQL 08) = sem pausa

  const ate = data.pausado_ate ? new Date(data.pausado_ate).getTime() : 0;
  const pausado = Boolean(data.pausa_indefinida) || ate > Date.now();

  return {
    pausado,
    pausadoAte: pausado && !data.pausa_indefinida && ate ? new Date(ate).toISOString() : null,
    tempoEntregaMin: data.tempo_entrega_min ?? null,
    tempoEntregaMax: data.tempo_entrega_max ?? null,
    tempoRetirada: data.tempo_retirada ?? null,
    whatsappCliente: Boolean(data.whatsapp_cliente),
  };
}
