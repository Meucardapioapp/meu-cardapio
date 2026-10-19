"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Banknote, Gift, Loader2, Minus, PartyPopper, Plus, Save } from "lucide-react";
import { apiFetch } from "@/utils/apiFetch";
import { textoDoPremio, type ProgramaFidelidade } from "@/lib/fidelidade";

const COR = "#6D1F2F";

function lerValor(texto: string) {
  const n = Number(texto.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export default function FidelidadePage() {
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [comPremio, setComPremio] = useState(0);

  const [ativo, setAtivo] = useState(false);
  const [pedidos, setPedidos] = useState(10);
  const [tipo, setTipo] = useState<"dinheiro" | "produto">("dinheiro");
  const [valor, setValor] = useState("10,00");
  const [premio, setPremio] = useState("");

  useEffect(() => {
    apiFetch("/api/painel/fidelidade")
      .then((r) => r.json())
      .then((d) => {
        const p: ProgramaFidelidade | null = d?.programa ?? null;
        if (p) {
          setAtivo(p.ativo);
          setPedidos(p.pedidosNecessarios);
          setTipo(p.tipoPremio);
          if (p.valorDesconto > 0) setValor(p.valorDesconto.toFixed(2).replace(".", ","));
          setPremio(p.premioDescricao);
        }
        setComPremio(Number(d?.comPremio || 0));
      })
      .catch(() => toast.error("Não foi possível carregar."))
      .finally(() => setCarregando(false));
  }, []);

  async function salvar(novoAtivo = ativo) {
    setSalvando(true);
    try {
      const resposta = await apiFetch("/api/painel/fidelidade", {
        method: "PUT",
        body: JSON.stringify({
          ativo: novoAtivo,
          pedidosNecessarios: pedidos,
          tipoPremio: tipo,
          valorDesconto: lerValor(valor),
          premioDescricao: premio,
        }),
      });
      const d = await resposta.json();
      if (!d.success) {
        toast.error(d.error || "Não foi possível salvar.");
        return false;
      }
      toast.success(novoAtivo ? "Programa ativo no seu cardápio!" : "Programa salvo (desligado).");
      return true;
    } finally {
      setSalvando(false);
    }
  }

  async function alternar() {
    const novo = !ativo;
    if (await salvar(novo)) setAtivo(novo);
  }

  const textoPremio = textoDoPremio({
    tipoPremio: tipo,
    valorDesconto: lerValor(valor),
    premioDescricao: premio.trim(),
  });

  if (carregando) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-7 w-7 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-black text-zinc-900">Programa de fidelidade</h1>
      <p className="text-sm text-zinc-500 mt-1">
        A cada pedido o cliente ganha 1 selo. Completou os selos, ganha o prêmio que você escolher.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Configuração */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-white border p-5 flex items-center gap-4">
            <div className="flex-1">
              <p className="font-bold text-zinc-900">Mostrar no meu cardápio</p>
              <p className="text-sm text-zinc-500">
                {ativo ? "Ligado: seus clientes estão juntando selos." : "Desligado: não aparece para os clientes."}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={ativo}
              disabled={salvando}
              onClick={alternar}
              className={`relative w-14 h-8 rounded-full transition shrink-0 ${ativo ? "bg-green-500" : "bg-zinc-300"}`}
            >
              <span className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all ${ativo ? "left-7" : "left-1"}`} />
            </button>
          </div>

          <div className="rounded-2xl bg-white border p-5">
            <p className="font-bold text-zinc-900">A cada quantos pedidos o cliente ganha o prêmio?</p>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPedidos((n) => Math.max(2, n - 1))}
                className="w-12 h-12 rounded-xl border flex items-center justify-center"
                aria-label="Menos"
              >
                <Minus size={18} />
              </button>
              <span className="w-16 text-center text-3xl font-black">{pedidos}</span>
              <button
                type="button"
                onClick={() => setPedidos((n) => Math.min(50, n + 1))}
                className="w-12 h-12 rounded-xl border flex items-center justify-center"
                aria-label="Mais"
              >
                <Plus size={18} />
              </button>
              <span className="text-zinc-500">pedidos</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white border p-5">
            <p className="font-bold text-zinc-900">Qual é o prêmio?</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setTipo("dinheiro")}
                className="rounded-2xl border-2 p-4 text-left"
                style={{ borderColor: tipo === "dinheiro" ? COR : "#E4E4E7" }}
              >
                <Banknote size={22} style={{ color: COR }} />
                <p className="mt-2 font-bold">Desconto em dinheiro</p>
                <p className="text-sm text-zinc-500">Ex.: R$ 10,00 de desconto no pedido</p>
              </button>
              <button
                type="button"
                onClick={() => setTipo("produto")}
                className="rounded-2xl border-2 p-4 text-left"
                style={{ borderColor: tipo === "produto" ? COR : "#E4E4E7" }}
              >
                <Gift size={22} style={{ color: COR }} />
                <p className="mt-2 font-bold">Um produto de brinde</p>
                <p className="text-sm text-zinc-500">Ex.: 1 pizza doce, 1 sobremesa</p>
              </button>
            </div>

            {tipo === "dinheiro" ? (
              <label className="block mt-4">
                <span className="text-sm font-semibold text-zinc-700">Valor do desconto</span>
                <div className="mt-1 flex items-center gap-2 rounded-xl border px-3 h-12">
                  <span className="text-zinc-500">R$</span>
                  <input
                    value={valor}
                    onChange={(e) => setValor(e.target.value.replace(/[^\d,]/g, ""))}
                    inputMode="decimal"
                    className="flex-1 text-base font-semibold outline-none"
                    placeholder="10,00"
                  />
                </div>
              </label>
            ) : (
              <label className="block mt-4">
                <span className="text-sm font-semibold text-zinc-700">Qual produto o cliente ganha?</span>
                <input
                  value={premio}
                  onChange={(e) => setPremio(e.target.value.slice(0, 80))}
                  className="mt-1 w-full rounded-xl border px-3 h-12 text-base outline-none"
                  placeholder="1 pizza doce de morango"
                />
                <span className="text-xs text-zinc-500">
                  O brinde aparece no pedido e na comanda, com valor R$ 0,00.
                </span>
              </label>
            )}
          </div>

          <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-900 leading-6">
            <strong>Todos os pedidos contam:</strong> Pix pago, dinheiro e cartão na entrega. Pedido recusado ou
            cancelado não conta. O cliente usa o prêmio quando quiser, marcando a opção no pagamento.
            {comPremio > 0 && (
              <>
                <br />
                Hoje <strong>{comPremio}</strong> {comPremio === 1 ? "cliente está" : "clientes estão"} com o prêmio liberado.
              </>
            )}
          </div>

          <button
            onClick={() => salvar()}
            disabled={salvando}
            className="w-full sm:w-auto h-12 px-6 rounded-xl bg-[#6D1F2F] text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {salvando ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Salvar programa
          </button>
        </div>

        {/* Prévia */}
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Como o cliente vê</p>

          <div className="rounded-2xl bg-white border p-4 text-center">
            <p className="text-sm text-zinc-800">
              Junte <strong>{pedidos} pedidos</strong> e ganhe <strong style={{ color: COR }}>{textoPremio}</strong>!
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {Array.from({ length: pedidos }).map((_, i) => (
                <span
                  key={i}
                  className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold"
                  style={{
                    borderColor: COR,
                    backgroundColor: i < 3 ? COR : "transparent",
                    color: i < 3 ? "white" : COR,
                  }}
                >
                  {i + 1}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-zinc-500">Faltam {Math.max(pedidos - 3, 0)} pedidos para o seu prêmio.</p>
          </div>

          <div className="rounded-2xl p-5 text-center text-white" style={{ backgroundColor: COR }}>
            <PartyPopper className="mx-auto" size={30} />
            <p className="mt-2 text-lg font-black">Parabéns!! Você é nosso cliente fiel</p>
            <p className="text-white/90">e vai receber agora:</p>
            <p className="mt-1 text-2xl font-black">{textoPremio}</p>
          </div>

          <div className="rounded-2xl bg-white border p-4 text-sm">
            <p className="font-bold mb-2">No pagamento</p>
            <div className="flex justify-between text-zinc-700"><span>Produtos</span><span>R$ 100,00</span></div>
            <div className="flex justify-between text-zinc-700"><span>Taxa de entrega</span><span>R$ 15,00</span></div>
            {tipo === "dinheiro" ? (
              <div className="flex justify-between text-green-700 font-semibold">
                <span>Cliente fiel</span><span>- {textoPremio.replace(" de desconto", "")}</span>
              </div>
            ) : (
              <div className="flex justify-between text-green-700 font-semibold">
                <span>Cliente fiel + {premio || "brinde"}</span><span>R$ 0,00</span>
              </div>
            )}
            <div className="mt-2 pt-2 border-t flex justify-between font-black">
              <span>Total</span>
              <span>
                {(115 - (tipo === "dinheiro" ? Math.min(lerValor(valor), 115) : 0)).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
