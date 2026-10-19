"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

type Props = {
  pix: { tipo: string; chave: string; nome: string; valor: number; copiaECola: string };
  numeroPedido?: string | number;
  telefoneRestaurante?: string;
  cor: string;
};

const reais = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Pagamento do pedido por Pix direto na chave do restaurante. */
export default function PixChaveRestaurante({ pix, numeroPedido, telefoneRestaurante, cor }: Props) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(pix.copiaECola);
    } catch {
      const t = document.createElement("textarea");
      t.value = pix.copiaECola;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  }

  const fone = (telefoneRestaurante || "").replace(/\D/g, "");
  const linkComprovante = fone
    ? `https://wa.me/${fone.startsWith("55") ? fone : "55" + fone}?text=${encodeURIComponent(
        `Olá! Segue o comprovante do Pix do pedido #${numeroPedido ?? ""} (${reais(pix.valor)}).`
      )}`
    : null;

  return (
    <div className="bg-white rounded-3xl p-6 mt-6 shadow-sm border-2" style={{ borderColor: `${cor}40` }}>
      <p className="font-black text-lg">Pague com Pix para confirmar</p>
      <p className="text-sm text-zinc-500 mt-1">
        Copie o código abaixo e cole no app do seu banco, em Pix → Copia e cola. O valor já vem preenchido.
      </p>

      <div className="mt-5 flex justify-center">
        <div className="p-3 bg-white rounded-2xl border">
          <QRCodeSVG value={pix.copiaECola} size={180} />
        </div>
      </div>

      <p className="text-center text-3xl font-black mt-4">{reais(pix.valor)}</p>
      <p className="text-center text-sm text-zinc-500">para {pix.nome}</p>

      <button
        onClick={copiar}
        className="mt-5 w-full h-14 rounded-xl text-white font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition"
        style={{ backgroundColor: cor }}
      >
        {copiado ? <Check size={20} /> : <Copy size={20} />}
        {copiado ? "Código copiado!" : "Copiar código Pix"}
      </button>

      <p className="text-xs text-zinc-500 mt-4 break-all">
        Chave Pix: <span className="font-semibold text-zinc-700">{pix.chave}</span>
      </p>

      {linkComprovante && (
        <a
          href={linkComprovante}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 w-full h-12 rounded-xl border-2 border-green-600 text-green-700 font-bold flex items-center justify-center gap-2"
        >
          <FaWhatsapp size={20} />
          Enviar comprovante
        </a>
      )}

      <p className="text-xs text-zinc-500 mt-3 text-center">
        O restaurante confere o pagamento e confirma seu pedido.
      </p>
    </div>
  );
}
