"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

/**
 * Avaliação do pedido pelo cliente (1 a 5 estrelas + comentário).
 * Aparece quando o pedido sai para entrega ou é concluído.
 */
export default function AvaliarPedido({
  pedidoId,
  codigo,
  status,
  cor,
}: {
  pedidoId: string;
  codigo: string;
  status: string;
  cor: string;
}) {
  const [jaAvaliou, setJaAvaliou] = useState<boolean | null>(null);
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const podeAvaliar = status === "concluido" || status === "entrega";

  useEffect(() => {
    if (!podeAvaliar) return;
    fetch(`/api/avaliacao?id=${encodeURIComponent(pedidoId)}&c=${encodeURIComponent(codigo)}`)
      .then((r) => r.json())
      .then((d) => setJaAvaliou(Boolean(d?.avaliado)))
      .catch(() => setJaAvaliou(false));
  }, [pedidoId, codigo, podeAvaliar]);

  if (!podeAvaliar || jaAvaliou == null) return null;

  if (jaAvaliou) {
    return (
      <div className="py-5 border-b text-center">
        <p className="font-semibold">Obrigado pela avaliação! 💛</p>
      </div>
    );
  }

  async function enviar() {
    if (!nota) {
      setErro("Toque nas estrelas para dar sua nota.");
      return;
    }
    setEnviando(true);
    setErro("");
    try {
      const d = await fetch("/api/avaliacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pedidoId, c: codigo, nota, comentario }),
      }).then((r) => r.json());
      if (!d?.success) {
        setErro(d?.error || "Não foi possível enviar.");
        return;
      }
      setJaAvaliou(true);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="py-5 border-b">
      <p className="font-bold text-lg">Como foi seu pedido?</p>
      <div className="mt-3 flex gap-2" role="radiogroup" aria-label="Nota de 1 a 5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={nota === n}
            aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
            onClick={() => setNota(n)}
            className="p-1"
          >
            <Star size={34} strokeWidth={1.6} style={{ color: n <= nota ? cor : "#D4D4D8", fill: n <= nota ? cor : "transparent" }} />
          </button>
        ))}
      </div>
      {nota > 0 && (
        <>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value.slice(0, 300))}
            placeholder="Quer contar algo? (opcional)"
            rows={3}
            className="mt-3 w-full rounded-xl border p-3 text-base outline-none"
          />
          <button
            onClick={enviar}
            disabled={enviando}
            className="mt-3 w-full h-12 rounded-xl text-white font-bold disabled:opacity-60"
            style={{ backgroundColor: cor }}
          >
            {enviando ? "Enviando..." : "Enviar avaliação"}
          </button>
        </>
      )}
      {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}
    </div>
  );
}
