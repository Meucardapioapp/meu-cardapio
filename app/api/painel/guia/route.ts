import { limitar } from "@/lib/server/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { erroInterno, getDonoAutenticado, naoAutenticado } from "@/lib/server/auth";
import { getRecebedorId } from "@/lib/server/recebedor";
import { PASSOS_GUIA, type PassoGuia } from "@/lib/guia";

const IDS = PASSOS_GUIA.map((p) => p.id);

async function lerVisitados(restauranteId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from("painel_guia")
    .select("passos")
    .eq("restaurante_id", restauranteId)
    .maybeSingle();

  if (error) return [];
  return (data?.passos as string[]) ?? [];
}

/**
 * Passos do guia já concluídos: o dono abriu a área
 * ou ela já está configurada (restaurantes antigos).
 */
export async function GET(req: NextRequest) {
  try {
    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();

    const id = dono.restaurante.id;

    const [visitados, aparencia, produtos, bairros, pagamentos, restaurante, recebedor] =
      await Promise.all([
        lerVisitados(id),
        supabaseAdmin.from("aparencia").select("logo_url, banner_url").eq("restaurante_id", id).limit(1).maybeSingle(),
        supabaseAdmin.from("produtos").select("id", { count: "exact", head: true }).eq("restaurante_id", id),
        supabaseAdmin.from("bairros_entrega").select("id", { count: "exact", head: true }).eq("restaurante_id", id),
        supabaseAdmin.from("configuracoes_pagamento").select("restaurante_id").eq("restaurante_id", id).maybeSingle(),
        supabaseAdmin.from("restaurantes").select("endereco").eq("id", id).maybeSingle(),
        getRecebedorId(id).catch(() => null),
      ]);

    const feitos = new Set<string>(visitados.filter((v) => IDS.includes(v as PassoGuia)));

    if (aparencia.data?.logo_url || aparencia.data?.banner_url) feitos.add("aparencia");
    if ((produtos.count ?? 0) > 0) feitos.add("produtos");
    if ((bairros.count ?? 0) > 0) feitos.add("entrega");
    if (pagamentos.data) feitos.add("pagamentos");
    if (String((restaurante.data as any)?.endereco ?? "").trim()) feitos.add("retirada");
    if (recebedor) feitos.add("dados-bancarios");

    return NextResponse.json({ success: true, feitos: [...feitos] });
  } catch (error) {
    return erroInterno("painel/guia GET", error);
  }
}

/** Marca uma área como visitada (para de piscar). */
export async function POST(req: NextRequest) {
  try {
    if (!(await limitar(req, "painel-escrita", 60, 60))) {
      return NextResponse.json({ success: false, error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });
    }

    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();

    const { passo } = await req.json().catch(() => ({}));

    if (!IDS.includes(passo)) {
      return NextResponse.json({ success: false, error: "Passo inválido." }, { status: 400 });
    }

    const atuais = await lerVisitados(dono.restaurante.id);

    if (!atuais.includes(passo)) {
      const { error } = await supabaseAdmin.from("painel_guia").upsert(
        {
          restaurante_id: dono.restaurante.id,
          passos: [...atuais, passo],
          updated_at: new Date().toISOString(),
        },
        { onConflict: "restaurante_id" }
      );

      if (error) console.error("[painel/guia] salvar", error.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return erroInterno("painel/guia POST", error);
  }
}
