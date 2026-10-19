// Gera as chaves secretas que faltam no .env.local (roda no SEU computador).
// Uso, no terminal do VS Code, dentro da pasta do projeto:
//   node scripts/gerar-segredos.mjs
// Não mostra os valores na tela e não mexe nas chaves que já existem.
import { generateKeyPairSync, randomBytes } from "node:crypto";
import { existsSync, readFileSync, appendFileSync } from "node:fs";

const arquivo = ".env.local";
const atual = existsSync(arquivo) ? readFileSync(arquivo, "utf8") : "";
const existe = (nome) => new RegExp(`^\\s*${nome}\\s*=`, "m").test(atual);

// Chaves do aviso no celular (Web Push / VAPID).
const par = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const jwk = par.privateKey.export({ format: "jwk" });
const b64 = (s) => Buffer.from(s, "base64url");
const vapidPublica = Buffer.concat([Buffer.from([4]), b64(jwk.x), b64(jwk.y)]).toString("base64url");

const novos = {
  DADOS_CRIPTO_CHAVE: randomBytes(32).toString("base64"),
  RATE_LIMIT_SALT: randomBytes(48).toString("base64url"),
  PAGARME_WEBHOOK_USER: "meucardapio-webhook",
  PAGARME_WEBHOOK_PASSWORD: randomBytes(32).toString("base64url"),
  ...(existe("VAPID_PUBLIC_KEY") || existe("VAPID_PRIVATE_KEY")
    ? {}
    : { VAPID_PUBLIC_KEY: vapidPublica, VAPID_PRIVATE_KEY: jwk.d }),
};

const linhas = Object.entries(novos)
  .filter(([nome]) => !existe(nome))
  .map(([nome, valor]) => `${nome}=${valor}`);

if (linhas.length === 0) {
  console.log("Nada a fazer: todas as chaves já existem no .env.local.");
  process.exit(0);
}

appendFileSync(
  arquivo,
  `${atual.endsWith("\n") || !atual ? "" : "\n"}
# --- Segurança (gerado por scripts/gerar-segredos.mjs) ---
# Copie os MESMOS valores para a Vercel (Settings > Environment Variables).
# DADOS_CRIPTO_CHAVE: guarde uma cópia num lugar seguro. Se perder, as contas bancárias não abrem mais.
# PAGARME_WEBHOOK_*: na Vercel, só coloque DEPOIS de configurar o mesmo usuário/senha no webhook da Pagar.me.
${linhas.join("\n")}
`
);

console.log("Pronto! Chaves adicionadas ao .env.local:");
for (const l of linhas) console.log("  - " + l.split("=")[0]);
console.log("Agora pare o servidor (Ctrl+C) e rode `npm run dev` de novo.");
