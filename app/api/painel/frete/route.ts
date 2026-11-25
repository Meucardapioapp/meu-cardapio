import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { erroInterno, getDonoAutenticado, naoAutenticado } from "@/lib/server/auth";
import { limitar } from "@/lib/server/rate-limit";
import { mensagemDeErroBanco } from "@/lib/server/erros";
import { enderecoDoRestaurante, geocodificar, getConfigFrete, normalizarFaixas } from "@/lib/server/frete";

/** Como o restaurante cobra a entrega + onde fica o restaurante no mapa. */
export async function GET(req: NextRequest) {
  try {
    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();

    const [config, endereco] = await Promise.all([
      getConfigFrete(dono.restaurante.id),
      enderecoDoRestaurante(dono.restaurante.id),
    ]);

    return NextResponse.json({
      success: true,
      ...config,
      temEndereco: Boolean(endereco.rua && endereco.cidade),
      cep: endereco.cep ?? "",
    });
  } catch (error) {
    return erroInterno("painel/frete GET", error);
  }
}

const esquema = z.union([
  z.object({
    acao: z.literal("salvar"),
    modo: z.enum(["bairro", "km"]),
    faixas: z
      .array(z.object({ ate_km: z.number().positive().max(100), valor: z.number().min(0).max(500) }))
      .max(20),
  }),
  // Ponto do restaurante a partir do CEP dele (mesmo cálculo usado no cliente).
  z.object({ acao: z.literal("localizar_cep"), cep: z.string().min(8).max(12) }),
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
      return NextResponse.json({ success: false, error: "Dados inválidos." }, { status: 400 });
    }

    const d = validacao.data;
    const restauranteId = dono.restaurante.id;

    if (d.acao === "salvar") {
      const faixas = normalizarFaixas(d.faixas);
      if (d.modo === "km" && faixas.length === 0) {
        return NextResponse.json({ success: false, error: "Cadastre pelo menos uma faixa de distância." }, { status: 400 });
      }

      const { error } = await supabaseAdmin.from("restaurante_operacao").upsert(
        { restaurante_id: restauranteId, frete_modo: d.modo, frete_faixas: faixas, updated_at: new Date().toISOString() },
        { onConflict: "restaurante_id" }
      );

      if (error) {
        const { status, mensagem } = mensagemDeErroBanco(error, "Não foi possível salvar. Rode o SQL 09 no Supabase.");
        return NextResponse.json({ success: false, error: mensagem }, { status });
      }
    } else {
      // localizar_cep: marca a origem do restaurante pelo CEP dele.
      if (!(await limitar(req, "painel-geocodificar", 10, 600))) {
        return NextResponse.json({ success: false, error: "Muitas buscas. Aguarde alguns minutos." }, { status: 429 });
      }
      const cepDig = d.cep.replace(/\D/g, "");
      if (cepDig.length !== 8) {
        return NextResponse.json({ success: false, error: "Informe um CEP válido (8 números)." }, { status: 400 });
      }
      const ponto = await geocodificar({ cep: cepDig }).catch(() => null);
      if (!ponto) {
        return NextResponse.json(
          { success: false, error: "Não achamos esse CEP no mapa. Confira os números." },
          { status: 400 }
        );
      }

      const { error } = await supabaseAdmin
        .from("restaurantes")
        .update({ latitude: ponto.lat, longitude: ponto.lon })
        .eq("id", restauranteId);

      if (error) {
        const { status, mensagem } = mensagemDeErroBanco(error, "Não foi possível salvar a localização. Rode o SQL 09 no Supabase.");
        return NextResponse.json({ success: false, error: mensagem }, { status });
      }
    }

    return NextResponse.json({ success: true, ...(await getConfigFrete(restauranteId)) });
  } catch (error) {
    return erroInterno("painel/frete PUT", error);
  }
}
