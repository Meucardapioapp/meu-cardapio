"use client";

import { supabase } from "@/lib/supabase";

/**
 * fetch para as rotas do painel: envia o token do dono logado.
 * O servidor descobre o restaurante pelo token, não por IDs do navegador.
 */
export async function apiFetch(input: string, init: RequestInit = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(init.headers);

  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  if (init.body && !headers.has("Content-Type") && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const resposta = await fetch(input, { ...init, headers });

  // Atendente que cai numa rota só do dono: não derruba o login dele.
  let atendente = false;
  try {
    atendente = typeof window !== "undefined" && localStorage.getItem("papel_painel") === "atendente";
  } catch {}

  if (resposta.status === 401 && typeof window !== "undefined" && !(atendente && session)) {
    window.location.href = "/login";
  }

  return resposta;
}
