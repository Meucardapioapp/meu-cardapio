"use client";

import { LABEL_PAGAMENTO, type MetodoPag } from "@/lib/pagamentoDividido";

const reais = (v: number) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Mostra ao cliente as formas e valores quando o pagamento foi dividido. */
export default function ResumoDivisao({
  pagamentos,
  pago,
}: {
  pagamentos: { metodo: MetodoPag; valor: number }[] | null | undefined;
  pago?: boolean;
}) {
  if (!Array.isArray(pagamentos) || pagamentos.length < 2) return null;

  const statusParte = (m: MetodoPag) =>
    m === "pix"
      ? pago
        ? "pago ✓"
        : "pague no Pix"
      : m === "pix_chave"
        ? "Pix na chave"
        : "na entrega";

  return (
    <div className="rounded-2xl border bg-white p-4">
      <p className="font-bold text-zinc-900">Pagamento dividido</p>
      <div className="mt-2 space-y-1.5">
        {pagamentos.map((p, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-zinc-700">
              {LABEL_PAGAMENTO[p.metodo]}{" "}
              <span className="text-zinc-400">· {statusParte(p.metodo)}</span>
            </span>
            <span className="font-semibold text-zinc-900">{reais(p.valor)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
