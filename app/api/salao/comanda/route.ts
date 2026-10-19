import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { limitar } from "@/lib/server/rate-limit";
import { acessoSalao, respostaErro, semAcesso } from "@/lib/server/salao-auth";
import {
  SalaoError,
  ajustarComanda,
  alterarItem,
  cancelarComanda,
  detalharComanda,
  fecharComanda,
  lancarItens,
  reabrirComanda,
} from "@/lib/server/salao";

/** Comanda com os itens. */
export async function GET(req: NextRequest) {
  try {
    // Cozinha também lê (para imprimir o pedido do setor).
    const acesso = await acessoSalao(req, ["painel", "garcom", "cozinha"]);
    if (!acesso) return semAcesso();
    const id = req.nextUrl.searchParams.get("id") || "";
    const [detalhe, { data: rest }] = await Promise.all([
      detalharComanda(acesso.restauranteId, id),
      supabaseAdmin.from("restaurantes").select("nome_restaurante").eq("id", acesso.restauranteId).maybeSingle(),
    ]);
    return NextResponse.json({ success: true, restaurante: rest?.nome_restaurante ?? "", ...detalhe });
  } catch (e) {
    return respostaErro(e, "salao/comanda GET");
  }
}

/**
 * Ações na comanda:
 *  lancar (itens) · item (quantidade/cancelar/observação/entregue) · ajustar
 *  (10%, desconto, pessoas, trocar mesa, pediu a conta) · fechar · reabrir · cancelar
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await limitar(req, "salao-escrita", 120, 60))) {
      return NextResponse.json({ success: false, error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });
    }
    const acesso = await acessoSalao(req, ["painel", "garcom"]);
    if (!acesso) return semAcesso();

    const body = await req.json().catch(() => ({}));
    const id = String(body?.id ?? "");
    const garcom = acesso.papel === "garcom";
    const autor = garcom
      ? { tipo: "garcom" as const, id: acesso.funcionario!.id, nome: acesso.nome }
      : { tipo: "painel" as const, nome: acesso.nome };
    const r = acesso.restauranteId;

    switch (body?.acao) {
      case "lancar": {
        const { data: rest } = await supabaseAdmin.from("restaurantes").select("uf").eq("id", r).maybeSingle();
        const resultado = await lancarItens(r, id, body.itens, autor, { uf: (rest as any)?.uf });
        return NextResponse.json({ success: true, ...resultado });
      }

      case "item": {
        const comanda = await alterarItem(
          r,
          String(body.itemId ?? ""),
          {
            quantidade: body.quantidade,
            cancelar: body.cancelar === true,
            observacao: typeof body.observacao === "string" ? body.observacao : undefined,
            entregue: body.entregue === true,
          },
          autor,
          { somenteNaoPreparado: garcom && body.entregue !== true }
        );
        return NextResponse.json({ success: true, comanda });
      }

      case "ajustar": {
        // Garçom: pessoas, trocar mesa, nome e "pediu a conta". 10% e desconto só no caixa.
        const ajuste = {
          pessoas: body.pessoas !== undefined ? Number(body.pessoas) || null : undefined,
          pediuConta: typeof body.pediuConta === "boolean" ? body.pediuConta : undefined,
          mesa: typeof body.mesa === "string" ? body.mesa : undefined,
          clienteNome: typeof body.clienteNome === "string" ? body.clienteNome : undefined,
          taxaServico: !garcom && typeof body.taxaServico === "boolean" ? body.taxaServico : undefined,
          desconto: !garcom && body.desconto != null ? Number(body.desconto) : undefined,
        };
        const comanda = await ajustarComanda(r, id, ajuste);
        return NextResponse.json({ success: true, comanda });
      }

      case "fechar":
      case "reabrir":
      case "cancelar": {
        if (garcom) throw new SalaoError("Quem fecha a conta é o caixa, no painel.", 403);
        const comanda =
          body.acao === "fechar"
            ? await fecharComanda(
                r,
                id,
                {
                  pagamentos: body.pagamentos,
                  taxaServico: typeof body.taxaServico === "boolean" ? body.taxaServico : undefined,
                  desconto: body.desconto != null ? Number(body.desconto) : undefined,
                  recebidoDinheiro: Number(body.recebidoDinheiro || 0),
                },
                autor
              )
            : body.acao === "reabrir"
              ? await reabrirComanda(r, id)
              : await cancelarComanda(r, id, autor);
        return NextResponse.json({ success: true, comanda });
      }

      default:
        return NextResponse.json({ success: false, error: "Ação inválida." }, { status: 400 });
    }
  } catch (e) {
    return respostaErro(e, "salao/comanda POST");
  }
}
