import { NextRequest, NextResponse } from "next/server";

/**
 * Roda antes de cada página:
 * 1. Força HTTPS em produção.
 * 2. Cria a Política de Segurança de Conteúdo (CSP) com um "nonce" novo a
 *    cada acesso: só scripts do próprio site (e os que ele carrega) rodam.
 *    Isso bloqueia a maioria dos ataques de injeção de script (XSS), que são
 *    o jeito mais comum de roubar a sessão de quem está logado.
 */
export function proxy(request: NextRequest) {
  const producao = process.env.NODE_ENV === "production";

  const protocolo = request.headers.get("x-forwarded-proto");
  const host = request.headers.get("host") || "";
  if (producao && protocolo === "http" && !host.startsWith("localhost")) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseWs = supabase.replace(/^https:/, "wss:");

  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https:${producao ? "" : " 'unsafe-eval'"}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https:`,
    `font-src 'self' data:`,
    `connect-src 'self' ${supabase} ${supabaseWs} https://api.pagar.me https://viacep.com.br https://servicodados.ibge.gov.br https://*.facebook.com https://*.facebook.net https://challenges.cloudflare.com`,
    `frame-src 'self' https://challenges.cloudflare.com https://www.facebook.com`,
    `frame-ancestors 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `worker-src 'self' blob:`,
    producao ? `upgrade-insecure-requests` : "",
  ]
    .filter(Boolean)
    .join("; ");

  const cabecalhos = new Headers(request.headers);
  cabecalhos.set("x-nonce", nonce);
  cabecalhos.set("Content-Security-Policy", csp);

  const resposta = NextResponse.next({ request: { headers: cabecalhos } });
  resposta.headers.set("Content-Security-Policy", csp);

  // Painel não aparece no Google.
  if (/^\/(admin|entregador|equipe|garcom|cozinha|seguranca|contatos-restaurantes|financeiro)/.test(request.nextUrl.pathname)) {
    resposta.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return resposta;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|svg|ico|txt|xml)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
