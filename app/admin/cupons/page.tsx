"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Loader2, Pencil, Plus, TicketPercent, Trash2, Users, X } from "lucide-react";
import { apiFetch } from "@/utils/apiFetch";
import { normalizarCodigoCupom } from "@/lib/fidelidade";

type Cupom = {
  id: string;
  codigo: string;
  tipo: "percentual" | "valor";
  valor: number;
  pedido_minimo: number;
  limite_usos: number | null;
  uso_unico_por_cliente: boolean;
  valido_ate: string | null;
  ativo: boolean;
  usos: number;
  pedidos: number;
  pessoas: number;
  vendido: number;
  descontoDado: number;
};

type Formulario = {
  id?: string;
  codigo: string;
  tipo: "percentual" | "valor";
  valor: string;
  pedidoMinimo: string;
  limiteUsos: string;
  usoUnicoPorCliente: boolean;
  validoAte: string;
};

const VAZIO: Formulario = {
  codigo: "",
  tipo: "percentual",
  valor: "10",
  pedidoMinimo: "",
  limiteUsos: "",
  usoUnicoPorCliente: false,
  validoAte: "",
};

const reais = (v: number) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const numero = (t: string) => {
  const n = Number(String(t).replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

function descricao(c: Pick<Cupom, "tipo" | "valor">) {
  return c.tipo === "percentual"
    ? `${String(c.valor).replace(".", ",")}% de desconto`
    : `${reais(c.valor)} de desconto`;
}

function vencido(c: Cupom) {
  return Boolean(c.valido_ate && new Date(c.valido_ate).getTime() < Date.now());
}

export default function CuponsPage() {
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [form, setForm] = useState<Formulario | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluir, setExcluir] = useState<Cupom | null>(null);

  async function carregar() {
    try {
      const d = await apiFetch("/api/painel/cupons").then((r) => r.json());
      if (!d.success) {
        toast.error(d.error || "Não foi possível carregar os cupons.");
        return;
      }
      setCupons(d.cupons || []);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function editar(c: Cupom) {
    setForm({
      id: c.id,
      codigo: c.codigo,
      tipo: c.tipo,
      valor: String(c.valor).replace(".", ","),
      pedidoMinimo: c.pedido_minimo ? String(c.pedido_minimo).replace(".", ",") : "",
      limiteUsos: c.limite_usos ? String(c.limite_usos) : "",
      usoUnicoPorCliente: c.uso_unico_por_cliente,
      validoAte: c.valido_ate ? new Date(c.valido_ate).toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" }) : "",
    });
  }

  async function salvar() {
    if (!form) return;
    setSalvando(true);
    try {
      const corpo = {
        ...(form.id ? { id: form.id } : {}),
        codigo: form.codigo,
        tipo: form.tipo,
        valor: numero(form.valor),
        pedidoMinimo: numero(form.pedidoMinimo),
        limiteUsos: form.limiteUsos ? Math.floor(numero(form.limiteUsos)) : null,
        usoUnicoPorCliente: form.usoUnicoPorCliente,
        validoAte: form.validoAte || null,
        ativo: form.id ? cupons.find((c) => c.id === form.id)?.ativo ?? true : true,
      };
      const d = await apiFetch("/api/painel/cupons", {
        method: form.id ? "PATCH" : "POST",
        body: JSON.stringify(corpo),
      }).then((r) => r.json());

      if (!d.success) {
        toast.error(d.error || "Não foi possível salvar.");
        return;
      }
      toast.success(form.id ? "Cupom atualizado." : "Cupom criado! Divulgue o código para seus clientes.");
      setForm(null);
      carregar();
    } finally {
      setSalvando(false);
    }
  }

  async function alternar(c: Cupom) {
    setCupons((l) => l.map((x) => (x.id === c.id ? { ...x, ativo: !c.ativo } : x)));
    const d = await apiFetch("/api/painel/cupons", {
      method: "PATCH",
      body: JSON.stringify({ id: c.id, ativo: !c.ativo }),
    }).then((r) => r.json());
    if (!d.success) {
      toast.error("Não foi possível atualizar.");
      carregar();
    }
  }

  async function confirmarExclusao() {
    if (!excluir) return;
    const d = await apiFetch(`/api/painel/cupons?id=${excluir.id}`, { method: "DELETE" }).then((r) => r.json());
    if (!d.success) {
      toast.error("Não foi possível excluir.");
      return;
    }
    setCupons((l) => l.filter((c) => c.id !== excluir.id));
    setExcluir(null);
    toast.success("Cupom excluído.");
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900">Cupons de desconto</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Crie um código (ex.: VITOR10) e o cliente digita no pagamento para ganhar o desconto.
          </p>
        </div>
        <button
          onClick={() => setForm({ ...VAZIO })}
          className="h-12 px-5 rounded-xl bg-[#6D1F2F] text-white font-bold flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Novo cupom
        </button>
      </div>

      {carregando && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[0, 1].map((i) => <div key={i} className="h-40 rounded-2xl bg-white animate-pulse" />)}
        </div>
      )}

      {!carregando && cupons.length === 0 && (
        <div className="mt-6 rounded-2xl bg-white border p-8 text-center">
          <TicketPercent className="mx-auto text-[#6D1F2F]" size={36} />
          <p className="mt-3 text-lg font-bold">Nenhum cupom ainda</p>
          <p className="text-zinc-500 mt-1">Cupom é ótimo para divulgar no Instagram e trazer cliente novo.</p>
          <button
            onClick={() => setForm({ ...VAZIO })}
            className="inline-flex mt-4 h-12 px-5 rounded-xl bg-[#6D1F2F] text-white font-bold items-center gap-2"
          >
            <Plus size={18} /> Criar primeiro cupom
          </button>
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {cupons.map((c) => {
          const esgotado = c.limite_usos != null && c.usos >= c.limite_usos;
          const situacao = !c.ativo ? "Desligado" : vencido(c) ? "Vencido" : esgotado ? "Esgotado" : "Ativo";
          const valendo = situacao === "Ativo";

          return (
            <div key={c.id} className={`rounded-2xl bg-white border p-4 ${valendo ? "" : "opacity-70"}`}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(c.codigo).then(() => toast.success("Código copiado."));
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-[#6D1F2F] px-3 py-1 font-black text-lg tracking-wider text-[#6D1F2F]"
                    title="Copiar código"
                  >
                    {c.codigo} <Copy size={14} />
                  </button>
                  <p className="mt-2 font-bold text-zinc-900">{descricao(c)}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {[
                      c.pedido_minimo > 0 && `Pedido mínimo ${reais(c.pedido_minimo)}`,
                      c.limite_usos && `Limite ${c.limite_usos} usos`,
                      c.uso_unico_por_cliente && "1 vez por cliente",
                      c.valido_ate && `Vale até ${new Date(c.valido_ate).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}`,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Sem limite"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={c.ativo}
                    onClick={() => alternar(c)}
                    className={`relative w-11 h-6 rounded-full transition ${c.ativo ? "bg-green-500" : "bg-zinc-300"}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${c.ativo ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                  <span className={`text-[11px] font-bold ${valendo ? "text-green-700" : "text-zinc-500"}`}>{situacao}</span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-zinc-50 p-3 text-center">
                <div>
                  <p className="text-xl font-black text-zinc-900 flex items-center justify-center gap-1">
                    <Users size={16} /> {c.pessoas}
                  </p>
                  <p className="text-[11px] text-zinc-500">{c.pessoas === 1 ? "pessoa usou" : "pessoas usaram"}</p>
                </div>
                <div>
                  <p className="text-xl font-black text-zinc-900">{c.pedidos}</p>
                  <p className="text-[11px] text-zinc-500">pedidos</p>
                </div>
                <div>
                  <p className="text-base font-black text-zinc-900 leading-7">{reais(c.vendido)}</p>
                  <p className="text-[11px] text-zinc-500">vendidos</p>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => editar(c)}
                  className="h-10 flex-1 rounded-xl border text-sm font-semibold flex items-center justify-center gap-1"
                >
                  <Pencil size={14} /> Editar
                </button>
                <button
                  onClick={() => setExcluir(c)}
                  aria-label={`Excluir ${c.codigo}`}
                  className="h-10 w-10 rounded-xl border border-red-200 text-red-600 flex items-center justify-center"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Formulário */}
      {form && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center" onClick={() => setForm(null)}>
          <div
            className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">{form.id ? "Editar cupom" : "Novo cupom"}</h2>
              <button onClick={() => setForm(null)} aria-label="Fechar" className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                <X size={18} />
              </button>
            </div>

            <label className="block mt-4">
              <span className="text-sm font-semibold text-zinc-700">Código do cupom</span>
              <input
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: normalizarCodigoCupom(e.target.value) })}
                placeholder="VITOR10"
                autoCapitalize="characters"
                className="mt-1 w-full h-12 rounded-xl border px-3 text-lg font-black tracking-wider uppercase outline-none"
              />
              <span className="text-xs text-zinc-500">Letras e números, sem espaço (3 a 30).</span>
            </label>

            <div className="mt-4">
              <span className="text-sm font-semibold text-zinc-700">Tipo de desconto</span>
              <div className="mt-1 grid grid-cols-2 gap-2">
                {(["percentual", "valor"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, tipo: t })}
                    className={`h-12 rounded-xl border-2 font-semibold ${form.tipo === t ? "border-[#6D1F2F] text-[#6D1F2F]" : "border-zinc-200"}`}
                  >
                    {t === "percentual" ? "Porcentagem (%)" : "Valor (R$)"}
                  </button>
                ))}
              </div>
            </div>

            <label className="block mt-4">
              <span className="text-sm font-semibold text-zinc-700">
                {form.tipo === "percentual" ? "Quantos % de desconto?" : "Quantos reais de desconto?"}
              </span>
              <div className="mt-1 flex items-center gap-2 h-12 rounded-xl border px-3">
                {form.tipo === "valor" && <span className="text-zinc-500">R$</span>}
                <input
                  value={form.valor}
                  onChange={(e) => setForm({ ...form, valor: e.target.value.replace(/[^\d,]/g, "") })}
                  inputMode="decimal"
                  className="flex-1 text-base font-semibold outline-none"
                />
                {form.tipo === "percentual" && <span className="text-zinc-500">%</span>}
              </div>
              <span className="text-xs text-zinc-500">O desconto vale sobre os produtos (não sobre a taxa de entrega).</span>
            </label>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-semibold text-zinc-700">Pedido mínimo</span>
                <input
                  value={form.pedidoMinimo}
                  onChange={(e) => setForm({ ...form, pedidoMinimo: e.target.value.replace(/[^\d,]/g, "") })}
                  inputMode="decimal"
                  placeholder="Opcional"
                  className="mt-1 w-full h-12 rounded-xl border px-3 text-base outline-none"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-zinc-700">Limite de usos</span>
                <input
                  value={form.limiteUsos}
                  onChange={(e) => setForm({ ...form, limiteUsos: e.target.value.replace(/\D/g, "") })}
                  inputMode="numeric"
                  placeholder="Sem limite"
                  className="mt-1 w-full h-12 rounded-xl border px-3 text-base outline-none"
                />
              </label>
            </div>

            <label className="block mt-4">
              <span className="text-sm font-semibold text-zinc-700">Válido até</span>
              <input
                type="date"
                value={form.validoAte}
                onChange={(e) => setForm({ ...form, validoAte: e.target.value })}
                className="mt-1 w-full h-12 rounded-xl border px-3 text-base outline-none"
              />
              <span className="text-xs text-zinc-500">Deixe em branco para não vencer.</span>
            </label>

            <label className="mt-4 flex items-center gap-3 rounded-xl border p-3">
              <input
                type="checkbox"
                checked={form.usoUnicoPorCliente}
                onChange={(e) => setForm({ ...form, usoUnicoPorCliente: e.target.checked })}
                className="w-5 h-5"
              />
              <span className="text-sm font-medium">Cada cliente só pode usar 1 vez</span>
            </label>

            <button
              onClick={salvar}
              disabled={salvando}
              className="mt-5 w-full h-12 rounded-xl bg-[#6D1F2F] text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {salvando && <Loader2 size={18} className="animate-spin" />}
              {form.id ? "Salvar cupom" : "Criar cupom"}
            </button>
          </div>
        </div>
      )}

      {excluir && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-6" onClick={() => setExcluir(null)}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-black">Excluir o cupom {excluir.codigo}?</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Ele para de funcionar na hora. Se quiser só pausar, use a chave liga/desliga.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button onClick={() => setExcluir(null)} className="h-12 rounded-xl border font-semibold">Cancelar</button>
              <button onClick={confirmarExclusao} className="h-12 rounded-xl bg-red-600 text-white font-bold">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
