import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import { getEquipeAutenticada } from "@/lib/server/auth";
import { getFuncionario, type FuncionarioLogado } from "@/lib/server/funcionario";
import { SalaoError } from "@/lib/server/salao";

/**
 * Quem está usando o salão:
 *  - "painel": dono ou atendente logado no painel (faz tudo);
 *  - "garcom": garçom pelo celular (abre mesa, lança, altera o que não foi preparado);
 *  - "cozinha": cozinha/churrasqueira/bar pelo celular ou tablet.
 */
export type AcessoSalao = {
  papel: "painel" | "garcom" | "cozinha";
  restauranteId: string;
  nome: string;
  funcionario: FuncionarioLogado | null;
  dono: boolean;
};

export async function acessoSalao(
  req: NextRequest,
  permitidos: AcessoSalao["papel"][]
): Promise<AcessoSalao | null> {
  if (permitidos.includes("painel") && req.headers.get("authorization")) {
    const equipe = await getEquipeAutenticada(req);
    if (equipe) {
      return {
        papel: "painel",
        restauranteId: equipe.restaurante.id,
        nome: equipe.nomeMembro || (equipe.papel === "dono" ? "Caixa" : "Atendente"),
        funcionario: null,
        dono: equipe.papel === "dono",
      };
    }
  }
  for (const papel of ["garcom", "cozinha"] as const) {
    if (!permitidos.includes(papel)) continue;
    const f = await getFuncionario(req, papel);
    if (f) return { papel, restauranteId: f.restaurante_id, nome: f.nome, funcionario: f, dono: false };
  }
  return null;
}

export function semAcesso() {
  return NextResponse.json({ success: false, error: "Entre novamente.", sair: true }, { status: 401 });
}

/** Resposta padrão para os erros do salão. */
export function respostaErro(e: unknown, contexto: string) {
  if (e instanceof SalaoError) {
    return NextResponse.json({ success: false, error: e.message }, { status: e.status });
  }
  const codigo = (e as any)?.code;
  if (codigo === "42P01" || codigo === "PGRST205" || codigo === "42703" || codigo === "PGRST204") {
    return NextResponse.json({ success: false, error: "Rode o SQL 15 no Supabase para ativar o salão.", indisponivel: true }, { status: 400 });
  }
  console.error(`[${contexto}]`, e instanceof Error ? e.message : e);
  return NextResponse.json({ success: false, error: "Erro interno. Tente novamente." }, { status: 500 });
}
