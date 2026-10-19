"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/utils/apiFetch";

export type EstadoPush =
  | "carregando"
  | "indisponivel" // sistema sem chaves
  | "sem-suporte" // navegador não suporta
  | "instalar-iphone" // iPhone: precisa adicionar à tela de início
  | "bloqueado" // usuário negou a permissão
  | "desligado"
  | "ligado";

function base64ParaBytes(base64: string) {
  const preenchido = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const bruto = atob(preenchido);
  const bytes = new Uint8Array(bruto.length);
  for (let i = 0; i < bruto.length; i++) bytes[i] = bruto.charCodeAt(i);
  return bytes;
}

function ehIphoneNoNavegador() {
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const instalado = window.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone === true;
  return ios && !instalado;
}

/** Liga/desliga a notificação de "Novo pedido" neste aparelho. */
export function useNotificacaoCelular() {
  const [estado, setEstado] = useState<EstadoPush>("carregando");
  const [chave, setChave] = useState<string | null>(null);

  const verificar = useCallback(async () => {
    try {
      const d = await apiFetch("/api/painel/push").then((r) => r.json());
      if (!d?.disponivel || !d?.chavePublica) return setEstado("indisponivel");
      setChave(d.chavePublica);

      if (ehIphoneNoNavegador()) return setEstado("instalar-iphone");
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        return setEstado("sem-suporte");
      }
      if (Notification.permission === "denied") return setEstado("bloqueado");

      const reg = await navigator.serviceWorker.getRegistration("/admin/");
      const inscricao = await reg?.pushManager.getSubscription();
      setEstado(inscricao && Notification.permission === "granted" ? "ligado" : "desligado");
    } catch {
      setEstado("sem-suporte");
    }
  }, []);

  useEffect(() => {
    verificar();
  }, [verificar]);

  const ligar = useCallback(async () => {
    if (!chave) return false;
    const permissao = await Notification.requestPermission();
    if (permissao !== "granted") {
      setEstado(permissao === "denied" ? "bloqueado" : "desligado");
      return false;
    }
    const reg = await navigator.serviceWorker.register("/sw-painel.js", { scope: "/admin/" });
    await navigator.serviceWorker.ready;
    let inscricao = await reg.pushManager.getSubscription();
    if (!inscricao) {
      inscricao = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ParaBytes(chave),
      });
    }
    const r = await apiFetch("/api/painel/push", { method: "POST", body: JSON.stringify(inscricao.toJSON()) });
    if (!r.ok) return false;
    setEstado("ligado");
    apiFetch("/api/painel/push", { method: "POST", body: JSON.stringify({ teste: true }) }).catch(() => {});
    return true;
  }, [chave]);

  const desligar = useCallback(async () => {
    const reg = await navigator.serviceWorker.getRegistration("/admin/");
    const inscricao = await reg?.pushManager.getSubscription();
    if (inscricao) {
      await apiFetch("/api/painel/push", { method: "DELETE", body: JSON.stringify({ endpoint: inscricao.endpoint }) }).catch(() => {});
      await inscricao.unsubscribe().catch(() => {});
    }
    setEstado("desligado");
  }, []);

  return { estado, ligar, desligar };
}
