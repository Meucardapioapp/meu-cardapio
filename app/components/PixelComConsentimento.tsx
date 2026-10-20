"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

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
  // No cardápio fica embaixo (a barra de categorias fica livre no topo);
  // nas telas do pedido, que têm botão fixo embaixo, fica no topo.
  const noTopo = /\/(carrinho|endereco|pagamento|pix|pedido-aprovado)/.test(usePathname() || "");

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

  // Enquanto o aviso aparece, a barra do carrinho sobe um pouco para não ficar por baixo dele.
  useEffect(() => {
    const raiz = document.documentElement.style;
    if (perguntar && !noTopo) raiz.setProperty("--altura-aviso-cookies", "60px");
    else raiz.removeProperty("--altura-aviso-cookies");
    return () => {
      raiz.removeProperty("--altura-aviso-cookies");
    };
  }, [perguntar, noTopo]);

  if (!perguntar) return null;

  return (
    <div className={`fixed inset-x-2 ${noTopo ? "top-[max(0.5rem,env(safe-area-inset-top))]" : "bottom-[calc(68px+env(safe-area-inset-bottom))]"} z-[900] mx-auto flex max-w-lg items-center gap-2 rounded-2xl border bg-white/95 p-2.5 pl-3.5 shadow-xl backdrop-blur`}>
      <p className="min-w-0 flex-1 text-[12px] leading-4 text-zinc-600">
        Usamos cookies do Meta para medir anúncios.{" "}
        <a href="/privacidade" target="_blank" rel="noreferrer" className="underline">
          Saiba mais
        </a>
      </p>
      <button onClick={() => escolher(false)} className="h-9 shrink-0 rounded-xl border px-3 text-[13px] font-semibold text-zinc-700">
        Recusar
      </button>
      <button onClick={() => escolher(true)} className="h-9 shrink-0 rounded-xl bg-zinc-900 px-3 text-[13px] font-semibold text-white">
        Aceitar
      </button>
    </div>
  );
}
