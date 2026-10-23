import "server-only";

import { PagarmeError, pagarme } from "@/lib/server/pagarme";
import type { DadosFinanceiros } from "@/lib/server/recebedor";
import { type ContaBancaria, limparNome, normalizarContaBancaria, separarNumeroEDigito } from "@/lib/bancos";

/** A Pagar.me aceita até 30 letras no nome do titular: "Maria Aparecida da Silva Oliveira" → "Maria Oliveira". */
export function nomeCurto(nome: string, limite = 30) {
  const limpo = limparNome(nome);
  if (limpo.length <= limite) return limpo;

  const partes = limpo.split(" ");
  const curto = partes.length > 1 ? `${partes[0]} ${partes[partes.length - 1]}` : limpo;

  return curto.slice(0, limite).trim();
}

/** Formato que a Pagar.me espera em default_bank_account. */
export function contaParaPagarme(c: ContaBancaria) {
  return {
    holder_name: nomeCurto(c.titular),
    holder_type: c.cpfCnpj.length === 11 ? "individual" : "company",
    holder_document: c.cpfCnpj,
    bank: c.banco,
    branch_number: c.agencia,
    ...(c.agenciaDigito ? { branch_check_digit: c.agenciaDigito } : {}),
    account_number: c.conta,
    account_check_digit: c.contaDigito,
    type: c.tipoConta === "poupanca" ? "savings" : "checking",
  };
}

export type RecebedorPagarme = {
  id: string;
  documento: string;
  status: string;
  conta: ContaBancaria | null;
};

/** Lê o recebedor direto na Pagar.me (é a conta que vai receber de verdade). */
export async function lerRecebedor(recipientId: string): Promise<RecebedorPagarme> {
  const r = await pagarme<any>(`/recipients/${recipientId}`);
  const b = r?.default_bank_account;

  return {
    id: String(r?.id ?? recipientId),
    documento: String(r?.document ?? "").replace(/\D/g, ""),
    status: String(r?.status ?? ""),
    conta: b
      ? normalizarContaBancaria({
          titular: b.holder_name,
          cpfCnpj: b.holder_document,
          banco: b.bank,
          agencia: b.branch_number,
          agenciaDigito: b.branch_check_digit,
          conta: b.account_number,
          contaDigito: b.account_check_digit,
          tipoConta: b.type === "savings" ? "poupanca" : "corrente",
        })
      : null,
  };
}

/** Conta guardada no sistema (aceita o formato antigo "0001-0" / "12345-6"). */
export function contaDoSistema(dados: DadosFinanceiros | null, titularPadrao: string): ContaBancaria | null {
  if (!dados?.conta) return null;

  const [agencia, agenciaDv] = separarNumeroEDigito(dados.agencia);
  const [conta, contaDv] = separarNumeroEDigito(dados.conta);

  return normalizarContaBancaria({
    titular: titularPadrao,
    cpfCnpj: dados.cpf_cnpj,
    banco: dados.banco,
    agencia,
    agenciaDigito: dados.digito_agencia || agenciaDv,
    conta,
    contaDigito: dados.digito_conta || contaDv,
    tipoConta: dados.tipo_conta === "poupanca" ? "poupanca" : "corrente",
  });
}

/** Explica em português as recusas mais comuns da Pagar.me. */
export function mensagemErroPagarme(e: unknown) {
  if (!(e instanceof PagarmeError)) return "Não foi possível falar com a Pagar.me agora. Tente de novo em alguns minutos.";

  const detalhes = JSON.stringify(e.detalhes ?? "").toLowerCase();
  const texto = `${e.message} ${detalhes}`.toLowerCase();

  if (texto.includes("document")) return "A Pagar.me recusou o CPF/CNPJ. Ele precisa ser o mesmo do titular da conta.";
  if (texto.includes("branch")) return "A Pagar.me recusou a agência. Confira o número e o dígito (muitos bancos não têm dígito na agência).";
  if (texto.includes("account_check_digit") || texto.includes("check_digit")) return "A Pagar.me recusou o dígito da conta. Confira o número depois do traço.";
  if (texto.includes("account")) return "A Pagar.me recusou o número da conta. Confira no app do seu banco.";
  if (texto.includes("holder_name") || texto.includes("name")) return "A Pagar.me recusou o nome do titular. Use só letras, como está no banco.";
  if (texto.includes("bank")) return "A Pagar.me recusou o banco escolhido.";

  return e.message ? `A Pagar.me recusou os dados: ${e.message}` : "A Pagar.me recusou os dados bancários.";
}
