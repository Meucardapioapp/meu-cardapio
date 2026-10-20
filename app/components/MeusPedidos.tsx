"use client";

import { useCallback, useEffect, useState } from "react";
import { ChefHat, ChevronRight, Clock3, PackageCheck, Receipt, RotateCcw, Bike, X, XCircle } from "lucide-react";
import LoginCustomer from "./customer/LoginCustomer";
import { reais } from "@/lib/dinheiro";

type Props = {
  open: boolean;
  onClose: () => void;
  corPrincipal: string;
  onPedirDeNovo?: (pedido: any) => void;
};

const STATUS: Record<string, { texto: string; cor: string; fundo: string; Icone: any }> = {
  pendente: { texto: "Recebido", cor: "#B45309", fundo: "#FEF3C7", Icone: Clock3 },
  aceito: { texto: "Em preparo", cor: "#1D4ED8", fundo: "#DBEAFE", Icone: ChefHat },
  pronto: { texto: "Pronto para retirar", cor: "#047857", fundo: "#D1FAE5", Icone: PackageCheck },
  entrega: { texto: "Saiu para entrega", cor: "#7C3AED", fundo: "#EDE9FE", Icone: Bike },
  concluido: { texto: "Entregue", cor: "#3F3F46", fundo: "#F4F4F5", Icone: PackageCheck },
  recusado: { texto: "Recusado", cor: "#B91C1C", fundo: "#FEE2E2", Icone: XCircle },
  cancelado: { texto: "Cancelado", cor: "#B91C1C", fundo: "#FEE2E2", Icone: XCircle },
};
const ATIVOS = new Set(["pendente", "aceito", "pronto", "entrega"]);

function quando(iso: string) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const hoje = new Date();
  const ontem = new Date(Date.now() - 86400000);
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === hoje.toDateString()) return `Hoje, ${hora}`;
  if (d.toDateString() === ontem.toDateString()) return `Ontem, ${hora}`;
  return `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}, ${hora}`;
}

const resumoItens = (p: any) =>
  (Array.isArray(p.itens) ? p.itens : []).map((i: any) => `${i.quantity}x ${i.nome}`).join(", ");

/** Aba "Pedidos": acompanhar o pedido de agora e repetir os anteriores. */
export default function MeusPedidos({ open, onClose, corPrincipal, onPedirDeNovo }: Props) {
  const [carregando, setCarregando] = useState(true);
  const [pedidos, setPedidos] = useState<any[] | null>(null);
  const [loginAberto, setLoginAberto] = useState(false);
  const slug = typeof window !== "undefined" ? window.location.pathname.split("/")[1] : "";

  const carregar = useCallback(async (silencioso = false) => {
    let token = "";
    try {
      token = localStorage.getItem(`cliente_token-${slug}`) || "";
    } catch {}
    if (!token) {
      setPedidos(null);
      setCarregando(false);
      return;
    }
    if (!silencioso) setCarregando(true);
    try {
      const r = await fetch("/api/cliente/me", { headers: { "x-cliente-token": token } }).then((x) => x.json());
      setPedidos(r?.success ? r.pedidos ?? [] : null);
    } catch {
      if (!silencioso) setPedidos(null);
    } finally {
      setCarregando(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!open) return;
    carregar();
    // O status do pedido de agora se atualiza sozinho.
    const t = setInterval(() => carregar(true), 20000);
    const s = document.body.style;
    const antes = s.overflow;
    s.overflow = "hidden";
    return () => {
      clearInterval(t);
      s.overflow = antes;
    };
  }, [open, carregar]);

  if (!open) return null;

  const ativos = (pedidos ?? []).filter(
    (p) => ATIVOS.has(String(p.status)) && Date.now() - new Date(p.created_at).getTime() < 24 * 3600 * 1000
  );
  const anteriores = (pedidos ?? []).filter((p) => !ativos.includes(p));
  const link = (p: any) => `/${slug}/pedido-aprovado?id=${encodeURIComponent(p.id)}&c=${encodeURIComponent(p.codigo_acesso || "")}`;

  return (
    <div className="fixed inset-0 z-[1003] flex flex-col bg-zinc-50 text-zinc-900" role="dialog" aria-modal="true" aria-label="Meus pedidos">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-zinc-200 bg-white px-4">
        <Receipt size={20} style={{ color: corPrincipal }} />
        <p className="flex-1 text-[17px] font-bold">Meus pedidos</p>
        <button type="button" onClick={onClose} aria-label="Fechar" className="flex h-10 w-10 items-center justify-center rounded-full active:bg-zinc-100">
          <X size={22} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-xl space-y-4 px-4 pt-4">
          {carregando ? (
            [0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-3xl bg-white" />)
          ) : pedidos === null ? (
            <div className="rounded-3xl bg-white p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: `${corPrincipal}14` }}>
                <Receipt size={26} style={{ color: corPrincipal }} />
              </div>
              <p className="mt-3 text-lg font-bold">Seus pedidos aparecem aqui</p>
              <p className="mt-1 text-sm leading-6 text-zinc-500">
                Depois do primeiro pedido, você acompanha o status e pede de novo com um toque.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 h-12 w-full rounded-2xl font-bold text-white"
                style={{ backgroundColor: corPrincipal }}
              >
                Ver o cardápio
              </button>
              <button type="button" onClick={() => setLoginAberto(true)} className="mt-2 h-11 w-full rounded-2xl text-sm font-semibold text-zinc-600">
                Já pedi aqui em outro celular · Entrar
              </button>
            </div>
          ) : pedidos.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 text-center">
              <p className="text-lg font-bold">Nenhum pedido ainda</p>
              <p className="mt-1 text-sm text-zinc-500">Quando você pedir, ele aparece aqui.</p>
              <button type="button" onClick={onClose} className="mt-5 h-12 w-full rounded-2xl font-bold text-white" style={{ backgroundColor: corPrincipal }}>
                Ver o cardápio
              </button>
            </div>
          ) : (
            <>
              {ativos.map((p) => {
                const st = STATUS[String(p.status)] ?? STATUS.pendente;
                const etapas = p.tipo_pedido === "retirada" ? ["pendente", "aceito", "pronto"] : ["pendente", "aceito", "entrega"];
                const atual = Math.max(0, etapas.indexOf(String(p.status)));
                return (
                  <a key={p.id} href={link(p)} className="block rounded-3xl p-5 text-white shadow-lg" style={{ backgroundColor: corPrincipal }}>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Pedido de agora · #{p.numero_pedido ?? p.id}</p>
                      <p className="text-xs text-white/80">{quando(p.created_at)}</p>
                    </div>
                    <p className="mt-2 flex items-center gap-2 text-xl font-extrabold">
                      <st.Icone size={22} /> {st.texto}
                    </p>
                    <div className="mt-3 flex gap-1.5">
                      {etapas.map((e, i) => (
                        <span key={e} className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: i <= atual ? "#FFFFFF" : "rgba(255,255,255,0.3)" }} />
                      ))}
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm text-white/90">{resumoItens(p)}</p>
                    <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/15 px-4 py-3 text-sm font-bold">
                      <span>Acompanhar pedido</span>
                      <ChevronRight size={18} />
                    </div>
                  </a>
                );
              })}

              {anteriores.length > 0 && (
                <p className="px-1 pt-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
                  {ativos.length ? "Pedidos anteriores" : "Seus pedidos"}
                </p>
              )}

              {anteriores.map((p) => {
                const st = STATUS[String(p.status)] ?? STATUS.concluido;
                const podeRepetir = onPedirDeNovo && Array.isArray(p.itens) && p.itens.length > 0;
                return (
                  <div key={p.id} className="rounded-3xl bg-white p-4">
                    <a href={link(p)} className="block">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold">#{p.numero_pedido ?? p.id}</p>
                        <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ color: st.cor, backgroundColor: st.fundo }}>
                          {st.texto}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">{quando(p.created_at)}</p>
                      <p className="mt-2 line-clamp-2 text-sm text-zinc-700">{resumoItens(p)}</p>
                      <p className="mt-2 text-[15px] font-bold">{reais(p.total_pago || p.total || 0)}</p>
                    </a>
                    {podeRepetir && (
                      <button
                        type="button"
                        onClick={() => onPedirDeNovo!(p)}
                        className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border text-sm font-bold"
                        style={{ borderColor: `${corPrincipal}55`, color: corPrincipal }}
                      >
                        <RotateCcw size={16} /> Pedir de novo
                      </button>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      <LoginCustomer
        open={loginAberto}
        onClose={() => setLoginAberto(false)}
        onSuccess={() => {
          setLoginAberto(false);
          carregar();
        }}
      />
    </div>
  );
}
