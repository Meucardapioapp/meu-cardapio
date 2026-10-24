import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { erroInterno, getDonoAutenticado, naoAutenticado } from "@/lib/server/auth";
import { limitar } from "@/lib/server/rate-limit";
import { mensagemDeErroBanco } from "@/lib/server/erros";

/**
 * Salva um produto INTEIRO (dados, escolhas obrigatórias, opções e
 * adicionais) numa única chamada, do restaurante LOGADO.
 *
 * Antes o navegador gravava parte por parte: se a internet do celular
 * oscilasse no meio, o produto ficava salvo e a tela dizia "não foi
 * possível salvar" (e, na edição, podia sumir com as opções).
 *
 * Agora é "tudo ou nada": se algo falhar, o servidor desfaz o que já tinha
 * feito e devolve o motivo real.
 */

const dinheiro = z.number().finite().min(0).max(100000);
const texto = (max: number) => z.string().max(max);

const esquema = z.object({
  id: z.union([z.string().min(1).max(64), z.number()]).nullable().optional(),
  produto: z.object({
    nome: texto(150).min(1),
    descricao: texto(2000).default(""),
    categoria: texto(150).min(1),
    preco: dinheiro,
    preco_antigo: dinheiro.nullable(),
    promocao: z.boolean(),
    imagem: texto(2000).default(""),
    // Campos do SQL 08: só vêm quando o banco já tem as colunas (ou quando usados).
    promo_preco: dinheiro.nullable().optional(),
    promo_dias: z.array(z.number().int().min(0).max(6)).max(7).nullable().optional(),
    promo_inicio: texto(8).nullable().optional(),
    promo_fim: texto(8).nullable().optional(),
    estoque: z.number().int().min(0).max(1000000).nullable().optional(),
    sugerir_no_carrinho: z.boolean().optional(),
  }),
  grupos: z
    .array(
      z.object({
        nome: texto(150).min(1),
        minimo: z.number().int().min(0).max(999),
        maximo: z.number().int().min(1).max(999),
        regra_preco: z.enum(["soma", "maior", "media"]).optional(),
        opcoes: z
          .array(
            z.object({
              nome: texto(150).min(1),
              descricao: texto(500).nullable().optional(),
              preco: dinheiro,
            })
          )
          .min(1)
          .max(200),
      })
    )
    .max(30),
  adicionais: z
    .array(
      z.object({
        nome: texto(150).min(1),
        preco: dinheiro,
        descricao: texto(300).optional(),
      })
    )
    .max(200),
});

type Corpo = z.infer<typeof esquema>;

function erro(mensagem: string, status = 400) {
  return NextResponse.json({ success: false, error: mensagem }, { status });
}

function erroBanco(e: unknown, generica: string) {
  const { status, mensagem } = mensagemDeErroBanco(e, generica);
  return erro(mensagem, status);
}

/** Grava as escolhas, opções e adicionais. Devolve o que criou (para desfazer se precisar). */
async function gravarFilhos(produtoId: string | number, corpo: Corpo) {
  const criados = { grupos: [] as (string | number)[], adicionais: [] as (string | number)[] };

  try {
    for (const [ordem, g] of corpo.grupos.entries()) {
      const { data: grupo, error } = await supabaseAdmin
        .from("grupos_obrigatorios")
        .insert({
          produto_id: produtoId,
          nome: g.nome.trim(),
          ordem,
          minimo: g.minimo,
          maximo: g.maximo,
          // só envia quando não é o padrão (funciona antes do SQL 08)
          ...(g.regra_preco && g.regra_preco !== "soma" ? { regra_preco: g.regra_preco } : {}),
        })
        .select("id")
        .single();
      if (error) throw error;
      criados.grupos.push(grupo.id);

      const opcoes = g.opcoes.map((o, i) => ({
        grupo_id: grupo.id,
        nome: o.nome.trim(),
        descricao: o.descricao?.trim() || null,
        preco: o.preco,
        imagem: "",
        ordem: i,
      }));
      const { error: erroOpcoes } = await supabaseAdmin.from("grupo_obrigatorio_opcoes").insert(opcoes);
      if (erroOpcoes) throw erroOpcoes;
    }

    if (corpo.adicionais.length) {
      const { data, error } = await supabaseAdmin
        .from("adicionais")
        .insert(
          corpo.adicionais.map((a) => ({
            produto_id: produtoId,
            nome: a.nome.trim(),
            preco: a.preco,
            // Ingredientes só vão quando preenchidos (funciona mesmo antes do SQL 12).
            ...(a.descricao?.trim() ? { descricao: a.descricao.trim().slice(0, 300) } : {}),
          }))
        )
        .select("id");
      if (error) throw error;
      criados.adicionais = (data ?? []).map((a) => a.id);
    }
  } catch (e) {
    await apagarFilhos(criados.grupos, criados.adicionais).catch(() => {});
    throw e;
  }

  return criados;
}

async function apagarFilhos(grupos: (string | number)[], adicionais: (string | number)[]) {
  if (grupos.length) {
    await supabaseAdmin.from("grupo_obrigatorio_opcoes").delete().in("grupo_id", grupos);
    await supabaseAdmin.from("grupos_obrigatorios").delete().in("id", grupos);
  }
  if (adicionais.length) {
    await supabaseAdmin.from("adicionais").delete().in("id", adicionais);
  }
}

export async function POST(req: NextRequest) {
  try {
    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();

    if (!(await limitar(req, "painel-produto", 60, 60))) {
      return erro("Muitas tentativas. Aguarde um pouco.", 429);
    }

    const lido = esquema.safeParse(await req.json().catch(() => null));
    if (!lido.success) return erro("Confira os dados do produto e tente de novo.");
    const corpo = lido.data;
    const restauranteId = dono.restaurante.id;

    // Mesma regra da tela: preço R$ 0,00 só com uma escolha obrigatória
    // em que todas as opções têm preço (o cliente nunca pede de graça).
    if (corpo.produto.preco <= 0) {
      const garantido = corpo.grupos.some((g) => g.minimo > 0 && g.opcoes.every((o) => o.preco > 0));
      if (!garantido) {
        return erro("Informe o preço do produto. Ele só pode ficar em R$ 0,00 se houver uma escolha obrigatória com preço em todas as opções.");
      }
    }

    const dados = { ...corpo.produto, nome: corpo.produto.nome.trim(), descricao: corpo.produto.descricao.trim() };

    // ---------------- produto novo ----------------
    if (corpo.id == null || corpo.id === "") {
      const { data: novo, error } = await supabaseAdmin
        .from("produtos")
        .insert({ ...dados, restaurante_id: restauranteId, destaque: "normal", ativo: true })
        .select("id")
        .single();
      if (error) return erroBanco(error, "Não foi possível salvar o produto. Tente de novo.");

      try {
        await gravarFilhos(novo.id, corpo);
      } catch (e) {
        // Desfaz: nada fica salvo pela metade.
        await supabaseAdmin.from("produtos").delete().eq("id", novo.id).eq("restaurante_id", restauranteId);
        console.error("[painel/produtos] filhos (novo)", e instanceof Error ? e.message : e);
        return erroBanco(e, "Não foi possível salvar as opções do produto. Nada foi salvo; tente de novo.");
      }

      return NextResponse.json({ success: true, id: novo.id, novo: true });
    }

    // ---------------- edição ----------------
    const { data: antigo, error: erroLeitura } = await supabaseAdmin
      .from("produtos")
      .select("*")
      .eq("id", corpo.id)
      .eq("restaurante_id", restauranteId)
      .maybeSingle();
    if (erroLeitura) return erroBanco(erroLeitura, "Não foi possível salvar o produto. Tente de novo.");
    if (!antigo) return erro("Produto não encontrado.", 404);

    const [{ data: gruposAntigos }, { data: adicionaisAntigos }] = await Promise.all([
      supabaseAdmin.from("grupos_obrigatorios").select("id").eq("produto_id", antigo.id),
      supabaseAdmin.from("adicionais").select("id").eq("produto_id", antigo.id),
    ]);

    const { error: erroUpdate } = await supabaseAdmin
      .from("produtos")
      .update(dados)
      .eq("id", antigo.id)
      .eq("restaurante_id", restauranteId);
    if (erroUpdate) return erroBanco(erroUpdate, "Não foi possível salvar o produto. Tente de novo.");

    // Grava as opções novas ANTES de apagar as antigas: se algo falhar,
    // as antigas continuam lá e o produto volta a ser como era.
    try {
      await gravarFilhos(antigo.id, corpo);
    } catch (e) {
      const volta: Record<string, unknown> = {};
      for (const campo of Object.keys(dados)) volta[campo] = (antigo as Record<string, unknown>)[campo];
      await supabaseAdmin.from("produtos").update(volta).eq("id", antigo.id).eq("restaurante_id", restauranteId);
      console.error("[painel/produtos] filhos (edição)", e instanceof Error ? e.message : e);
      return erroBanco(e, "Não foi possível salvar as alterações. O produto continua como estava; tente de novo.");
    }

    await apagarFilhos(
      (gruposAntigos ?? []).map((g) => g.id),
      (adicionaisAntigos ?? []).map((a) => a.id)
    ).catch((e) => console.error("[painel/produtos] apagar antigos", e instanceof Error ? e.message : e));

    return NextResponse.json({ success: true, id: antigo.id, novo: false });
  } catch (error) {
    return erroInterno("painel/produtos", error);
  }
}
