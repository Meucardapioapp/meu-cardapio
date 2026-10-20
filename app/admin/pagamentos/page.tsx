"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/utils/apiFetch";
import { Banknote, CreditCard, Loader2, Lock, Save, Zap } from "lucide-react";
import { FaPix } from "react-icons/fa6";
import { toast } from "sonner";

type TipoChave = "cpf" | "cnpj" | "celular" | "email" | "aleatoria";

const TIPOS: { id: TipoChave; nome: string; exemplo: string }[] = [
  { id: "celular", nome: "Celular", exemplo: "(11) 91234-5678" },
  { id: "cpf", nome: "CPF", exemplo: "000.000.000-00" },
  { id: "cnpj", nome: "CNPJ", exemplo: "00.000.000/0001-00" },
  { id: "email", nome: "E-mail", exemplo: "voce@email.com" },
  { id: "aleatoria", nome: "Aleatória", exemplo: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
];

function Interruptor({ ligado, onClick, rotulo }: { ligado: boolean; onClick: () => void; rotulo: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={rotulo}
      onClick={onClick}
      className={`relative w-14 h-8 shrink-0 rounded-full transition ${ligado ? "bg-green-600" : "bg-zinc-300"}`}
    >
      <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${ligado ? "left-7" : "left-1"}`} />
    </button>
  );
}

function Linha({
  icone,
  titulo,
  texto,
  ligado,
  onClick,
}: {
  icone: React.ReactNode;
  titulo: string;
  texto: string;
  ligado: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center gap-4 py-4">
      <div className="w-11 h-11 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">{icone}</div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-zinc-900">{titulo}</p>
        <p className="text-sm text-zinc-500">{texto}</p>
      </div>
      <Interruptor ligado={ligado} onClick={onClick} rotulo={titulo} />
    </div>
  );
}

export default function PagamentosPage() {
  const [carregando, setCarregando] = useState(true);
  const [restauranteId, setRestauranteId] = useState<string | null>(null);

  // Na entrega / retirada (sem configuração salva, o cardápio aceita os dois)
  const [dinheiro, setDinheiro] = useState(true);
  const [cartao, setCartao] = useState(true);
  const [salvandoEntrega, setSalvandoEntrega] = useState(false);

  // Pix na chave do restaurante
  const [pixCadastrado, setPixCadastrado] = useState(false);
  const [pixAtivo, setPixAtivo] = useState(false);
  const [editandoPix, setEditandoPix] = useState(false);
  const [tipo, setTipo] = useState<TipoChave>("celular");
  const [chave, setChave] = useState("");
  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState("");
  const [senha, setSenha] = useState("");
  const [salvandoPix, setSalvandoPix] = useState(false);

  // Pix online (Pagar.me)
  const [pixOnline, setPixOnline] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("restaurante_id");
    setRestauranteId(id);

    // Tudo ao mesmo tempo: a tela abre de uma vez.
    Promise.all([
      id
        ? supabase.from("configuracoes_pagamento").select("dinheiro, cartao_entrega").eq("restaurante_id", id).maybeSingle()
        : Promise.resolve({ data: null }),
      apiFetch("/api/painel/pix-chave").then((r) => r.json()).catch(() => null),
      apiFetch("/api/restaurante").then((r) => r.json()).catch(() => null),
    ])
      .then(([config, pix, rest]: any[]) => {
        if (config?.data) {
          setDinheiro(config.data.dinheiro ?? false);
          setCartao(config.data.cartao_entrega ?? true);
        }

        const p = pix?.pix;
        if (p) {
          setPixCadastrado(true);
          setPixAtivo(Boolean(p.ativo));
          setTipo(p.tipo);
          setChave(p.chave);
          setNome(p.nome_recebedor);
          setCidade(p.cidade);
        } else {
          const r = rest?.restaurante;
          if (r?.nome_restaurante) setNome(String(r.nome_restaurante).slice(0, 25));
          if (r?.cidade) setCidade(String(r.cidade).slice(0, 15));
        }

        setPixOnline(Boolean(rest?.restaurante?.pix_online_ativo ?? rest?.pix_online_ativo));
      })
      .finally(() => setCarregando(false));
  }, []);

  async function salvarEntrega() {
    if (!restauranteId) return toast.error("Restaurante não encontrado.");
    setSalvandoEntrega(true);
    const { error } = await supabase
      .from("configuracoes_pagamento")
      .upsert({ restaurante_id: restauranteId, dinheiro, cartao_entrega: cartao }, { onConflict: "restaurante_id" });
    setSalvandoEntrega(false);

    if (error) return toast.error("Não foi possível salvar.", { description: error.message });
    toast.success("Formas de pagamento salvas. Já valem no cardápio.");
  }

  async function ligarPix(ativo: boolean) {
    setSalvandoPix(true);
    try {
      const d = await apiFetch("/api/painel/pix-chave", {
        method: "PUT",
        body: JSON.stringify({ acao: "ativo", ativo }),
      }).then((r) => r.json());
      if (!d?.success) return toast.error(d?.error || "Não foi possível salvar.");
      setPixAtivo(ativo);
      toast.success(ativo ? "Pix na sua chave ligado." : "Pix na sua chave desligado.");
    } finally {
      setSalvandoPix(false);
    }
  }

  async function salvarPix() {
    if (!chave.trim()) return toast.warning("Digite a chave Pix.");
    if (!nome.trim() || !cidade.trim()) return toast.warning("Preencha o nome e a cidade.");
    if (!senha) return toast.warning("Digite sua senha para confirmar.");

    setSalvandoPix(true);
    try {
      const d = await apiFetch("/api/painel/pix-chave", {
        method: "PUT",
        body: JSON.stringify({ acao: "salvar", tipo, chave, nome, cidade, senha }),
      }).then((r) => r.json());

      if (!d?.success) return toast.error(d?.error || "Não foi possível salvar.");

      setPixCadastrado(true);
      setPixAtivo(true);
      setEditandoPix(false);
      setSenha("");
      if (d.pix?.chave) setChave(d.pix.chave);
      toast.success("Chave Pix salva. Seus clientes já podem pagar no Pix.");
    } finally {
      setSalvandoPix(false);
    }
  }

  if (carregando) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 rounded-2xl bg-white animate-pulse" />
        ))}
      </div>
    );
  }

  const exemplo = TIPOS.find((t) => t.id === tipo)?.exemplo ?? "";
  const mostrarFormulario = !pixCadastrado || editandoPix;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900">Formas de pagamento</h1>
        <p className="text-zinc-500 mt-1">
          O dinheiro dos pedidos é seu: o cliente paga direto para você. O MeuCardápio cobra só a mensalidade.
        </p>
      </div>

      {/* 1. Na entrega / retirada */}
      <section className="rounded-2xl bg-white border p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Na entrega ou na retirada</p>
        <div className="divide-y">
          <Linha
            icone={<Banknote size={22} className="text-green-700" />}
            titulo="Dinheiro"
            texto="O cliente pode pedir troco."
            ligado={dinheiro}
            onClick={() => setDinheiro((v) => !v)}
          />
          <Linha
            icone={<CreditCard size={22} className="text-[#6D1F2F]" />}
            titulo="Cartão na sua maquininha"
            texto="Crédito ou débito, pago na entrega ou no balcão."
            ligado={cartao}
            onClick={() => setCartao((v) => !v)}
          />
        </div>
        <button
          onClick={salvarEntrega}
          disabled={salvandoEntrega}
          className="mt-2 h-11 px-5 rounded-xl bg-[#6D1F2F] text-white font-bold flex items-center gap-2 disabled:opacity-60"
        >
          {salvandoEntrega ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Salvar
        </button>
      </section>

      {/* 2. Pix na chave do restaurante */}
      <section className="rounded-2xl bg-white border p-5">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
            <FaPix size={22} color="#32BCAD" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold text-zinc-900">Pix na sua chave</p>
              <span className="text-[11px] font-bold uppercase bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Sem taxa</span>
            </div>
            <p className="text-sm text-zinc-500 mt-0.5">
              O cliente recebe o Pix copia e cola com o valor do pedido e paga direto na sua conta. Você confere no seu banco e
              marca &quot;Pix recebido&quot; no pedido.
            </p>
          </div>
          {pixCadastrado && !editandoPix && (
            <Interruptor ligado={pixAtivo} onClick={() => !salvandoPix && ligarPix(!pixAtivo)} rotulo="Pix na sua chave" />
          )}
        </div>

        {!mostrarFormulario ? (
          <div className="mt-4 rounded-xl bg-zinc-50 border p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0 text-sm">
              <p className="text-zinc-500">{TIPOS.find((t) => t.id === tipo)?.nome}</p>
              <p className="font-bold text-zinc-900 break-all">{chave}</p>
              <p className="text-zinc-500">{nome} · {cidade}</p>
            </div>
            <button onClick={() => setEditandoPix(true)} className="h-10 px-4 rounded-xl border font-semibold text-sm">
              Trocar chave
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div>
              <p className="text-xs font-semibold text-zinc-600 mb-1">Tipo da chave</p>
              <div className="flex flex-wrap gap-2">
                {TIPOS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTipo(t.id)}
                    className={`h-9 px-3 rounded-full text-sm font-semibold border ${
                      tipo === t.id ? "bg-[#6D1F2F] text-white border-[#6D1F2F]" : "bg-white text-zinc-700"
                    }`}
                  >
                    {t.nome}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="text-xs font-semibold text-zinc-600">Chave Pix</span>
              <input
                value={chave}
                onChange={(e) => setChave(e.target.value.slice(0, 77))}
                placeholder={exemplo}
                inputMode={tipo === "email" || tipo === "aleatoria" ? "text" : "numeric"}
                autoComplete="off"
                className="mt-1 w-full h-12 rounded-xl border px-3 text-base"
              />
            </label>

            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-semibold text-zinc-600">Nome que aparece no Pix</span>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value.slice(0, 25))}
                  className="mt-1 w-full h-12 rounded-xl border px-3 text-base"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-zinc-600">Cidade</span>
                <input
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value.slice(0, 15))}
                  className="mt-1 w-full h-12 rounded-xl border px-3 text-base"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-semibold text-zinc-600 flex items-center gap-1">
                <Lock size={12} /> Sua senha do painel (proteção contra troca da chave por outra pessoa)
              </span>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
                className="mt-1 w-full h-12 rounded-xl border px-3 text-base"
              />
            </label>

            <div className="flex gap-2">
              <button
                onClick={salvarPix}
                disabled={salvandoPix}
                className="h-11 px-5 rounded-xl bg-[#6D1F2F] text-white font-bold flex items-center gap-2 disabled:opacity-60"
              >
                {salvandoPix ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Salvar chave Pix
              </button>
              {editandoPix && (
                <button
                  onClick={() => {
                    setEditandoPix(false);
                    setSenha("");
                  }}
                  className="h-11 px-4 rounded-xl border font-semibold"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 3. Pix online automático */}
      <section className="rounded-2xl bg-white border p-5">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <Zap size={22} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold text-zinc-900">Pix online automático</p>
              <span className="text-[11px] font-bold uppercase bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-full">Opcional · 2,5% por Pix</span>
              {pixOnline && (
                <span className="text-[11px] font-bold uppercase bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Ativo</span>
              )}
            </div>
            <p className="text-sm text-zinc-500 mt-0.5">
              O pedido só chega depois que o Pix é pago, sem você precisar conferir. O valor cai na sua conta pelos saques.
            </p>
            <a href="/admin/dados-bancarios" className="inline-block mt-3 text-sm font-bold text-[#6D1F2F]">
              {pixOnline ? "Ver dados bancários →" : "Ativar com seus dados bancários →"}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
