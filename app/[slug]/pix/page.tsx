"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Copy, LoaderCircle, ShieldCheck } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useRestaurant } from "@/contexts/RestaurantContext";
import { reais } from "@/lib/dinheiro";
import { limparCarrinho } from "@/lib/carrinho";

function copiarTexto(texto: string) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(texto);
  // Navegadores antigos
  const area = document.createElement("textarea");
  area.value = texto;
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  area.remove();
  return Promise.resolve();
}

function PixContent() {
  const params = useParams();
  const router = useRouter();
  const busca = useSearchParams();
  const slug = params.slug as string;
  const pedidoId = busca.get("id");
  const codigoPedido = busca.get("c") || "";
  const codigoPix = useMemo(() => busca.get("qr") || "", [busca]);
  const expiraEm = useMemo(() => {
    const t = Date.parse(busca.get("exp") || "");
    return Number.isFinite(t) ? t : Date.now() + 60 * 60 * 1000;
  }, [busca]);

  const { logo, corPrincipal } = useRestaurant();
  const [copiado, setCopiado] = useState(false);
  const [aprovado, setAprovado] = useState(false);
  const [conferindo, setConferindo] = useState(false);
  const [agora, setAgora] = useState(Date.now());
  const [pedido, setPedido] = useState<any>(null);
  const terminou = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!pedidoId) return;
    fetch(`/api/pedido?id=${encodeURIComponent(pedidoId)}&c=${encodeURIComponent(codigoPedido)}`)
      .then((r) => r.json())
      .then((d) => setPedido(d?.pedido ?? null))
      .catch(() => {});
  }, [pedidoId, codigoPedido]);

  const conferir = useCallback(async () => {
    if (!pedidoId || terminou.current) return;
    try {
      const r = await fetch(`/api/pedido-status?id=${encodeURIComponent(pedidoId)}&c=${encodeURIComponent(codigoPedido)}`);
      const d = await r.json();
      if (d.payment_status === "approved" && !terminou.current) {
        terminou.current = true;
        setAprovado(true);
        limparCarrinho(slug);
        try {
          localStorage.removeItem(`endereco-${slug}`);
          localStorage.removeItem("dadosRetirada");
          localStorage.removeItem("tipoPedido");
          sessionStorage.removeItem(`sessao-${slug}`);
        } catch {}
        setTimeout(() => router.replace(`/${slug}/pedido-aprovado?id=${pedidoId}&c=${codigoPedido}`), 900);
      }
    } catch {}
  }, [pedidoId, codigoPedido, slug, router]);

  // Confere a cada 3 s e assim que o cliente volta do app do banco.
  useEffect(() => {
    const t = setInterval(conferir, 3000);
    const aoVoltar = () => document.visibilityState === "visible" && conferir();
    document.addEventListener("visibilitychange", aoVoltar);
    window.addEventListener("focus", aoVoltar);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", aoVoltar);
      window.removeEventListener("focus", aoVoltar);
    };
  }, [conferir]);

  async function copiar() {
    await copiarTexto(codigoPix).catch(() => {});
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  }

  async function jaPaguei() {
    setConferindo(true);
    await conferir();
    setTimeout(() => setConferindo(false), 1500);
  }

  const restante = Math.max(0, Math.floor((expiraEm - agora) / 1000));
  const expirou = restante === 0 && !aprovado;
  const relogio = `${String(Math.floor(restante / 60)).padStart(2, "0")}:${String(restante % 60).padStart(2, "0")}`;
  const zap = String(pedido?.telefone_restaurante || pedido?.whatsapp_restaurante || "").replace(/\D/g, "").replace(/^55/, "");

  if (!codigoPix) {
    return <div className="flex min-h-screen items-center justify-center p-6 text-center text-lg font-semibold">Código Pix não encontrado.</div>;
  }

  return (
    <main className="min-h-screen bg-zinc-50 pb-10 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-md items-center gap-3 px-3">
          <button
            type="button"
            onClick={() => router.push(`/${slug}/pagamento`)}
            aria-label="Voltar"
            className="flex h-10 w-10 items-center justify-center rounded-full active:bg-zinc-100"
          >
            <ArrowLeft size={22} style={{ color: corPrincipal }} />
          </button>
          {logo && <img src={logo} alt="" className="h-8 w-8 rounded-full object-cover" />}
          <p className="flex-1 text-[15px] font-bold">Pagar com Pix</p>
          <span className="flex items-center gap-1 text-xs text-zinc-500">
            <ShieldCheck size={14} /> Seguro
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-md space-y-4 px-4 pt-5">
        {aprovado ? (
          <div className="rounded-3xl bg-emerald-600 p-6 text-center text-white">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
              <Check size={30} strokeWidth={3} />
            </div>
            <p className="mt-3 text-xl font-extrabold">Pagamento confirmado!</p>
            <p className="mt-1 text-sm text-white/85">Abrindo o acompanhamento do pedido...</p>
          </div>
        ) : expirou ? (
          <div className="rounded-3xl bg-white p-6 text-center">
            <p className="text-lg font-bold">Este Pix expirou</p>
            <p className="mt-1 text-sm text-zinc-500">Se você já pagou, aguarde: a confirmação chega em instantes. Se não, faça o pedido de novo.</p>
            <button
              type="button"
              onClick={jaPaguei}
              className="mt-4 h-12 w-full rounded-xl border border-zinc-200 font-semibold"
            >
              {conferindo ? "Conferindo..." : "Já paguei, conferir"}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/${slug}/carrinho`)}
              className="mt-2 h-12 w-full rounded-xl font-semibold text-white"
              style={{ backgroundColor: corPrincipal }}
            >
              Fazer o pedido de novo
            </button>
          </div>
        ) : (
          <>
            <div className="rounded-3xl bg-white p-5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-semibold text-zinc-500">Valor</p>
                  <p className="text-2xl font-extrabold">{pedido?.total != null ? reais(pedido.total) : "—"}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-zinc-500">Expira em</p>
                  <p className="font-mono text-lg font-bold tabular-nums">{relogio}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={copiar}
                className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-[16px] font-bold text-white shadow-lg transition active:scale-[0.98]"
                style={{ backgroundColor: copiado ? "#059669" : corPrincipal }}
              >
                {copiado ? <Check size={20} strokeWidth={3} /> : <Copy size={20} />}
                {copiado ? "Código copiado!" : "Copiar código Pix"}
              </button>

              <ol className="mt-5 space-y-3 text-sm text-zinc-600">
                {[
                  "Toque em “Copiar código Pix”",
                  "Abra o app do seu banco e escolha Pix → Pix Copia e Cola",
                  "Cole o código e confirme o pagamento",
                ].map((passo, i) => (
                  <li key={i} className="flex gap-3">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: corPrincipal }}
                    >
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{passo}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <LoaderCircle size={20} className="shrink-0 animate-spin text-amber-600" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-amber-900">Aguardando pagamento</p>
                <p className="text-xs text-amber-800">Depois de pagar, volte aqui: a confirmação aparece sozinha.</p>
              </div>
              <button type="button" onClick={jaPaguei} className="shrink-0 text-xs font-bold text-amber-900 underline">
                {conferindo ? "..." : "Já paguei"}
              </button>
            </div>

            <details className="rounded-3xl bg-white p-5">
              <summary className="cursor-pointer text-sm font-semibold text-zinc-700">Pagar por outro celular (QR Code)</summary>
              <div className="mt-4 flex justify-center">
                <div className="rounded-2xl border p-3">
                  <QRCodeCanvas value={codigoPix} size={220} includeMargin />
                </div>
              </div>
              <p className="mt-3 break-all rounded-xl bg-zinc-50 p-3 font-mono text-[11px] leading-4 text-zinc-500">{codigoPix}</p>
            </details>
          </>
        )}

        {zap && !aprovado && (
          <a href={`https://wa.me/55${zap}`} className="block text-center text-sm font-semibold text-emerald-700">
            Problema com o pagamento? Fale com o restaurante
          </a>
        )}
        <p className="text-center text-xs text-zinc-400">Pagamento processado pela Pagar.me</p>
      </div>
    </main>
  );
}

export default function PixPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <LoaderCircle className="animate-spin" size={36} />
        </div>
      }
    >
      <PixContent />
    </Suspense>
  );
}
