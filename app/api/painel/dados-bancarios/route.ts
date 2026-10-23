import { NextRequest, NextResponse } from "next/server";
import { erroInterno, getDonoAutenticado, naoAutenticado } from "@/lib/server/auth";
import { getDadosFinanceiros, getRecebedorId } from "@/lib/server/recebedor";
import { limitar } from "@/lib/server/rate-limit";
import { SenhaInvalidaError, confirmarSenhaDoDono } from "@/lib/server/confirmar-senha";
import { contaDoSistema, lerRecebedor } from "@/lib/server/contaBancaria";
import { type ContaBancaria, nomeDoBanco } from "@/lib/bancos";

/**
 * Dados bancários do restaurante LOGADO (só o dono, nunca atendente).
 * GET: resumo com os números escondidos (•••456).
 * POST { senha }: dados completos, só depois de confirmar a senha.
 */

const SEM_CACHE = { "Cache-Control": "no-store, max-age=0" };

function mascarar(valor: string | null | undefined, visiveis = 3) {
  const limpo = String(valor ?? "").trim();
  if (!limpo) return "";
  if (limpo.length <= visiveis) return "•".repeat(limpo.length);
  return "•".repeat(Math.min(limpo.length - visiveis, 6)) + limpo.slice(-visiveis);
}

function paraTela(c: ContaBancaria) {
  return { ...c, bancoNome: nomeDoBanco(c.banco) };
}

export async function GET(req: NextRequest) {
  try {
    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();

    const dados = await getDadosFinanceiros(dono.restaurante.id);
    const conta = contaDoSistema(dados, "");
    const recipientId = await getRecebedorId(dono.restaurante.id);

    return NextResponse.json(
      {
        success: true,
        temConta: Boolean(conta),
        pixOnline: Boolean(recipientId),
        cpfTravado: Boolean(recipientId),
        resumo: conta
          ? {
              cpfCnpj: mascarar(conta.cpfCnpj, 2),
              banco: conta.banco,
              bancoNome: nomeDoBanco(conta.banco),
              agencia: mascarar(conta.agencia, 2),
              conta: mascarar(conta.conta, 3),
              tipoConta: conta.tipoConta,
            }
          : null,
      },
      { headers: SEM_CACHE }
    );
  } catch (error) {
    return erroInterno("painel/dados-bancarios GET", error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();

    if (!(await limitar(req, "ver-dados-bancarios", 15, 600))) {
      return NextResponse.json({ success: false, error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
    }

    const corpo = await req.json().catch(() => ({}));
    try {
      await confirmarSenhaDoDono(dono, corpo?.senha);
    } catch (e) {
      if (e instanceof SenhaInvalidaError) {
        return NextResponse.json({ success: false, error: e.message }, { status: e.status });
      }
      throw e;
    }

    const dados = await getDadosFinanceiros(dono.restaurante.id);
    const recipientId = await getRecebedorId(dono.restaurante.id);

    // A conta que está na Pagar.me é a que recebe de verdade: mostra ela.
    if (recipientId) {
      try {
        const recebedor = await lerRecebedor(recipientId);
        if (recebedor.conta) {
          return NextResponse.json(
            {
              success: true,
              fonte: "pagarme",
              cpfTravado: true,
              statusPagarme: recebedor.status,
              conta: paraTela(recebedor.conta),
            },
            { headers: SEM_CACHE }
          );
        }
      } catch (e) {
        console.error("[dados-bancarios] ler Pagar.me", e instanceof Error ? e.message : e);
      }
    }

    const conta = contaDoSistema(dados, dono.restaurante.nome_responsavel || "");
    return NextResponse.json(
      {
        success: true,
        fonte: "sistema",
        cpfTravado: Boolean(recipientId),
        statusPagarme: dados?.pagarme_status ?? null,
        conta: conta ? paraTela(conta) : null,
      },
      { headers: SEM_CACHE }
    );
  } catch (error) {
    return erroInterno("painel/dados-bancarios POST", error);
  }
}
