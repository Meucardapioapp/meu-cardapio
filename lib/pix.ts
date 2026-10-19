/**
 * "Pix copia e cola" (BR Code estático do Banco Central) para a chave do
 * próprio restaurante, já com o valor do pedido. Funciona em qualquer app
 * de banco; o dinheiro vai direto para a conta do restaurante.
 */

export type TipoChavePix = "cpf" | "cnpj" | "celular" | "email" | "aleatoria";

const soDigitos = (v: string) => v.replace(/\D/g, "");

/** Remove acentos e caracteres fora do padrão do BR Code. */
function ascii(v: string, max: number) {
  return v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 .\-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase()
    .slice(0, max);
}

/** Chave no formato que o Pix exige (celular com +55, CPF/CNPJ só números...). */
export function normalizarChavePix(tipo: TipoChavePix, chave: string) {
  const c = chave.trim();
  if (tipo === "cpf" || tipo === "cnpj") return soDigitos(c);
  if (tipo === "celular") {
    let d = soDigitos(c);
    if (d.startsWith("55") && d.length >= 12) d = d.slice(2);
    return `+55${d}`;
  }
  if (tipo === "email") return c.toLowerCase();
  return c.toLowerCase();
}

export function validarChavePix(tipo: TipoChavePix, chave: string): string | null {
  const c = normalizarChavePix(tipo, chave);
  if (tipo === "cpf" && c.length !== 11) return "CPF deve ter 11 números.";
  if (tipo === "cnpj" && c.length !== 14) return "CNPJ deve ter 14 números.";
  if (tipo === "celular" && !/^\+55\d{10,11}$/.test(c)) return "Celular com DDD, ex.: (11) 91234-5678.";
  if (tipo === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)) return "E-mail inválido.";
  if (tipo === "aleatoria" && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(c))
    return "Chave aleatória inválida (formato xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).";
  return null;
}

function campo(id: string, valor: string) {
  return id + String(valor.length).padStart(2, "0") + valor;
}

function crc16(texto: string) {
  let crc = 0xffff;
  for (let i = 0; i < texto.length; i++) {
    crc ^= texto.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function gerarPixCopiaECola(opcoes: {
  tipo: TipoChavePix;
  chave: string;
  nome: string;
  cidade: string;
  valor: number;
  /** Identificação que aparece no extrato (ex.: número do pedido). */
  identificador?: string;
}) {
  const chave = normalizarChavePix(opcoes.tipo, opcoes.chave);
  const txid = ascii(opcoes.identificador || "", 25).replace(/[^A-Z0-9]/g, "") || "***";
  const conta = campo("00", "br.gov.bcb.pix") + campo("01", chave);

  let payload =
    campo("00", "01") +
    campo("26", conta) +
    campo("52", "0000") +
    campo("53", "986") +
    (opcoes.valor > 0 ? campo("54", opcoes.valor.toFixed(2)) : "") +
    campo("58", "BR") +
    campo("59", ascii(opcoes.nome, 25) || "RESTAURANTE") +
    campo("60", ascii(opcoes.cidade, 15) || "BRASIL") +
    campo("62", campo("05", txid)) +
    "6304";

  payload += crc16(payload);
  return payload;
}
