"use client";

import { useRef, useState } from "react";
import QRCode from "react-qr-code";
import { ChevronDown, Printer } from "lucide-react";

/**
 * QR Code por mesa: o cliente escaneia, faz o pedido pelo cardápio e o
 * pedido chega no painel com o número da mesa (sem endereço e sem taxa).
 */
export default function QrMesas({ link, nome }: { link: string; nome: string }) {
  const [aberto, setAberto] = useState(false);
  const [quantidade, setQuantidade] = useState(10);
  const area = useRef<HTMLDivElement>(null);

  const total = Math.max(1, Math.min(100, Math.floor(quantidade || 1)));
  const mesas = Array.from({ length: total }, (_, i) => i + 1);

  function imprimir() {
    const janela = window.open("", "_blank");
    if (!janela || !area.current) return;
    janela.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>QR Code das mesas</title>
<style>
  body{font-family:system-ui,Arial,sans-serif;margin:0;padding:12px}
  .grade{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
  .cartao{border:2px dashed #999;border-radius:16px;padding:16px;text-align:center;break-inside:avoid}
  .cartao svg{width:170px;height:170px}
  .nome{font-size:14px;color:#555;margin:0}
  .mesa{font-size:30px;font-weight:900;margin:4px 0 10px}
  .dica{font-size:13px;margin:10px 0 0}
  @media print{body{padding:0}}
</style></head><body><div class="grade">${area.current.innerHTML}</div>
<script>window.onload=function(){window.print()}</script></body></html>`);
    janela.document.close();
  }

  return (
    <div className="mt-8 rounded-3xl border bg-white">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-5 text-left"
      >
        <div>
          <p className="text-lg font-black">🍽️ QR Code para as mesas</p>
          <p className="text-sm text-zinc-500">
            Para quem atende no salão: o cliente pede pelo celular e o pedido chega com o número da mesa.
          </p>
        </div>
        <ChevronDown className={`shrink-0 transition-transform ${aberto ? "rotate-180" : ""}`} />
      </button>

      {aberto && (
        <div className="border-t p-5">
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm font-semibold">
              Quantas mesas?
              <input
                type="number"
                min={1}
                max={100}
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
                className="mt-1 block h-11 w-28 rounded-xl border px-3 text-base"
              />
            </label>
            <button
              type="button"
              onClick={imprimir}
              className="flex h-11 items-center gap-2 rounded-xl bg-[#7A1F3D] px-5 font-bold text-white"
            >
              <Printer size={18} /> Imprimir QR Codes
            </button>
          </div>

          <div ref={area} className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {mesas.map((n) => (
              <div key={n} className="cartao rounded-2xl border border-dashed p-3 text-center">
                <p className="nome text-xs text-zinc-500">{nome}</p>
                <p className="mesa text-2xl font-black">Mesa {n}</p>
                <QRCode value={`${link}?mesa=${n}`} size={128} style={{ width: "100%", height: "auto", maxWidth: 140 }} />
                <p className="dica mt-2 text-xs">Aponte a câmera e faça seu pedido</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
