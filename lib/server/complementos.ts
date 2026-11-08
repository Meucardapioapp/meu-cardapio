import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { GRUPO_ADICIONAIS, chaveDoComplemento, estaPausado } from "@/lib/complementos";

/**
 * Todos os complementos do restaurante: opções das escolhas obrigatórias e
 * adicionais de todos os produtos. Grupo + nome ligam um ao outro: o
 * "Chocolate" em "Coberturas" do Açaí 300ml e do Açaí 500ml são o mesmo
 * complemento; o "Morango" de "Frutas" e o de "Cremes" são diferentes.
 */
export type ItemComplemento = {
  id: string | number;
  nome: string;
  grupo: string;
  preco: number;
  descricao: string;
  pausado?: boolean;
  produto: string;
  tabela: "opcao" | "adicional";
};

export async function carregarComplementos(restauranteId: string | number) {
  const { data: produtos, error } = await supabaseAdmin
    .from("produtos")
    .select("id, nome")
    .eq("restaurante_id", restauranteId);
  if (error) throw error;

  const ids = (produtos ?? []).map((p: any) => p.id);
  if (!ids.length) return [] as ItemComplemento[];
  const nomeProduto = new Map((produtos ?? []).map((p: any) => [String(p.id), String(p.nome)]));

  const [gruposRes, adicionaisRes] = await Promise.all([
    supabaseAdmin.from("grupos_obrigatorios").select("id, produto_id, nome, grupo_obrigatorio_opcoes(*)").in("produto_id", ids),
    supabaseAdmin.from("adicionais").select("*").in("produto_id", ids),
  ]);
  if (gruposRes.error) throw gruposRes.error;
  if (adicionaisRes.error) throw adicionaisRes.error;

  const itens: ItemComplemento[] = [];
  for (const g of gruposRes.data ?? []) {
    for (const o of (g as any).grupo_obrigatorio_opcoes ?? []) {
      itens.push({
        id: o.id,
        nome: o.nome,
        grupo: String((g as any).nome || "").trim() || "Escolha",
        preco: Number(o.preco || 0),
        descricao: o.descricao || "",
        pausado: o.pausado,
        produto: nomeProduto.get(String((g as any).produto_id)) ?? "",
        tabela: "opcao",
      });
    }
  }
  for (const a of adicionaisRes.data ?? []) {
    itens.push({
      id: a.id,
      nome: a.nome,
      grupo: GRUPO_ADICIONAIS,
      preco: Number(a.preco || 0),
      descricao: a.descricao || "",
      pausado: a.pausado,
      produto: nomeProduto.get(String(a.produto_id)) ?? "",
      tabela: "adicional",
    });
  }
  return itens;
}

/** O banco já tem a coluna "pausado" (SQL 23)? Sem itens, tenta ler direto. */
export async function temColunaPausado(itens: ItemComplemento[]) {
  if (itens.length) return itens.some((i) => typeof i.pausado === "boolean");
  const { error } = await supabaseAdmin.from("adicionais").select("pausado").limit(1);
  return !error;
}

/** Complementos pausados do restaurante (grupo + nome, normalizados). */
export function nomesPausados(itens: ItemComplemento[]) {
  return new Set(itens.filter((i) => estaPausado(i)).map((i) => chaveDoComplemento(i.grupo, i.nome)));
}
