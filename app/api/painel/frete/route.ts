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
  // Ponto no mapa a partir do endereço cadastrado do restaurante
  z.object({ acao: z.literal("localizar_endereco") }),
  // Ponto exato pelo GPS do aparelho (o dono está no restaurante)
  z.object({
    acao: z.literal("minha_localizacao"),
    latitude: z.number().min(-34).max(6),
    longitude: z.number().min(-74).max(-28),
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
      let ponto: { lat: number; lon: number } | null = null;

      if (d.acao === "minha_localizacao") {
        ponto = { lat: d.latitude, lon: d.longitude };
      } else {
        if (!(await limitar(req, "painel-geocodificar", 10, 600))) {
          return NextResponse.json({ success: false, error: "Muitas buscas. Aguarde alguns minutos." }, { status: 429 });
        }
        const endereco = await enderecoDoRestaurante(restauranteId);
        if (!endereco.rua || !endereco.cidade) {
          return NextResponse.json(
            { success: false, error: "Cadastre primeiro o endereço do restaurante (menu Endereço para retirada)." },
            { status: 400 }
          );
        }
        ponto = await geocodificar(endereco).catch(() => null);
        if (!ponto) {
          return NextResponse.json(
            { success: false, error: "Não achamos seu endereço no mapa. Use o botão \"Estou no restaurante agora\"." },
            { status: 400 }
          );
        }
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
