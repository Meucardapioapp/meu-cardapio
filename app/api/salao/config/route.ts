import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getDonoAutenticado, getEquipeAutenticada, naoAutenticado } from "@/lib/server/auth";
import { limitar } from "@/lib/server/rate-limit";
import { respostaErro } from "@/lib/server/salao-auth";
import { SEM_PREPARO, getConfigSalao, setorSugerido } from "@/lib/server/salao";

/** Configuração do salão: setores, 10% e onde cada categoria é preparada. */
export async function GET(req: NextRequest) {
  try {
    const equipe = await getEquipeAutenticada(req);
    if (!equipe) return naoAutenticado();
    const r = equipe.restaurante.id;
    const config = await getConfigSalao(r);
    const { data: categorias, error } = await supabaseAdmin
      .from("categorias")
      .select("id, nome, ordem, setor_preparo")
      .eq("restaurante_id", r)
      .order("ordem", { ascending: true });
    if (error) throw error;
    return NextResponse.json({
      success: true,
      config,
      categorias: (categorias ?? []).map((c: any) => ({
        id: c.id,
        nome: c.nome,
        setor: c.setor_preparo || setorSugerido(String(c.nome || ""), config.setores),
        configurado: Boolean(c.setor_preparo),
      })),
    });
  } catch (e) {
    return respostaErro(e, "salao/config GET");
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!(await limitar(req, "painel-escrita", 60, 60))) {
      return NextResponse.json({ success: false, error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });
    }
    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();
    const r = dono.restaurante.id;
    const body = await req.json().catch(() => ({}));

    const setores = [
      ...new Set(
        (Array.isArray(body?.setores) ? body.setores : [])
          .map((s: unknown) => String(s ?? "").trim().replace(/\s+/g, " ").slice(0, 24))
          .filter((s: string) => s && s.toLowerCase() !== SEM_PREPARO && s.toLowerCase() !== "todos")
      ),
    ].slice(0, 8) as string[];
    if (!setores.length) return NextResponse.json({ success: false, error: "Deixe pelo menos um setor (ex.: Cozinha)." }, { status: 400 });

    const pct = Number(body?.taxa_percentual ?? 10);
    if (!(pct >= 0 && pct <= 30)) return NextResponse.json({ success: false, error: "A taxa de serviço vai de 0% a 30%." }, { status: 400 });

    const { error } = await supabaseAdmin.from("salao_config").upsert(
      {
        restaurante_id: r,
        setores,
        taxa_percentual: Math.round(pct * 100) / 100,
        taxa_ligada_padrao: body?.taxa_ligada_padrao === true,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: "restaurante_id" }
    );
    if (error) throw error;

    // Setor de cada categoria
    const mapa = body?.categorias && typeof body.categorias === "object" ? body.categorias : {};
    for (const [id, valor] of Object.entries(mapa).slice(0, 200)) {
      const setor = String(valor ?? "");
      const final = setor === SEM_PREPARO || setores.includes(setor) ? setor : null;
      await supabaseAdmin.from("categorias").update({ setor_preparo: final }).eq("id", id).eq("restaurante_id", r);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return respostaErro(e, "salao/config PUT");
  }
}
