/**
 * Bancos e regras da conta bancária que recebe o Pix online.
 * Usado no navegador (formulário) e no servidor (validação antes de
 * mandar para a Pagar.me), para as duas pontas seguirem a mesma regra.
 */
import { validarCpfOuCnpj } from "@/lib/validacoes";

export const BANCOS: { codigo: string; nome: string }[] = [
  { codigo: "001", nome: "Banco do Brasil" },
  { codigo: "003", nome: "Banco da Amazônia" },
  { codigo: "021", nome: "Banestes" },
  { codigo: "033", nome: "Santander" },
  { codigo: "041", nome: "Banrisul" },
  { codigo: "047", nome: "Banese" },
  { codigo: "069", nome: "Crefisa" },
  { codigo: "070", nome: "BRB" },
  { codigo: "077", nome: "Banco Inter" },
  { codigo: "082", nome: "Banco Topázio" },
  { codigo: "085", nome: "Ailos" },
  { codigo: "104", nome: "Caixa Econômica Federal" },
  { codigo: "121", nome: "Agibank" },
  { codigo: "149", nome: "Facta Financeira" },
  { codigo: "197", nome: "Stone" },
  { codigo: "208", nome: "BTG Pactual" },
  { codigo: "212", nome: "Banco Original" },
  { codigo: "237", nome: "Bradesco" },
  { codigo: "246", nome: "ABC Brasil" },
  { codigo: "260", nome: "Nubank" },
  { codigo: "274", nome: "Money Plus" },
  { codigo: "290", nome: "PagBank" },
  { codigo: "318", nome: "BMG" },
  { codigo: "323", nome: "Mercado Pago" },
  { codigo: "332", nome: "Acesso Bank" },
  { codigo: "336", nome: "C6 Bank" },
  { codigo: "341", nome: "Itaú" },
  { codigo: "348", nome: "XP Investimentos" },
  { codigo: "364", nome: "Efí Bank" },
  { codigo: "380", nome: "PicPay Bank" },
  { codigo: "389", nome: "Banco Mercantil" },
  { codigo: "399", nome: "HSBC" },
  { codigo: "403", nome: "Cora" },
  { codigo: "422", nome: "Safra" },
  { codigo: "461", nome: "Asaas" },
  { codigo: "509", nome: "Creditas" },
  { codigo: "536", nome: "Banco J.Safra" },
  { codigo: "604", nome: "Banco Industrial" },
  { codigo: "612", nome: "Banco Guanabara" },
  { codigo: "623", nome: "Banco PAN" },
  { codigo: "633", nome: "Banco Rendimento" },
  { codigo: "637", nome: "Sofisa Direto" },
  { codigo: "654", nome: "Banco Digimais" },
  { codigo: "655", nome: "Banco Votorantim" },
  { codigo: "707", nome: "Banco Daycoval" },
  { codigo: "735", nome: "Neon" },
  { codigo: "743", nome: "Banco Semear" },
  { codigo: "746", nome: "Modal" },
  { codigo: "748", nome: "Sicredi" },
  { codigo: "756", nome: "Sicoob" },
];

/**
 * Bancos digitais em que a agência é única (0001) e NÃO tem dígito.
 * Mandar um dígito de agência nesses bancos faz a transferência falhar.
 */
export const BANCOS_AGENCIA_SEM_DIGITO = new Set(["077", "197", "260", "290", "323", "332", "336", "364", "380", "403", "461"]);

export function nomeDoBanco(codigo: string | null | undefined) {
  const c = String(codigo ?? "").replace(/\D/g, "").padStart(3, "0");
  return BANCOS.find((b) => b.codigo === c)?.nome ?? "";
}

export type TipoConta = "corrente" | "poupanca";

export type ContaBancaria = {
  titular: string;
  cpfCnpj: string;
  banco: string;
  agencia: string;
  agenciaDigito: string;
  conta: string;
  contaDigito: string;
  tipoConta: TipoConta;
};

export type CampoConta = keyof ContaBancaria;

/** "0001-0" → ["0001", "0"]; "12345" → ["12345", ""]. */
export function separarNumeroEDigito(valor: string | null | undefined): [string, string] {
  const texto = String(valor ?? "").trim();
  const [numero = "", digito = ""] = texto.split("-");
  return [numero.replace(/\D/g, ""), digito.replace(/[^0-9xX]/g, "").toUpperCase()];
}

export function limparNome(nome: string) {
  return String(nome ?? "").replace(/\s+/g, " ").trim();
}

/** Deixa os dados no formato que vai para a Pagar.me (só números, sem traço). */
export function normalizarContaBancaria(entrada: Partial<Record<CampoConta, unknown>>): ContaBancaria {
  const banco = String(entrada.banco ?? "").replace(/\D/g, "");
  const bancoPad = banco ? banco.padStart(3, "0").slice(-3) : "";
  const agenciaDigito = String(entrada.agenciaDigito ?? "").replace(/[^0-9xX]/g, "").toUpperCase();

  return {
    titular: limparNome(String(entrada.titular ?? "")),
    cpfCnpj: String(entrada.cpfCnpj ?? "").replace(/\D/g, ""),
    banco: bancoPad,
    agencia: String(entrada.agencia ?? "").replace(/\D/g, ""),
    agenciaDigito: BANCOS_AGENCIA_SEM_DIGITO.has(bancoPad) ? "" : agenciaDigito,
    conta: String(entrada.conta ?? "").replace(/\D/g, ""),
    contaDigito: String(entrada.contaDigito ?? "").replace(/[^0-9xX]/g, "").toUpperCase(),
    tipoConta: entrada.tipoConta === "poupanca" ? "poupanca" : "corrente",
  };
}

/** Erros por campo (vazio = tudo certo). Mensagens em linguagem simples. */
export function validarContaBancaria(c: ContaBancaria): Partial<Record<CampoConta, string>> {
  const erros: Partial<Record<CampoConta, string>> = {};
  const pessoaFisica = c.cpfCnpj.length === 11;

  if (c.titular.length < 3) {
    erros.titular = "Digite o nome do titular da conta.";
  } else if (c.titular.length > 80) {
    erros.titular = "Nome muito longo.";
  } else if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\d .,&'\-/]+$/.test(c.titular)) {
    erros.titular = "Use só letras, números e espaços.";
  } else if (pessoaFisica && c.titular.split(" ").length < 2) {
    erros.titular = "Digite o nome completo (nome e sobrenome), igual está no banco.";
  }

  if (!validarCpfOuCnpj(c.cpfCnpj)) erros.cpfCnpj = "CPF ou CNPJ inválido.";

  if (!/^\d{3}$/.test(c.banco)) erros.banco = "Escolha o banco.";

  if (!/^\d{1,4}$/.test(c.agencia)) erros.agencia = "A agência tem até 4 números, sem o dígito.";
  if (c.agenciaDigito && !/^[0-9X]$/.test(c.agenciaDigito)) erros.agenciaDigito = "O dígito é 1 número só.";

  if (!/^\d{1,13}$/.test(c.conta)) erros.conta = "Digite o número da conta, sem o dígito.";
  if (!/^[0-9X]{1,2}$/.test(c.contaDigito)) erros.contaDigito = "Digite o dígito da conta (o número depois do traço).";

  return erros;
}

/** Banco + agência + conta (para saber se a conta que recebe mudou de verdade). */
export function chaveDaConta(c: Pick<ContaBancaria, "cpfCnpj" | "banco" | "agencia" | "agenciaDigito" | "conta" | "contaDigito">) {
  const semZeros = (v: string) => v.replace(/^0+(?=\d)/, "");
  return [c.cpfCnpj, c.banco, semZeros(c.agencia), c.agenciaDigito, semZeros(c.conta), c.contaDigito].join("|");
}
