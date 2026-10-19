import { limitar } from "@/lib/server/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { erroInterno, getDonoAutenticado, naoAutenticado } from "@/lib/server/auth";
import { getProgramaFidelidade } from "@/lib/server/fidelidade";
import { mensagemDeErroBanco } from "@/lib/server/erros";

/** Programa de fidelidade do restaurante logado. */
export async function GET(req: NextRequest) {
  try {
    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();

    const programa = await getProgramaFidelidade(dono.restaurante.id, { mesmoDesligado: true });

    // Quantos clientes já estão com o prêmio liberado.
    let comPremio = 0;
    if (programa) {
      const { count } = await supabaseAdmin
        .from("cliente_fidelidade")
        .select("id", { count: "exact", head: true })
        .eq("restaurante_id", dono.restaurante.id)
        .gte("selos", programa.pedidosNecessarios);
      comPremio = count ?? 0;
    }

    return NextResponse.json({ success: true, programa, comPremio });
  } catch (error) {
    return erroInterno("painel/fidelidade GET", error);
  }
}

const esquema = z
  .object({
    ativo: z.boolean(),
    pedidosNecessarios: z.number().int().min(2).max(50),
    tipoPremio: z.enum(["dinheiro", "produto"]),
    valorDesconto: z.number().min(0).max(10000),
    premioDescricao: z.string().trim().max(80).optional().default(""),
  })
  .refine((d) => d.tipoPremio !== "dinheiro" || d.valorDesconto > 0, {
    message: "Informe o valor do desconto.",
  })
  .refine((d) => d.tipoPremio !== "produto" || d.premioDescricao.length >= 2, {
    message: "Escreva qual é o prêmio (ex.: 1 pizza doce).",
  });

export async function PUT(req: NextRequest) {
  try {
    if (!(await limitar(req, "painel-escrita", 60, 60))) {
      return NextResponse.json({ success: false, error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });
    }

    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();

    const validacao = esquema.safeParse(await req.json().catch(() => null));

    if (!validacao.success) {
      return NextResponse.json(
        { success: false, error: validacao.error.issues[0]?.message || "Dados inválidos." },
        { status: 400 }
      );
    }

    const d = validacao.data;
    const dados = {
      ativo: d.ativo,
      pedidos_necessarios: d.pedidosNecessarios,
      tipo_premio: d.tipoPremio,
      valor_desconto: d.tipoPremio === "dinheiro" ? Math.round(d.valorDesconto * 100) / 100 : 0,
      premio_descricao: d.tipoPremio === "produto" ? d.premioDescricao : null,
      updated_at: new Date().toISOString(),
    };

    const { data: existentes, error: erroLeitura } = await supabaseAdmin
      .from("fidelidade")
      .select("id")
      .eq("restaurante_id", dono.restaurante.id);

    if (erroLeitura) throw erroLeitura;

    const { error } = existentes && existentes.length > 0
      ? await supabaseAdmin.from("fidelidade").update(dados).eq("restaurante_id", dono.restaurante.id)
      : await supabaseAdmin.from("fidelidade").insert({ ...dados, restaurante_id: dono.restaurante.id });

    if (error) {
      const { status, mensagem } = mensagemDeErroBanco(error, "Não foi possível salvar.");
      return NextResponse.json({ success: false, error: mensagem }, { status });
    }

    // Atualiza quem já tem selos suficientes para o novo número de pedidos.
    await supabaseAdmin
      .from("cliente_fidelidade")
      .update({ desconto_disponivel: true })
      .eq("restaurante_id", dono.restaurante.id)
      .gte("selos", d.pedidosNecessarios);
    await supabaseAdmin
      .from("cliente_fidelidade")
      .update({ desconto_disponivel: false })
      .eq("restaurante_id", dono.restaurante.id)
      .lt("selos", d.pedidosNecessarios);

    const programa = await getProgramaFidelidade(dono.restaurante.id, { mesmoDesligado: true });

    return NextResponse.json({ success: true, programa });
  } catch (error) {
    return erroInterno("painel/fidelidade PUT", error);
  }
}
