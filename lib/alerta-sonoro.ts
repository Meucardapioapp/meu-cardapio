"use client";

/**
 * Bipe e vibração para avisos (pedido novo na cozinha, item pronto, mesa chamando).
 * O navegador só libera o som depois do primeiro toque na tela: chame
 * `liberarSom()` num clique e depois `tocarAlerta()` quando precisar.
 */
let contexto: AudioContext | null = null;

export function liberarSom() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    contexto ??= new Ctx();
    if (contexto.state === "suspended") contexto.resume();
    return contexto.state === "running";
  } catch {
    return false;
  }
}

export function somLiberado() {
  return contexto?.state === "running";
}

export function tocarAlerta(tipo: "pedido" | "pronto" | "conta" = "pedido") {
  try {
    liberarSom();
    const ctx = contexto!;
    const notas = tipo === "pronto" ? [660, 880] : tipo === "conta" ? [523, 659, 784] : [880, 880, 880];
    notas.forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.22;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.35, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.2);
    });
  } catch {}
  try {
    navigator.vibrate?.(tipo === "pronto" ? [200, 100, 200] : [300, 150, 300, 150, 300]);
  } catch {}
}
