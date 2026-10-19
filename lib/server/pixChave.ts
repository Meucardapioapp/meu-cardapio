import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { gerarPixCopiaECola, type TipoChavePix } from "@/lib/pix";

export type PixChave = {
  ativo: boolean;
  tipo: TipoChavePix;
  chave: string;
  nome_recebedor: string;
  cidade: string;
};

/** Chave Pix do próprio restaurante (null se não cadastrou ou se o SQL 09 não rodou). */
export async function getPixChave(restauranteId: string): Promise<PixChave | null> {
  const { data, error } = await supabaseAdmin
    .from("pix_chave_restaurante")
    .select("ativo, tipo, chave, nome_recebedor, cidade")
    .eq("restaurante_id", restauranteId)
    .maybeSingle();

  if (error || !data) return null;
  return data as PixChave;
}

export async function pixChaveAtivo(restauranteId: string) {
  const pix = await getPixChave(restauranteId);
  return Boolean(pix?.ativo);
}

/** Dados que o cliente vê para pagar um pedido com Pix na chave do restaurante. */
export async function pixChaveDoPedido(pedido: {
  restaurante_id: string;
  total?: number | string | null;
  total_pago?: number | string | null;
  numero_pedido?: number | string | null;
}) {
  const pix = await getPixChave(String(pedido.restaurante_id));
  if (!pix) return null;

  const valor = Number(pedido.total_pago ?? pedido.total ?? 0);

  return {
    tipo: pix.tipo,
    chave: pix.chave,
    nome: pix.nome_recebedor,
    valor,
    copiaECola: gerarPixCopiaECola({
      tipo: pix.tipo,
      chave: pix.chave,
      nome: pix.nome_recebedor,
      cidade: pix.cidade,
      valor,
      identificador: `PEDIDO${pedido.numero_pedido ?? ""}`,
    }),
  };
}
