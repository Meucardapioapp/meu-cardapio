import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { acessoNegado, erroInterno, isDonoDaPlataforma } from "@/lib/server/auth";
import { getDadosFinanceiros, salvarDadosFinanceiros } from "@/lib/server/recebedor";
import { criptografar } from "@/lib/server/cripto";

/**
 * Uso único (só o dono da plataforma): criptografa os dados bancários
 * que já estavam salvos antes da criptografia existir.
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await isDonoDaPlataforma(req))) return acessoNegado();

    if (!process.env.DADOS_CRIPTO_CHAVE) {
      return NextResponse.json({ success: false, error: "Configure DADOS_CRIPTO_CHAVE primeiro." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.from("restaurantes_financeiro").select("restaurante_id");
    if (error) throw error;

    let total = 0;
    for (const linha of data ?? []) {
      const dados = await getDadosFinanceiros(String(linha.restaurante_id));
      if (!dados) continue;
      const { restaurante_id: _id, ...resto } = dados;
      await salvarDadosFinanceiros(String(linha.restaurante_id), resto);
      total += 1;
    }

    // CPF dos clientes finais que ainda estava em texto aberto
    let cpfs = 0;
    for (let rodada = 0; rodada < 50; rodada++) {
      const { data: clientes, error: erroCpf } = await supabaseAdmin
        .from("clientes")
        .select("id, cpf")
        .not("cpf", "is", null)
        .not("cpf", "like", "enc:v1:%")
        .limit(500);
      if (erroCpf || !clientes?.length) break;
      for (const c of clientes) {
        const limpo = String(c.cpf || "").replace(/\D/g, "");
        await supabaseAdmin.from("clientes").update({ cpf: limpo ? criptografar(limpo) : null }).eq("id", c.id);
        cpfs += 1;
      }
    }

    return NextResponse.json({ success: true, total, cpfsDeClientes: cpfs });
  } catch (error) {
    return erroInterno("criptografar-dados", error);
  }
}
