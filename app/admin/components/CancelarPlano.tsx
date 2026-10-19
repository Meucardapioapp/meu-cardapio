"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Lock, X } from "lucide-react";
import { apiFetch } from "@/utils/apiFetch";
import type { EstadoAssinatura } from "@/lib/planos";

const MOTIVOS = [
  "Está caro para mim agora",
  "Estou vendendo pouco pelo cardápio",
  "Fechei ou pausei o restaurante",
  "Faltou alguma função que eu preciso",
  "Tive problemas técnicos",
  "Vou usar outro sistema",
  "Outro motivo",
];

const dataBR = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "");

/** Cancelamento do plano: motivo → o que melhorar → senha. Cancela de verdade na Pagar.me. */
export default function CancelarPlano() {
  const [assinatura, setAssinatura] = useState<EstadoAssinatura | null>(null);
  const [aberto, setAberto] = useState(false);
  const [passo, setPasso] = useState(1);
  const [motivo, setMotivo] = useState("");
  const [outro, setOutro] = useState("");
  const [melhorar, setMelhorar] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function carregar() {
    const d = await apiFetch("/api/assinatura").then((r) => r.json()).catch(() => null);
    if (d?.success) setAssinatura(d.assinatura);
  }

  useEffect(() => {
    carregar();
    // Chegou pelo link "Cancelar plano" da tela Meu plano
    if (typeof window !== "undefined" && window.location.hash === "#cancelar-plano") {
      setTimeout(() => document.getElementById("cancelar-plano")?.scrollIntoView({ behavior: "smooth" }), 300);
    }
  }, []);

  function fechar() {
    if (enviando) return;
    setAberto(false);
    setPasso(1);
    setSenha("");
  }

  async function confirmar() {
    if (!senha) return toast.warning("Digite sua senha para confirmar.");
    setEnviando(true);
    try {
      const d = await apiFetch("/api/assinatura/cancelar", {
        method: "POST",
        body: JSON.stringify({
          motivo: motivo === "Outro motivo" && outro.trim() ? `Outro: ${outro.trim()}`.slice(0, 80) : motivo,
          melhorar,
          senha,
        }),
      }).then((r) => r.json());

      if (!d?.success) {
        toast.error(d?.error || "Não foi possível cancelar.");
        return;
      }

      toast.success(
        d.tinhaCobranca
          ? `Plano cancelado. A cobrança automática foi encerrada na Pagar.me. Seu cardápio fica no ar até ${dataBR(d.acessoAte)}.`
          : `Plano cancelado. Seu cardápio fica no ar até ${dataBR(d.acessoAte)}.`
      );
      setAberto(false);
      setPasso(1);
      setSenha("");
      await carregar();
      window.dispatchEvent(new Event("assinatura-atualizada"));
    } finally {
      setEnviando(false);
    }
  }

  if (!assinatura) return null;

  const cancelado = assinatura.status === "cancelada";
  const vencido = !assinatura.ativo;
  const temCartao = assinatura.metodo === "cartao" && (assinatura.status === "ativa" || assinatura.status === "inadimplente");

  return (
    <div id="cancelar-plano" className="scroll-mt-24 rounded-3xl border bg-white p-6 sm:p-8 shadow-sm">
      <h2 className="text-xl font-bold">Cancelar plano</h2>

      {cancelado ? (
        <p className="mt-2 text-zinc-600">
          Seu plano está cancelado: não haverá novas cobranças.{" "}
          {assinatura.ativo ? `O cardápio continua no ar até ${dataBR(assinatura.acessoAte)}. ` : ""}
          Quer voltar?{" "}
          <Link href="/admin/plano" className="font-semibold text-[#6D1F2F] underline">
            Assinar de novo
          </Link>
        </p>
      ) : vencido ? (
        <p className="mt-2 text-zinc-600">Seu plano não está ativo, então não há cobrança para cancelar.</p>
      ) : (
        <>
          <p className="mt-2 text-zinc-600">
            {temCartao
              ? "Encerra a cobrança automática no cartão. Você não paga mais nada e o cardápio fica no ar até o fim do período já pago."
              : "Você não paga mais nada e o cardápio fica no ar até o fim do período atual."}
          </p>
          <button
            onClick={() => setAberto(true)}
            className="mt-4 h-11 px-5 rounded-xl border border-red-200 text-red-600 font-semibold hover:bg-red-50"
          >
            Cancelar meu plano
          </button>
        </>
      )}

      {aberto && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 sm:p-6" onClick={fechar}>
          <div
            className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-zinc-400">Passo {passo} de 3</p>
                <h3 className="text-xl font-black mt-0.5">
                  {passo === 1 ? "Por que você quer cancelar?" : passo === 2 ? "O que podemos melhorar?" : "Confirme com sua senha"}
                </h3>
              </div>
              <button onClick={fechar} aria-label="Fechar" className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                <X size={18} />
              </button>
            </div>

            {passo === 1 && (
              <div className="mt-4 space-y-2">
                {MOTIVOS.map((m) => (
                  <label
                    key={m}
                    className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer ${
                      motivo === m ? "border-[#6D1F2F] bg-[#6D1F2F]/5" : "border-zinc-200"
                    }`}
                  >
                    <input type="radio" name="motivo" checked={motivo === m} onChange={() => setMotivo(m)} className="w-4 h-4" />
                    <span className="text-sm font-medium">{m}</span>
                  </label>
                ))}
                {motivo === "Outro motivo" && (
                  <input
                    value={outro}
                    onChange={(e) => setOutro(e.target.value.slice(0, 70))}
                    placeholder="Conte rapidinho"
                    className="w-full h-11 rounded-xl border px-3 text-base"
                  />
                )}
                <button
                  disabled={!motivo}
                  onClick={() => setPasso(2)}
                  className="mt-3 w-full h-12 rounded-xl bg-zinc-900 text-white font-bold disabled:opacity-40"
                >
                  Continuar
                </button>
              </div>
            )}

            {passo === 2 && (
              <div className="mt-4">
                <textarea
                  value={melhorar}
                  onChange={(e) => setMelhorar(e.target.value.slice(0, 1000))}
                  rows={4}
                  placeholder="Sua opinião ajuda muito (opcional)"
                  className="w-full rounded-xl border p-3 text-base"
                />
                <div className="mt-3 rounded-xl bg-zinc-50 border p-4 text-sm text-zinc-700 space-y-1">
                  <p className="font-semibold text-zinc-900">O que acontece ao cancelar:</p>
                  <p>• Nenhuma cobrança nova{temCartao ? " no cartão" : ""}.</p>
                  <p>• Seu cardápio continua no ar até {dataBR(assinatura.acessoAte)}.</p>
                  <p>• Depois disso ele sai do ar, mas seus produtos e clientes ficam guardados.</p>
                  <p>• Você pode voltar quando quiser em Meu plano.</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button onClick={() => setPasso(1)} className="h-12 rounded-xl border font-semibold">
                    Voltar
                  </button>
                  <button onClick={() => setPasso(3)} className="h-12 rounded-xl bg-zinc-900 text-white font-bold">
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {passo === 3 && (
              <div className="mt-4">
                <label className="block">
                  <span className="text-xs font-semibold text-zinc-600 flex items-center gap-1">
                    <Lock size={12} /> Sua senha do painel
                  </span>
                  <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    autoComplete="current-password"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && confirmar()}
                    className="mt-1 w-full h-12 rounded-xl border px-3 text-base"
                  />
                </label>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button onClick={fechar} disabled={enviando} className="h-12 rounded-xl border font-semibold">
                    Manter plano
                  </button>
                  <button
                    onClick={confirmar}
                    disabled={enviando}
                    className="h-12 rounded-xl bg-red-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {enviando && <Loader2 size={16} className="animate-spin" />}
                    Cancelar plano
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
