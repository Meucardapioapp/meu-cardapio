import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { erroInterno, getDonoAutenticado, naoAutenticado } from "@/lib/server/auth";
import { getDadosFinanceiros, getRecebedorId, salvarDadosFinanceiros } from "@/lib/server/recebedor";
import { pagarme } from "@/lib/server/pagarme";
import { limitar } from "@/lib/server/rate-limit";
import { SenhaInvalidaError, confirmarSenhaDoDono } from "@/lib/server/confirmar-senha";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { chaveDaConta, normalizarContaBancaria, separarNumeroEDigito, validarContaBancaria } from "@/lib/bancos";
import {
  contaDoSistema,
  contaParaPagarme,
  lerRecebedor,
  mensagemErroPagarme,
  nomeCurto,
  type RecebedorPagarme,
} from "@/lib/server/contaBancaria";

const semZeros = (v: string) => v.replace(/^0+(?=\d)/, "");

function erro(mensagem: string, status = 400, campo?: string) {
  return NextResponse.json({ success: false, error: mensagem, ...(campo ? { campo } : {}) }, { status });
}

/**
 * Cadastra ou ALTERA a conta bancária do restaurante LOGADO, já
 * atualizando o recebedor na Pagar.me (nunca aceita ID do navegador).
 *
 * Corpo: { titular, cpfCnpj, banco, agencia, agenciaDigito, conta,
 *          contaDigito, tipoConta, senha }
 * (aceita também o formato antigo "0001-0" / "12345-6").
 */
export async function POST(request: NextRequest) {
  try {
    const dono = await getDonoAutenticado(request);
    if (!dono) return naoAutenticado();

    if (!(await limitar(request, "criar-recebedor", 10, 600))) {
      return erro("Muitas tentativas. Aguarde alguns minutos.", 429);
    }

    const corpo = await request.json().catch(() => ({}));

    // Trocar a conta que recebe o dinheiro exige a senha de novo.
    try {
      await confirmarSenhaDoDono(dono, corpo?.senha);
    } catch (e) {
      if (e instanceof SenhaInvalidaError) return erro(e.message, e.status, "senha");
      throw e;
    }

    // Formato antigo: dígito junto com o número.
    const [agenciaAntiga, agenciaDvAntigo] = separarNumeroEDigito(corpo?.agencia);
    const [contaAntiga, contaDvAntigo] = separarNumeroEDigito(corpo?.conta);

    const nova = normalizarContaBancaria({
      titular: corpo?.titular || dono.restaurante.nome_responsavel || "",
      cpfCnpj: corpo?.cpfCnpj,
      banco: corpo?.banco,
      agencia: agenciaAntiga,
      agenciaDigito: corpo?.agenciaDigito ?? agenciaDvAntigo,
      conta: contaAntiga,
      contaDigito: corpo?.contaDigito ?? contaDvAntigo,
      tipoConta: corpo?.tipoConta,
    });

    const erros = validarContaBancaria(nova);
    const primeiro = Object.entries(erros)[0];
    if (primeiro) return erro(primeiro[1] as string, 400, primeiro[0]);

    const atual = await getDadosFinanceiros(dono.restaurante.id);
    const recipientId = (await getRecebedorId(dono.restaurante.id)) || "";
    let recebedor: RecebedorPagarme | null = null;

    if (recipientId) {
      try {
        recebedor = await lerRecebedor(recipientId);
      } catch (e) {
        console.error("[criar-recebedor] ler recebedor", e instanceof Error ? e.message : e);
        return erro("Não foi possível falar com a Pagar.me agora. Tente de novo em alguns minutos.", 502);
      }

      // A Pagar.me não deixa trocar o CPF/CNPJ de um recebedor que já existe.
      if (recebedor.documento && recebedor.documento !== nova.cpfCnpj) {
        return erro(
          "O CPF/CNPJ do titular não pode ser trocado por aqui, porque o seu saldo está ligado a ele. A conta nova precisa estar no mesmo CPF/CNPJ. Para trocar o titular, fale com o suporte do MeuCardápioApp.",
          409,
          "cpfCnpj"
        );
      }
    }

    const anterior = recebedor?.conta ?? contaDoSistema(atual, dono.restaurante.nome_responsavel || "");
    const contaMudou = !anterior || chaveDaConta(anterior) !== chaveDaConta(nova);
    const contaBancaria = contaParaPagarme(nova);

    let idFinal = recipientId;
    let statusFinal = recebedor?.status || atual?.pagarme_status || "";

    try {
      if (recipientId) {
        await pagarme(`/recipients/${recipientId}/default-bank-account`, {
          method: "PATCH",
          body: { bank_account: contaBancaria },
        });

        // Confere na própria Pagar.me que a conta nova ficou valendo.
        const conferido = await lerRecebedor(recipientId);
        if (!conferido.conta || semZeros(conferido.conta.conta) !== semZeros(nova.conta)) {
          console.error("[criar-recebedor] Pagar.me não confirmou a troca de conta");
          return erro("A Pagar.me não confirmou a troca da conta. Tente de novo em alguns minutos.", 502);
        }
        statusFinal = conferido.status || statusFinal;
      } else {
        const chave = createHash("sha256").update(chaveDaConta(nova) + nova.titular).digest("hex").slice(0, 16);
        const novo = await pagarme<any>("/recipients", {
          method: "POST",
          idempotencyKey: `recebedor-${dono.restaurante.id}-${chave}`,
          body: {
            name: nomeCurto(nova.titular, 64),
            email: dono.restaurante.email || dono.email,
            document: nova.cpfCnpj,
            type: contaBancaria.holder_type,
            default_bank_account: contaBancaria,
            metadata: { restaurante_id: dono.restaurante.id },
          },
        });

        idFinal = novo.id;
        statusFinal = novo.status || "";
      }
    } catch (e) {
      return erro(mensagemErroPagarme(e), 400);
    }

    try {
      await pagarme(`/recipients/${idFinal}/transfer-settings`, {
        method: "PATCH",
        body: { transfer_enabled: true, transfer_interval: "daily", transfer_day: 0 },
      });
    } catch (e) {
      console.error("[criar-recebedor] transfer-settings", e instanceof Error ? e.message : e);
    }

    await salvarDadosFinanceiros(dono.restaurante.id, {
      cpf_cnpj: nova.cpfCnpj,
      banco: nova.banco,
      agencia: nova.agencia,
      conta: nova.conta,
      tipo_conta: nova.tipoConta,
      digito_agencia: nova.agenciaDigito || null,
      digito_conta: nova.contaDigito || null,
      pagarme_recipient_id: idFinal,
      pagarme_status: statusFinal,
    });

    // Saques ficam travados por 24 h depois de trocar a conta (anti-fraude).
    // Trocar só o nome ou o tipo da conta não trava.
    if (contaMudou) {
      const { error: erroTrava } = await supabaseAdmin
        .from("restaurantes_financeiro")
        .update({ conta_alterada_em: new Date().toISOString() })
        .eq("restaurante_id", dono.restaurante.id);
      if (erroTrava) console.error("[criar-recebedor] trava de saque", erroTrava.message);
      console.warn(`[seguranca] conta bancária alterada: restaurante ${dono.restaurante.id}`);
    }

    return NextResponse.json(
      { success: true, recipientNovo: !recipientId, contaMudou },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return erroInterno("criar-recebedor", error);
  }
}
