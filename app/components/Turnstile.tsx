"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opcoes: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

export type TurnstileRef = {
  /** Devolve um token válido (gera outro se o anterior já foi usado). */
  obterToken: () => Promise<string | undefined>;
};

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/**
 * Verificação "não sou robô" da Cloudflare (gratuita e quase sempre invisível).
 * Sem NEXT_PUBLIC_TURNSTILE_SITE_KEY o componente não aparece e obterToken
 * devolve undefined.
 */
const Turnstile = forwardRef<TurnstileRef>(function Turnstile(_, ref) {
  const caixa = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const token = useRef<string | undefined>(undefined);
  const esperando = useRef<((t: string | undefined) => void)[]>([]);

  function renderizar() {
    if (!SITE_KEY || !caixa.current || !window.turnstile || widgetId.current) return;

    widgetId.current = window.turnstile.render(caixa.current, {
      sitekey: SITE_KEY,
      language: "pt-br",
      appearance: "interaction-only",
      callback: (t: string) => {
        token.current = t;
        esperando.current.splice(0).forEach((r) => r(t));
      },
      "expired-callback": () => {
        token.current = undefined;
      },
      "error-callback": () => {
        token.current = undefined;
        esperando.current.splice(0).forEach((r) => r(undefined));
      },
    });
  }

  useEffect(() => {
    renderizar();
    return () => {
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, []);

  useImperativeHandle(ref, () => ({
    obterToken: () => {
      if (!SITE_KEY) return Promise.resolve(undefined);

      const atual = token.current;
      if (atual) {
        // Token é de uso único: já prepara o próximo.
        token.current = undefined;
        if (widgetId.current) window.turnstile?.reset(widgetId.current);
        return Promise.resolve(atual);
      }

      return new Promise((resolve) => {
        esperando.current.push(resolve);
        setTimeout(() => resolve(undefined), 15000);
      }).then((t) => {
        token.current = undefined;
        if (widgetId.current) window.turnstile?.reset(widgetId.current);
        return t as string | undefined;
      });
    },
  }));

  if (!SITE_KEY) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={renderizar}
      />
      <div ref={caixa} className="mt-4 flex justify-center" />
    </>
  );
});

export default Turnstile;
