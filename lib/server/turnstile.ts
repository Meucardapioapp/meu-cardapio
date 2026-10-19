import "server-only";

/**
 * Proteção contra robôs (Cloudflare Turnstile).
 * Só fica ativa quando TURNSTILE_SECRET_KEY está configurada; sem ela,
 * o sistema funciona normalmente (com os limites de tentativa).
 */
export function turnstileAtivo() {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export async function verificarHumano(token: unknown, ip?: string) {
  const segredo = process.env.TURNSTILE_SECRET_KEY;
  if (!segredo) return true;

  if (typeof token !== "string" || token.length < 10 || token.length > 4096) return false;

  try {
    const corpo = new URLSearchParams({ secret: segredo, response: token });
    if (ip) corpo.set("remoteip", ip);

    const resposta = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: corpo,
      cache: "no-store",
    });
    const dados = await resposta.json();

    return dados?.success === true;
  } catch (e) {
    console.error("[turnstile]", e);
    return false;
  }
}
