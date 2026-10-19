import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { acessoSalao, respostaErro, semAcesso } from "@/lib/server/salao-auth";
import { getConfigSalao } from "@/lib/server/salao";
import { agoraNoFuso } from "@/lib/horario";
import { precoAgora } from "@/lib/promocao";

/** Cardápio do salão: o mesmo do delivery, sem fotos (rápido no celular do garçom). */
export async function GET(req: NextRequest) {
  try {
    const acesso = await acessoSalao(req, ["painel", "garcom"]);
    if (!acesso) return semAcesso();
    const id = acesso.restauranteId;

    const [{ data: restaurante }, { data: categorias }, { data: produtos }, config] = await Promise.all([
      supabaseAdmin.from("restaurantes").select("uf").eq("id", id).maybeSingle(),
      supabaseAdmin.from("categorias").select("nome, ordem").eq("restaurante_id", id).order("ordem", { ascending: true }),
      supabaseAdmin
        .from("produtos")
        .select("*")
        .eq("restaurante_id", id)
        .eq("ativo", true)
        .order("ordem", { ascending: true, nullsFirst: false })
        .order("nome", { ascending: true }),
      getConfigSalao(id),
    ]);

    const lista = (produtos ?? []).filter((p: any) => p.estoque == null || Number(p.estoque) > 0);
    const ids = lista.map((p: any) => p.id);
    const agora = agoraNoFuso((restaurante as any)?.uf);

    const [{ data: adicionais }, { data: grupos }] = ids.length
      ? await Promise.all([
          supabaseAdmin.from("adicionais").select("id, produto_id, nome, preco").in("produto_id", ids),
          supabaseAdmin
            .from("grupos_obrigatorios")
            .select("id, produto_id, nome, minimo, maximo, regra_preco, ordem, grupo_obrigatorio_opcoes(id, nome, preco)")
            .in("produto_id", ids)
            .order("ordem", { ascending: true }),
        ])
      : [{ data: [] as any[] }, { data: [] as any[] }];

    const ordemCategorias = (categorias ?? []).map((c: any) => String(c.nome));
    const usadas = [...new Set(lista.map((p: any) => String(p.categoria || "Outros")))];
    const categoriasFinais = [...ordemCategorias.filter((c) => usadas.includes(c)), ...usadas.filter((c) => !ordemCategorias.includes(c))];

    return NextResponse.json({
      success: true,
      config: { taxa_percentual: config.taxa_percentual, taxa_ligada_padrao: config.taxa_ligada_padrao },
      categorias: categoriasFinais,
      produtos: lista.map((p: any) => ({
        id: String(p.id),
        nome: p.nome,
        preco: precoAgora(p, agora),
        categoria: String(p.categoria || "Outros"),
        adicionais: (adicionais ?? [])
          .filter((a: any) => String(a.produto_id) === String(p.id))
          .map((a: any) => ({ id: String(a.id), nome: a.nome, preco: Number(a.preco || 0) })),
        grupos: (grupos ?? [])
          .filter((g: any) => String(g.produto_id) === String(p.id))
          .map((g: any) => ({
            id: String(g.id),
            nome: g.nome,
            minimo: Number(g.minimo ?? 0),
            maximo: Number(g.maximo ?? 999),
            regra: g.regra_preco || "soma",
            opcoes: (g.grupo_obrigatorio_opcoes ?? []).map((o: any) => ({ id: String(o.id), nome: o.nome, preco: Number(o.preco || 0) })),
          })),
      })),
    });
  } catch (e) {
    return respostaErro(e, "salao/cardapio");
  }
}
