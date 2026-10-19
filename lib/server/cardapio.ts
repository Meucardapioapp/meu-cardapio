import "server-only";

import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { lerRestaurantePublico } from "@/lib/restaurantePublico";
import { restaurantePodeReceberPedidos } from "@/lib/server/assinatura";
import { getOperacao } from "@/lib/server/operacao";
import { agoraNoFuso } from "@/lib/horario";
import { promocaoAtiva, rotuloPromocao } from "@/lib/promocao";

/**
 * Tudo o que o cardápio público precisa, em poucas consultas paralelas
 * (antes eram 2 consultas por produto, feitas pelo celular do cliente).
 * `cache` evita repetir a busca entre o título da página (SEO) e a página.
 */
// Mesmas colunas que o SQL 05 esconde: nunca vão para a página.
const PRIVADO = /(auth_user|e_?mail|responsavel|telefone|celular|cpf|cnpj|documento|banco|agencia|conta|digito|recipient|pagarme|asaas|stripe|mercado|senha|password|token|secret|segredo|chave|api_?key|premium|assinatura|plano|trial|ip_|termos)/i;

function somentePublico<T extends Record<string, any>>(linha: T) {
  return Object.fromEntries(Object.entries(linha).filter(([k]) => !PRIVADO.test(k))) as T;
}

// "Mais pedidos": calculado no máximo a cada 10 min por restaurante.
const cacheMaisPedidos = new Map<string, { ate: number; ids: string[] }>();

async function maisPedidos(restauranteId: string) {
  const guardado = cacheMaisPedidos.get(restauranteId);
  if (guardado && guardado.ate > Date.now()) return guardado.ids;

  const desde = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("pedidos")
    .select("itens")
    .eq("restaurante_id", restauranteId)
    .gte("created_at", desde)
    .not("status", "in", "(recusado,cancelado)")
    .order("created_at", { ascending: false })
    .limit(400);

  const contagem = new Map<string, number>();
  if (!error) {
    for (const pedido of data ?? []) {
      for (const item of Array.isArray(pedido.itens) ? pedido.itens : []) {
        const id = String((item as any)?.id ?? "");
        if (id) contagem.set(id, (contagem.get(id) ?? 0) + Number((item as any)?.quantity || 1));
      }
    }
  }

  const ids = [...contagem.entries()]
    .filter(([, n]) => n >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id]) => id);

  cacheMaisPedidos.set(restauranteId, { ate: Date.now() + 10 * 60000, ids });
  if (cacheMaisPedidos.size > 1000) cacheMaisPedidos.delete(cacheMaisPedidos.keys().next().value as string);
  return ids;
}

// Nota média das avaliações (cache de 10 min).
type ResumoAvaliacoes = {
  media: number;
  total: number;
  comentarios: { nome: string | null; nota: number; comentario: string; data: string }[];
};
const cacheAvaliacoes = new Map<string, { ate: number; resumo: ResumoAvaliacoes | null }>();

async function resumoAvaliacoes(restauranteId: string): Promise<ResumoAvaliacoes | null> {
  const guardado = cacheAvaliacoes.get(restauranteId);
  if (guardado && guardado.ate > Date.now()) return guardado.resumo;

  const { data, error } = await supabaseAdmin
    .from("avaliacoes")
    .select("nota, comentario, nome, visivel, created_at")
    .eq("restaurante_id", restauranteId)
    .order("created_at", { ascending: false })
    .limit(500);

  let resumo: ResumoAvaliacoes | null = null;
  if (!error && data && data.length >= 3) {
    const soma = data.reduce((t: number, a: any) => t + Number(a.nota || 0), 0);
    resumo = {
      media: Math.round((soma / data.length) * 10) / 10,
      total: data.length,
      comentarios: data
        .filter((a: any) => a.visivel !== false && a.comentario)
        .slice(0, 10)
        .map((a: any) => ({
          nome: a.nome ?? null,
          nota: Number(a.nota),
          comentario: String(a.comentario),
          data: String(a.created_at),
        })),
    };
  }

  cacheAvaliacoes.set(restauranteId, { ate: Date.now() + 10 * 60000, resumo });
  if (cacheAvaliacoes.size > 1000) cacheAvaliacoes.delete(cacheAvaliacoes.keys().next().value as string);
  return resumo;
}

export const carregarCardapio = cache(async (slug: string) => {
  if (!slug || slug.length > 80) return null;

  const { data: restaurante } = await lerRestaurantePublico((tabela) =>
    supabaseAdmin.from(tabela).select("*").eq("slug", slug).maybeSingle()
  );

  if (!restaurante) return null;

  const id = String(restaurante.id);
  const restaurantePublico = somentePublico(restaurante);

  const [aparenciaRes, categoriasRes, produtosRes, operacao, planoAtivo, idsMaisPedidos, avaliacao, taxasRes] = await Promise.all([
    supabaseAdmin.from("aparencia").select("*").eq("restaurante_id", id).limit(1),
    supabaseAdmin.from("categorias").select("id, nome, ordem").eq("restaurante_id", id).order("ordem", { ascending: true }),
    supabaseAdmin
      .from("produtos")
      .select("*")
      .eq("restaurante_id", id)
      .eq("ativo", true)
      .order("ordem", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    getOperacao(id),
    restaurantePodeReceberPedidos(id),
    maisPedidos(id).catch(() => [] as string[]),
    resumoAvaliacoes(id).catch(() => null),
    supabaseAdmin
      .from("bairros_entrega")
      .select("valor")
      .eq("restaurante_id", id)
      .order("valor", { ascending: true })
      .limit(1),
  ]);
  const taxas = taxasRes.data;
  const taxaMinima = taxas?.length ? Number(taxas[0].valor || 0) : null;

  // Esgotado pelo estoque = some do cardápio.
  const produtos = (produtosRes.data ?? []).filter((p: any) => p.estoque == null || Number(p.estoque) > 0);
  const agora = agoraNoFuso((restaurante as any).uf);
  const ids = produtos.map((p: any) => p.id);

  const [adicionaisRes, gruposRes] = ids.length
    ? await Promise.all([
        supabaseAdmin.from("adicionais").select("*").in("produto_id", ids),
        supabaseAdmin
          .from("grupos_obrigatorios")
          .select("*, grupo_obrigatorio_opcoes(*)")
          .in("produto_id", ids)
          .order("ordem", { ascending: true }),
      ])
    : [{ data: [] as any[] }, { data: [] as any[] }];

  const adicionaisPorProduto = new Map<string, any[]>();
  for (const a of adicionaisRes.data ?? []) {
    const k = String(a.produto_id);
    if (!adicionaisPorProduto.has(k)) adicionaisPorProduto.set(k, []);
    adicionaisPorProduto.get(k)!.push(a);
  }

  const gruposPorProduto = new Map<string, any[]>();
  for (const g of gruposRes.data ?? []) {
    const k = String(g.produto_id);
    if (!gruposPorProduto.has(k)) gruposPorProduto.set(k, []);
    gruposPorProduto.get(k)!.push(g);
  }

  return {
    restaurante: restaurantePublico,
    aparencia: aparenciaRes.data?.[0] ?? null,
    categorias: (categoriasRes.data ?? []).map((c: any) => String(c.nome)),
    operacao,
    pedidosAtivos: planoAtivo && !operacao.pausado,
    avaliacao,
    taxaMinima,
    maisPedidos: idsMaisPedidos.filter((pid) => produtos.some((p: any) => String(p.id) === pid)).slice(0, 6),
    produtos: produtos.map((produto: any) => {
      const promoHoje = promocaoAtiva(produto, agora);
      return {
      id: produto.id,
      nome: produto.nome,
      descricao: produto.descricao,
      preco: promoHoje ? Number(produto.promo_preco) : Number(produto.preco),
      precoAntigo: promoHoje ? Number(produto.preco) : Number(produto.preco_antigo || 0),
      imagem: produto.imagem,
      categoria: produto.categoria || "Outros",
      promocao: promoHoje || produto.promocao === true,
      rotuloPromocao: promoHoje ? rotuloPromocao(produto) : null,
      estoque: produto.estoque ?? null,
      sugerirNoCarrinho: produto.sugerir_no_carrinho === true,
      adicionais: adicionaisPorProduto.get(String(produto.id)) ?? [],
      gruposObrigatorios: gruposPorProduto.get(String(produto.id)) ?? [],
      };
    }),
  };
});

export type DadosCardapio = NonNullable<Awaited<ReturnType<typeof carregarCardapio>>>;
