import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { erroInterno, getDonoAutenticado, naoAutenticado } from "@/lib/server/auth";
import { limitar } from "@/lib/server/rate-limit";
import { mensagemDeErroBanco } from "@/lib/server/erros";
import { SenhaInvalidaError, confirmarSenhaDoDono } from "@/lib/server/confirmar-senha";
import { getPixChave } from "@/lib/server/pixChave";
import { normalizarChavePix, validarChavePix } from "@/lib/pix";

/** Pix na chave do próprio restaurante (sem taxa da plataforma). */
export async function GET(req: NextRequest) {
  try {
    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();
    return NextResponse.json({ success: true, pix: await getPixChave(dono.restaurante.id) });
  } catch (error) {
    return erroInterno("painel/pix-chave GET", error);
  }
}

const esquema = z.union([
  // Ligar/desligar sem trocar a chave
  z.object({ acao: z.literal("ativo"), ativo: z.boolean() }),
  // Cadastrar ou trocar a chave: pede a senha (protege contra sessão roubada)
  z.object({
    acao: z.literal("salvar"),
    tipo: z.enum(["cpf", "cnpj", "celular", "email", "aleatoria"]),
    chave: z.string().min(1).max(77),
    nome: z.string().min(2).max(60),
    cidade: z.string().min(2).max(60),
    senha: z.string().max(200),
  }),
]);

export async function PUT(req: NextRequest) {
  try {
    if (!(await limitar(req, "painel-escrita", 60, 60))) {
      return NextResponse.json({ success: false, error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });
    }

    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();

    const validacao = esquema.safeParse(await req.json().catch(() => null));
    if (!validacao.success) {
      return NextResponse.json({ success: false, error: "Confira os dados da chave Pix." }, { status: 400 });
    }

    const d = validacao.data;
    const restauranteId = dono.restaurante.id;

    if (d.acao === "ativo") {
      const atual = await getPixChave(restauranteId);
      if (!atual) {
        return NextResponse.json({ success: false, error: "Cadastre a chave Pix primeiro." }, { status: 400 });
      }
      const { error } = await supabaseAdmin
        .from("pix_chave_restaurante")
        .update({ ativo: d.ativo, updated_at: new Date().toISOString() })
        .eq("restaurante_id", restauranteId);
      if (error) throw error;
      return NextResponse.json({ success: true, pix: { ...atual, ativo: d.ativo } });
    }

    const problema = validarChavePix(d.tipo, d.chave);
    if (problema) return NextResponse.json({ success: false, error: problema }, { status: 400 });

    try {
      await confirmarSenhaDoDono(dono, d.senha);
    } catch (e) {
      if (e instanceof SenhaInvalidaError) {
        return NextResponse.json({ success: false, error: e.message }, { status: e.status });
      }
      throw e;
    }

    const linha = {
      restaurante_id: restauranteId,
      ativo: true,
      tipo: d.tipo,
      chave: normalizarChavePix(d.tipo, d.chave),
      nome_recebedor: d.nome.trim().slice(0, 25),
      cidade: d.cidade.trim().slice(0, 15),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin.from("pix_chave_restaurante").upsert(linha, { onConflict: "restaurante_id" });

    if (error) {
      const { status, mensagem } = mensagemDeErroBanco(error, "Não foi possível salvar. Rode o SQL 09 no Supabase.");
      return NextResponse.json({ success: false, error: mensagem }, { status });
    }

    return NextResponse.json({ success: true, pix: await getPixChave(restauranteId) });
  } catch (error) {
    return erroInterno("painel/pix-chave PUT", error);
  }
}
