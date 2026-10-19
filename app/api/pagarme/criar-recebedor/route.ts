import { NextRequest, NextResponse } from "next/server";
import { erroInterno, getDonoAutenticado, naoAutenticado } from "@/lib/server/auth";
import { getDadosFinanceiros, salvarDadosFinanceiros } from "@/lib/server/recebedor";
import { PagarmeError, pagarme } from "@/lib/server/pagarme";
import { limitar } from "@/lib/server/rate-limit";
import { validarCpfOuCnpj } from "@/lib/validacoes";
import { SenhaInvalidaError, confirmarSenhaDoDono } from "@/lib/server/confirmar-senha";
import { supabaseAdmin } from "@/lib/supabase-admin";

/** "Maria Aparecida da Silva Santos Oliveira" → "Maria Oliveira" (máx. 30 letras). */
function nomeCurto(nome: string, limite = 30) {
  const limpo = nome.replace(/\s+/g, " ").trim();
  if (limpo.length <= limite) return limpo;

  const partes = limpo.split(" ");
  const curto = partes.length > 1 ? `${partes[0]} ${partes[partes.length - 1]}` : limpo;

  return curto.slice(0, limite).trim();
}

/**
 * Cria (ou atualiza a conta bancária do) recebedor Pagar.me
 * do restaurante LOGADO. Nunca aceita o ID do restaurante do navegador.
 */
export async function POST(request: NextRequest) {
  try {
    const dono = await getDonoAutenticado(request);
    if (!dono) return naoAutenticado();

    if (!await limitar(request, "criar-recebedor", 10, 600)) {
      return NextResponse.json(
        { success: false, error: "Muitas tentativas. Aguarde alguns minutos." },
        { status: 429 }
      );
    }

    const { cpfCnpj, banco, agencia, conta, tipoConta, titular, senha } = await request.json();

    // Trocar a conta que recebe o dinheiro exige a senha de novo.
    try {
      await confirmarSenhaDoDono(dono, senha);
    } catch (e) {
      if (e instanceof SenhaInvalidaError) {
        return NextResponse.json({ success: false, error: e.message }, { status: e.status });
      }
      throw e;
    }

    const documento = String(cpfCnpj ?? "").replace(/\D/g, "");

    if (!validarCpfOuCnpj(documento)) {
      return NextResponse.json(
        { success: false, error: "CPF ou CNPJ inválido." },
        { status: 400 }
      );
    }

    if (!banco || !agencia || !conta) {
      return NextResponse.json(
        { success: false, error: "Preencha banco, agência e conta." },
        { status: 400 }
      );
    }

    const [agenciaNumero, agenciaDv = ""] = String(agencia).split("-");
    const [contaNumero, contaDv = "0"] = String(conta).split("-");
    const tipoPessoa = documento.length === 11 ? "individual" : "company";
    // A Pagar.me aceita no máximo 30 letras no nome: usa nome e sobrenome.
    const nomeTitular = nomeCurto(
      String(titular || dono.restaurante.nome_responsavel || dono.restaurante.nome_restaurante || "")
    );

    const contaBancaria = {
      holder_name: nomeTitular,
      holder_type: tipoPessoa,
      holder_document: documento,
      bank: String(banco).replace(/\D/g, "").padStart(3, "0"),
      branch_number: agenciaNumero.replace(/\D/g, ""),
      ...(agenciaDv ? { branch_check_digit: agenciaDv.replace(/\D/g, "") } : {}),
      account_number: contaNumero.replace(/\D/g, ""),
      account_check_digit: contaDv.replace(/\D/g, "") || "0",
      type: tipoConta === "poupanca" ? "savings" : "checking",
    };

    const atual = await getDadosFinanceiros(dono.restaurante.id);
    const soDigitos = (v: unknown) => String(v ?? "").replace(/\D/g, "");
    const contaMudou =
      !atual ||
      soDigitos(atual.cpf_cnpj) !== documento ||
      soDigitos(atual.banco) !== soDigitos(banco) ||
      soDigitos(atual.agencia) !== soDigitos(agencia) ||
      soDigitos(atual.conta) !== soDigitos(conta);
    let recipientId = atual?.pagarme_recipient_id || "";
    let recipientStatus = atual?.pagarme_status || "";

    try {
      if (recipientId) {
        await pagarme(`/recipients/${recipientId}/default-bank-account`, {
          method: "PATCH",
          body: { bank_account: contaBancaria },
        });
      } else {
        const novo = await pagarme<any>("/recipients", {
          method: "POST",
          idempotencyKey: `recebedor-${dono.restaurante.id}`,
          body: {
            name: nomeTitular,
            email: dono.restaurante.email || dono.email,
            document: documento,
            type: tipoPessoa,
            default_bank_account: contaBancaria,
            metadata: { restaurante_id: dono.restaurante.id },
          },
        });

        recipientId = novo.id;
        recipientStatus = novo.status || "";
      }
    } catch (e) {
      if (e instanceof PagarmeError) {
        return NextResponse.json(
          { success: false, error: e.message || "A Pagar.me recusou os dados bancários." },
          { status: 400 }
        );
      }
      throw e;
    }

    try {
      await pagarme(`/recipients/${recipientId}/transfer-settings`, {
        method: "PATCH",
        body: { transfer_enabled: true, transfer_interval: "daily", transfer_day: 0 },
      });
    } catch (e) {
      console.error("[criar-recebedor] transfer-settings", e);
    }

    await salvarDadosFinanceiros(dono.restaurante.id, {
      cpf_cnpj: cpfCnpj,
      banco,
      agencia,
      conta,
      tipo_conta: tipoConta,
      digito_agencia: agenciaDv || null,
      digito_conta: contaDv || null,
      pagarme_recipient_id: recipientId,
      pagarme_status: recipientStatus,
    });

    // Saques ficam travados por 24 h depois de trocar a conta (anti-fraude).
    if (contaMudou) {
      const { error: erroTrava } = await supabaseAdmin
        .from("restaurantes_financeiro")
        .update({ conta_alterada_em: new Date().toISOString() })
        .eq("restaurante_id", dono.restaurante.id);
      if (erroTrava) console.error("[criar-recebedor] trava de saque", erroTrava.message);
      console.warn(`[seguranca] conta bancária alterada: restaurante ${dono.restaurante.id}`);
    }

    return NextResponse.json({
      success: true,
      recipientNovo: !atual?.pagarme_recipient_id,
    });
  } catch (error) {
    return erroInterno("criar-recebedor", error);
  }
}
