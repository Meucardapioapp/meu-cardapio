import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { erroInterno, getDonoAutenticado, naoAutenticado } from "@/lib/server/auth";
import { limitar } from "@/lib/server/rate-limit";
import { chaveComplemento, estaPausado } from "@/lib/complementos";
import { carregarComplementos, temColunaPausado } from "@/lib/server/complementos";

/**
 * Complementos do restaurante logado (opções das escolhas obrigatórias e
 * adicionais), agrupados pelo nome. Pausar "Leite condensado" pausa em todos
 * os produtos de uma vez; ativar faz voltar em todos.
 */

export async function GET(req: NextRequest) {
  try {
    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();

    const itens = await carregarComplementos(dono.restaurante.id);
    const colunaExiste = await temColunaPausado(itens);

    type Resumo = {
      nome: string;
      total: number;
      pausados: number;
      produtos: Set<string>;
      preco: number;
      descricao: string;
      comoOpcao: boolean;
      comoAdicional: boolean;
    };
    const porNome = new Map<string, Resumo>();
    for (const i of itens) {
      const k = chaveComplemento(i.nome);
      if (!k) continue;
      if (!porNome.has(k)) {
        porNome.set(k, {
          nome: String(i.nome).trim(),
          total: 0,
          pausados: 0,
          produtos: new Set(),
          preco: i.preco,
          descricao: i.descricao,
          comoOpcao: false,
          comoAdicional: false,
        });
      }
      const c = porNome.get(k)!;
      c.total++;
      if (estaPausado(i)) c.pausados++;
      if (i.produto) c.produtos.add(i.produto);
      if (!c.descricao && i.descricao) c.descricao = i.descricao;
      if (i.tabela === "opcao") c.comoOpcao = true;
      else c.comoAdicional = true;
    }

    const complementos = [...porNome.values()]
      .map((c) => ({
        nome: c.nome,
        // Pausado em algum produto = pausado (o próximo toque acerta todos).
        pausado: c.pausados > 0,
        parcial: c.pausados > 0 && c.pausados < c.total,
        produtos: [...c.produtos].sort((a, b) => a.localeCompare(b, "pt-BR")),
        preco: c.preco,
        descricao: c.descricao,
        comoOpcao: c.comoOpcao,
        comoAdicional: c.comoAdicional,
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

    return NextResponse.json({ success: true, colunaExiste, complementos });
  } catch (error) {
    return erroInterno("painel/complementos GET", error);
  }
}

const esquema = z.object({ nome: z.string().min(1).max(150), pausado: z.boolean() });

export async function POST(req: NextRequest) {
  try {
    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();

    if (!(await limitar(req, "painel-complemento", 120, 60))) {
      return NextResponse.json({ success: false, error: "Muitas alterações seguidas. Aguarde um pouco." }, { status: 429 });
    }

    const lido = esquema.safeParse(await req.json().catch(() => null));
    if (!lido.success) return NextResponse.json({ success: false, error: "Complemento inválido." }, { status: 400 });

    const alvo = chaveComplemento(lido.data.nome);
    const itens = (await carregarComplementos(dono.restaurante.id)).filter((i) => chaveComplemento(i.nome) === alvo);
    if (!itens.length) return NextResponse.json({ success: false, error: "Complemento não encontrado." }, { status: 404 });

    const opcoes = itens.filter((i) => i.tabela === "opcao").map((i) => i.id);
    const adicionais = itens.filter((i) => i.tabela === "adicional").map((i) => i.id);

    // Os IDs vieram dos produtos deste restaurante (carregarItens), então só mexe no que é dele.
    const [r1, r2] = await Promise.all([
      opcoes.length
        ? supabaseAdmin.from("grupo_obrigatorio_opcoes").update({ pausado: lido.data.pausado }).in("id", opcoes)
        : Promise.resolve({ error: null }),
      adicionais.length
        ? supabaseAdmin.from("adicionais").update({ pausado: lido.data.pausado }).in("id", adicionais)
        : Promise.resolve({ error: null }),
    ]);

    const erro = r1.error || r2.error;
    if (erro) {
      const msg = String((erro as any).message || "");
      if (msg.includes("pausado")) {
        return NextResponse.json(
          { success: false, error: "Falta rodar o SQL 23 no Supabase para poder pausar complementos." },
          { status: 400 }
        );
      }
      throw erro;
    }

    return NextResponse.json({ success: true, alterados: itens.length });
  } catch (error) {
    return erroInterno("painel/complementos POST", error);
  }
}
