"use client";

import { useEffect, useState } from "react";

/**
 * Pixel do Meta do restaurante só depois do "Aceitar" do cliente
 * (cookies de marketing precisam de consentimento — LGPD e guia da ANPD).
 * A escolha fica guardada no aparelho; dá para mudar pelo rodapé
 * ("Preferências de cookies").
 */
const CHAVE = "consentimento_marketing";

function carregarPixel(pixelId: string) {
  const w = window as any;
  if (w.fbq) return;
  const fbq: any = function (...args: unknown[]) {
    fbq.callMethod ? fbq.callMethod(...args) : fbq.queue.push(args);
  };
  w.fbq = fbq;
  if (!w._fbq) w._fbq = fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
  fbq("init", pixelId);
  fbq("track", "PageView");
}

export default function PixelComConsentimento({ pixelId }: { pixelId: string }) {
  const [perguntar, setPerguntar] = useState(false);

  useEffect(() => {
    let escolha = "";
    try {
      escolha = localStorage.getItem(CHAVE) || "";
    } catch {}
    if (escolha === "sim") carregarPixel(pixelId);
    else if (!escolha) setPerguntar(true);

    const reabrir = () => setPerguntar(true);
    window.addEventListener("preferencias-cookies", reabrir);
    return () => window.removeEventListener("preferencias-cookies", reabrir);
  }, [pixelId]);

  function escolher(aceitou: boolean) {
    try {
      localStorage.setItem(CHAVE, aceitou ? "sim" : "nao");
    } catch {}
    setPerguntar(false);
    if (aceitou) carregarPixel(pixelId);
    else if ((window as any).fbq) window.location.reload();
  }

  if (!perguntar) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[1000] mx-auto max-w-lg rounded-2xl border bg-white p-4 shadow-2xl sm:bottom-5">
      <p className="text-sm text-zinc-700">
        Este cardápio usa cookies do Meta (Facebook/Instagram) para medir anúncios do restaurante. Você aceita? Os
        essenciais (carrinho e login) funcionam de qualquer jeito.{" "}
        <a href="/privacidade" target="_blank" rel="noreferrer" className="underline">Saiba mais</a>
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={() => escolher(false)} className="h-11 rounded-xl border font-semibold text-zinc-700">
          Recusar
        </button>
        <button onClick={() => escolher(true)} className="h-11 rounded-xl bg-zinc-900 font-semibold text-white">
          Aceitar
        </button>
      </div>
    </div>
  );
}
