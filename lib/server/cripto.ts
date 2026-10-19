import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * Criptografia de dados sensíveis guardados no banco (AES-256-GCM).
 * A chave fica só na Vercel: DADOS_CRIPTO_CHAVE (32 bytes em base64).
 * Gere uma com:  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 *
 * Se alguém copiar o banco, CPF/CNPJ e conta bancária aparecem embaralhados.
 */
const PREFIXO = "enc:v1:";

function chave() {
  const valor = process.env.DADOS_CRIPTO_CHAVE;
  if (!valor) return null;

  const bytes = Buffer.from(valor, "base64");
  if (bytes.length !== 32) {
    console.error("[cripto] DADOS_CRIPTO_CHAVE precisa ter 32 bytes em base64");
    return null;
  }

  return bytes;
}

export function criptografar(texto: string | null | undefined) {
  if (texto == null || texto === "") return texto ?? null;
  if (String(texto).startsWith(PREFIXO)) return String(texto);

  const k = chave();
  if (!k) return String(texto);

  const iv = randomBytes(12);
  const cifra = createCipheriv("aes-256-gcm", k, iv);
  const dados = Buffer.concat([cifra.update(String(texto), "utf8"), cifra.final()]);
  const tag = cifra.getAuthTag();

  return PREFIXO + Buffer.concat([iv, tag, dados]).toString("base64");
}

export function descriptografar(texto: string | null | undefined) {
  if (texto == null || texto === "") return texto ?? null;
  if (!String(texto).startsWith(PREFIXO)) return String(texto); // dado antigo, ainda sem criptografia

  const k = chave();
  if (!k) {
    console.error("[cripto] dado criptografado mas DADOS_CRIPTO_CHAVE não está configurada");
    return null;
  }

  try {
    const bruto = Buffer.from(String(texto).slice(PREFIXO.length), "base64");
    const iv = bruto.subarray(0, 12);
    const tag = bruto.subarray(12, 28);
    const dados = bruto.subarray(28);
    const decifra = createDecipheriv("aes-256-gcm", k, iv);
    decifra.setAuthTag(tag);
    return Buffer.concat([decifra.update(dados), decifra.final()]).toString("utf8");
  } catch (e) {
    console.error("[cripto] falha ao descriptografar", e instanceof Error ? e.message : e);
    return null;
  }
}
