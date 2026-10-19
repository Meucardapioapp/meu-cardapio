"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Check,
  ChefHat,
  Loader2,
  Minus,
  Plus,
  Printer,
  Receipt,
  RotateCcw,
  Settings,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { apiFetch } from "@/utils/apiFetch";
import AbrirMesa from "@/app/components/salao/AbrirMesa";
import CardapioSalao, { type ItemEnviado, type ProdutoSalao } from "@/app/components/salao/CardapioSalao";
import { FORMAS, NOME_FORMA, rotuloItem, hora, minutosDesde, porLancamento, reais, type Comanda, type ItemComanda } from "@/app/components/salao/comum";
import { tocarAlerta } from "@/lib/alerta-sonoro";

const COR = "#6D1F2F";

type Fechada = { id: string; numero: number; mesa: string; total: number; taxa_valor: number; forma_pagamento: string | null; garcom_nome: string | null; fechada_em: string; status: string };

function inicioDoDia() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

async function postar(corpo: Record<string, unknown>) {
  const r = await apiFetch("/api/salao/comanda", { method: "POST", body: JSON.stringify(corpo) });
  return r.json().catch(() => null);
}

function imprimir(id: string, lancamento?: string) {
  window.open(`/imprimir/salao/${id}${lancamento ? `?l=${lancamento}` : ""}`, "_blank");
}

/** Área Restaurante: mesas abertas, comanda, fechamento da conta. */
export default function SalaoPage() {
  const [abertas, setAbertas] = useState<Comanda[]>([]);
  const [fechadas, setFechadas] = useState<Fechada[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [indisponivel, setIndisponivel] = useState(false);
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [abrindo, setAbrindo] = useState(false);
  const [configurando, setConfigurando] = useState(false);
  const [dono, setDono] = useState(true);
  const [novidades, setNovidades] = useState<Record<string, boolean>>({});
  const vistos = useRef<Record<string, string> | null>(null);

  const carregar = useCallback(async () => {
    try {
      const r = await apiFetch(`/api/salao/mesas?desde=${encodeURIComponent(inicioDoDia())}`);
      const d = await r.json();
      if (!d?.success) {
        if (d?.indisponivel) setIndisponivel(true);
        return;
      }
      const lista: Comanda[] = d.abertas ?? [];
      // Pedido novo lançado pelo garçom (ou QR) desde a última olhada: destaca e toca.
      if (vistos.current) {
        const novas: Record<string, boolean> = {};
        let tocar = false;
        for (const c of lista) {
          const ultimo = c.ultimo_lancamento || "";
          const visto = vistos.current[c.id];
          if (ultimo && (visto === undefined || ultimo > visto)) {
            novas[c.id] = true;
            tocar = true;
          }
        }
        if (tocar) {
          tocarAlerta("pedido");
          setNovidades((n) => ({ ...n, ...novas }));
        }
      }
      vistos.current = Object.fromEntries(lista.map((c) => [c.id, c.ultimo_lancamento || ""]));
      // O menu só acende para o que chegar depois desta olhada.
      try {
        const maisNovo = lista.reduce((m, c) => (c.ultimo_lancamento && c.ultimo_lancamento > m ? c.ultimo_lancamento : m), "");
        if (maisNovo && maisNovo > (localStorage.getItem("salao_visto") || "")) localStorage.setItem("salao_visto", maisNovo);
      } catch {}
      setAbertas(lista);
      setFechadas(d.fechadas ?? []);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
    try {
      setDono(localStorage.getItem("papel_painel") !== "atendente");
    } catch {}
    const t = setInterval(() => !document.hidden && carregar(), 5000);
    return () => clearInterval(t);
  }, [carregar]);

  useEffect(() => {
    if (selecionada) setNovidades((n) => ({ ...n, [selecionada]: false }));
    window.dispatchEvent(new Event("salao-visto"));
  }, [selecionada, abertas]);

  async function abrirMesa(mesa: string, pessoas: number | null) {
    const r = await apiFetch("/api/salao/mesas", { method: "POST", body: JSON.stringify({ mesa, pessoas }) });
    const d = await r.json().catch(() => null);
    if (!d?.success) {
      toast.error(d?.error || "Não foi possível abrir a mesa.");
      return false;
    }
    if (!d.nova) toast.info(`A mesa ${d.comanda.mesa} já estava aberta.`);
    setAbrindo(false);
    await carregar();
    setSelecionada(d.comanda.id);
    return true;
  }

  const pediramConta = abertas.filter((c) => c.pediu_conta).length;
  const vendidoHoje = fechadas.filter((f) => f.status === "fechada").reduce((s, f) => s + Number(f.total || 0), 0);
  const emAberto = abertas.reduce((s, c) => s + Number(c.total || 0), 0);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 sm:text-3xl">Mesas e comandas</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Os garçons anotam pelo celular e os pedidos chegam aqui e na cozinha. Clique na mesa para ver a conta e fechar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {dono && (
            <button onClick={() => setConfigurando(true)} className="flex h-11 items-center gap-2 rounded-xl border bg-white px-4 font-semibold">
              <Settings size={18} /> Configurar
            </button>
          )}
          <button
            disabled={indisponivel}
            onClick={() => setAbrindo(true)}
            className="flex h-11 items-center gap-2 rounded-xl px-5 font-bold text-white disabled:opacity-50"
            style={{ backgroundColor: COR }}
          >
            <Plus size={18} /> Abrir mesa
          </button>
        </div>
      </div>

      {indisponivel && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          A área Restaurante será ativada na atualização do sistema (SQL 15).
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Mesas abertas", String(abertas.length)],
          ["Pediram a conta", String(pediramConta)],
          ["Em aberto", reais(emAberto)],
          ["Recebido hoje", reais(vendidoHoje)],
        ].map(([t, v]) => (
          <div key={t} className="rounded-2xl border bg-white p-4">
            <p className="text-sm text-zinc-500">{t}</p>
            <p className="mt-1 text-2xl font-black">{v}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3 grid-cols-[repeat(auto-fill,minmax(min(100%,13rem),1fr))]">
        {carregando && [0, 1, 2].map((i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-white" />)}
        {!carregando && !abertas.length && !indisponivel && (
          <div className="col-span-full rounded-2xl bg-white p-10 text-center text-zinc-500">
            Nenhuma mesa aberta agora. Quando o garçom abrir uma mesa pelo celular, ela aparece aqui.
          </div>
        )}
        {abertas.map((c) => {
          const novo = novidades[c.id];
          return (
            <button
              key={c.id}
              onClick={() => setSelecionada(c.id)}
              className={`flex flex-col rounded-2xl border-2 bg-white p-4 text-left transition ${
                c.pediu_conta ? "border-amber-400 ring-4 ring-amber-100" : novo ? "border-green-500 ring-4 ring-green-100" : "border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-3xl font-black leading-none">Mesa {c.mesa}</p>
                <span className="text-xs font-semibold text-zinc-400">#{c.numero}</span>
              </div>
              <p className="mt-2 text-xl font-bold">{reais(c.total)}</p>
              <p className="truncate text-xs text-zinc-500">
                {c.garcom_nome || "Sem garçom"} · {minutosDesde(c.aberta_em)} min
                {c.pessoas ? ` · ${c.pessoas} pess.` : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {c.pediu_conta && <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-black text-zinc-900">🧾 PEDIU A CONTA</span>}
                {novo && <span className="rounded-full bg-green-600 px-2 py-0.5 text-[11px] font-black text-white">NOVO PEDIDO</span>}
                {!!c.itens_preparando && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-600">{c.itens_preparando} preparando</span>}
                {c.taxa_servico && <span className="rounded-full bg-[#6D1F2F]/10 px-2 py-0.5 text-[11px] font-bold text-[#6D1F2F]">10%</span>}
              </div>
            </button>
          );
        })}
      </div>

      {fechadas.length > 0 && (
        <div className="mt-8">
          <p className="font-bold text-zinc-900">Contas de hoje</p>
          <div className="mt-2 divide-y overflow-hidden rounded-2xl border bg-white">
            {fechadas.map((f) => (
              <div key={f.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
                <p className="w-20 font-black">Mesa {f.mesa}</p>
                <p className="min-w-0 flex-1 text-zinc-500">
                  {hora(f.fechada_em)} · {f.status === "cancelada" ? "Cancelada" : NOME_FORMA[f.forma_pagamento ?? ""] ?? "—"}
                  {f.garcom_nome ? ` · ${f.garcom_nome}` : ""}
                  {Number(f.taxa_valor) > 0 ? ` · 10%: ${reais(f.taxa_valor)}` : ""}
                </p>
                <p className={`font-bold ${f.status === "cancelada" ? "text-zinc-400 line-through" : ""}`}>{reais(f.total)}</p>
                <div className="flex gap-1">
                  {f.status === "fechada" && (
                    <button onClick={() => imprimir(f.id)} title="Imprimir" className="flex h-9 w-9 items-center justify-center rounded-lg border">
                      <Printer size={16} />
                    </button>
                  )}
                  <button
                    title="Reabrir"
                    onClick={async () => {
                      if (!confirm(`Reabrir a conta da mesa ${f.mesa}?`)) return;
                      const d = await postar({ id: f.id, acao: "reabrir" });
                      if (!d?.success) toast.error(d?.error || "Não foi possível reabrir.");
                      else {
                        toast.success("Conta reaberta.");
                        await carregar();
                        setSelecionada(f.id);
                      }
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link href="/admin/salao/equipe" className="font-semibold text-[#6D1F2F] underline">Cadastrar garçons, cozinha e motoboys</Link>
        {dono && <Link href="/admin/salao/relatorio" className="font-semibold text-[#6D1F2F] underline">Relatório da equipe</Link>}
      </div>

      {abrindo && <AbrirMesa onFechar={() => setAbrindo(false)} onAbrir={abrirMesa} />}
      {selecionada && (
        <ComandaPainel
          id={selecionada}
          dono={dono}
          onFechar={() => {
            setSelecionada(null);
            carregar();
          }}
          onMudou={carregar}
        />
      )}
      {configurando && <ConfigSalao onFechar={() => setConfigurando(false)} />}
    </div>
  );
}

function ComandaPainel({ id, dono, onFechar, onMudou }: { id: string; dono: boolean; onFechar: () => void; onMudou: () => void }) {
  const [dados, setDados] = useState<{ comanda: Comanda; itens: ItemComanda[] } | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [adicionando, setAdicionando] = useState(false);
  const [pagando, setPagando] = useState(false);
  const [cardapio, setCardapio] = useState<{ produtos: ProdutoSalao[]; categorias: string[] } | null>(null);

  const carregar = useCallback(async () => {
    const r = await apiFetch(`/api/salao/comanda?id=${id}`);
    const d = await r.json().catch(() => null);
    if (d?.success) setDados(d);
  }, [id]);

  useEffect(() => {
    carregar();
    const t = setInterval(() => !document.hidden && carregar(), 5000);
    return () => clearInterval(t);
  }, [carregar]);

  async function acao(corpo: Record<string, unknown>, sucesso?: string) {
    setSalvando(true);
    try {
      const d = await postar({ id, ...corpo });
      if (!d?.success) {
        toast.error(d?.error || "Não foi possível salvar.");
        return null;
      }
      if (sucesso) toast.success(sucesso);
      await carregar();
      onMudou();
      return d;
    } finally {
      setSalvando(false);
    }
  }

  async function abrirCardapio() {
    if (!cardapio) {
      const r = await apiFetch("/api/salao/cardapio");
      const d = await r.json().catch(() => null);
      if (!d?.success) return toast.error(d?.error || "Não foi possível carregar o cardápio.");
      setCardapio({ produtos: d.produtos, categorias: d.categorias });
    }
    setAdicionando(true);
  }

  const c = dados?.comanda;
  const aberta = c?.status === "aberta";

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/40" onClick={onFechar}>
      <div onClick={(e) => e.stopPropagation()} className="relative flex h-full w-full flex-col bg-[#f7f8fc] sm:max-w-xl">
        {!dados || !c ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="animate-spin text-zinc-400" />
          </div>
        ) : (
          <>
            <div className="flex shrink-0 items-start justify-between gap-3 border-b bg-white px-4 py-3">
              <div className="min-w-0">
                <p className="text-2xl font-black leading-tight">Mesa {c.mesa}</p>
                <p className="text-xs text-zinc-500">
                  Comanda {c.numero} · aberta às {hora(c.aberta_em)} · {c.garcom_nome || "sem garçom"}
                  {c.status !== "aberta" ? ` · ${c.status === "fechada" ? "FECHADA" : "CANCELADA"}` : ""}
                </p>
              </div>
              <button onClick={onFechar} aria-label="Fechar" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100">
                <X size={20} />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              {aberta && (
                <div className="flex flex-wrap gap-2">
                  <button onClick={abrirCardapio} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl font-bold text-white" style={{ backgroundColor: COR }}>
                    <Plus size={18} /> Adicionar itens
                  </button>
                  <button
                    disabled={salvando}
                    onClick={async () => {
                      const mesa = prompt("Trocar para qual mesa?", c.mesa);
                      if (mesa && mesa.trim() !== c.mesa) await acao({ acao: "ajustar", mesa: mesa.trim() }, `Agora é a mesa ${mesa.trim()}.`);
                    }}
                    className="h-11 rounded-xl border bg-white px-3 text-sm font-semibold"
                  >
                    Trocar mesa
                  </button>
                  <button
                    disabled={salvando}
                    onClick={async () => {
                      const p = prompt("Quantas pessoas na mesa?", String(c.pessoas ?? ""));
                      if (p !== null) await acao({ acao: "ajustar", pessoas: Number(p) || null });
                    }}
                    className="flex h-11 items-center gap-1 rounded-xl border bg-white px-3 text-sm font-semibold"
                  >
                    <Users size={16} /> {c.pessoas ?? "–"}
                  </button>
                </div>
              )}

              {c.pediu_conta && aberta && (
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-amber-100 p-3 text-sm font-bold text-amber-900">
                  🧾 O garçom avisou que a mesa pediu a conta.
                  <button onClick={() => acao({ acao: "ajustar", pediuConta: false })} className="text-xs underline">Tirar aviso</button>
                </div>
              )}

              {porLancamento(dados.itens).map((g, n) => (
                <section key={g.lancamento} className="overflow-hidden rounded-2xl border bg-white">
                  <div className="flex items-center justify-between bg-zinc-50 px-4 py-2">
                    <p className="text-xs font-bold text-zinc-500">
                      Pedido {n + 1} · {hora(g.criado_em)} · {g.origem === "qr" ? "QR da mesa" : g.por}
                    </p>
                    <button onClick={() => imprimir(c.id, g.lancamento)} title="Imprimir para a cozinha" className="flex items-center gap-1 text-xs font-semibold text-zinc-500">
                      <ChefHat size={14} /> Imprimir
                    </button>
                  </div>
                  <div className="divide-y">
                    {g.itens.map((i) => {
                      const cancelado = i.status === "cancelado";
                      return (
                        <div key={i.id} className="flex items-start gap-3 px-4 py-3">
                          <div className="min-w-0 flex-1">
                            <p className={`font-semibold ${cancelado ? "text-zinc-400 line-through" : ""}`}>
                              {i.quantidade}x {i.nome}
                            </p>
                            {i.detalhes?.map((d) => (
                              <p key={d} className="text-sm text-zinc-500">{d}</p>
                            ))}
                            {i.observacao && <p className="text-sm font-semibold text-amber-700">Obs.: {i.observacao}</p>}
                            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${rotuloItem(i).classe}`}>
                              {rotuloItem(i).texto}
                              {i.setor && i.status === "novo" ? ` · ${i.setor}` : ""}
                              {cancelado && i.cancelado_por ? ` por ${i.cancelado_por}` : ""}
                            </span>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <p className={`text-sm font-bold ${cancelado ? "text-zinc-400 line-through" : ""}`}>{reais(Number(i.preco_unit) * i.quantidade)}</p>
                            {aberta && !cancelado && (
                              <div className="flex items-center gap-1">
                                <button
                                  disabled={salvando || i.quantidade <= 1}
                                  onClick={() => acao({ acao: "item", itemId: i.id, quantidade: i.quantidade - 1 })}
                                  aria-label="Menos"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border disabled:opacity-30"
                                >
                                  <Minus size={14} />
                                </button>
                                <button
                                  disabled={salvando}
                                  onClick={() => acao({ acao: "item", itemId: i.id, quantidade: i.quantidade + 1 })}
                                  aria-label="Mais"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border"
                                >
                                  <Plus size={14} />
                                </button>
                                <button
                                  disabled={salvando}
                                  onClick={() => confirm(`Cancelar ${i.quantidade}x ${i.nome}?`) && acao({ acao: "item", itemId: i.id, cancelar: true }, "Item cancelado.")}
                                  aria-label="Cancelar item"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
              {!dados.itens.length && <div className="rounded-2xl bg-white p-8 text-center text-zinc-500">Nada lançado ainda.</div>}

              {aberta && (
                <button
                  onClick={() => confirm(`Cancelar a mesa ${c.mesa}? Ela não entra no relatório.`) && acao({ acao: "cancelar" }, "Mesa cancelada.").then((d) => d && onFechar())}
                  className="w-full py-2 text-sm font-semibold text-red-600"
                >
                  Cancelar mesa (aberta por engano)
                </button>
              )}
            </div>

            {/* Totais e fechar */}
            <div className="shrink-0 space-y-2 border-t bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="flex justify-between text-sm"><span>Consumo</span><span className="font-semibold">{reais(c.subtotal)}</span></div>
              {aberta ? (
                <button
                  disabled={salvando}
                  onClick={() => acao({ acao: "ajustar", taxaServico: !c.taxa_servico })}
                  className={`flex h-12 w-full items-center justify-between rounded-xl border-2 px-4 font-bold ${c.taxa_servico ? "border-[#6D1F2F] bg-[#6D1F2F]/5 text-[#6D1F2F]" : "border-dashed border-zinc-300 text-zinc-600"}`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`flex h-5 w-5 items-center justify-center rounded ${c.taxa_servico ? "bg-[#6D1F2F] text-white" : "border-2 border-zinc-300"}`}>
                      {c.taxa_servico && <Check size={14} />}
                    </span>
                    Taxa de serviço ({String(c.taxa_percentual).replace(".", ",")}%)
                  </span>
                  <span>{c.taxa_servico ? `+ ${reais(c.taxa_valor)}` : reais((Number(c.subtotal) * Number(c.taxa_percentual)) / 100)}</span>
                </button>
              ) : (
                c.taxa_servico && <div className="flex justify-between text-sm"><span>Serviço ({c.taxa_percentual}%)</span><span>{reais(c.taxa_valor)}</span></div>
              )}
              {Number(c.desconto) > 0 && <div className="flex justify-between text-sm text-green-700"><span>Desconto</span><span>- {reais(c.desconto)}</span></div>}
              {Number(c.pago_antecipado) > 0 && (
                <div className="flex justify-between text-sm text-green-700"><span>Já pago pelo QR</span><span>- {reais(c.pago_antecipado)}</span></div>
              )}
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-lg font-black">Total a cobrar</span>
                <span className="text-3xl font-black">{reais(Number(c.total) - Number(c.pago_antecipado || 0))}</span>
              </div>
              {c.status === "fechada" && (
                <p className="text-sm text-zinc-500">
                  Paga às {c.fechada_em ? hora(c.fechada_em) : ""}:{" "}
                  {(c.pagamentos || []).map((p) => `${NOME_FORMA[p.forma] ?? p.forma} ${reais(p.valor)}`).join(" + ") || NOME_FORMA[c.forma_pagamento ?? ""]}
                  {Number(c.troco) > 0 ? ` · troco ${reais(c.troco)}` : ""}
                </p>
              )}
              <div className="grid grid-cols-[auto_1fr] gap-2 pt-1">
                <button onClick={() => imprimir(c.id)} className="flex h-14 items-center gap-2 rounded-xl bg-zinc-900 px-4 font-semibold text-white">
                  <Printer size={18} /> {aberta ? "Imprimir conta" : "Imprimir"}
                </button>
                {aberta ? (
                  <button onClick={() => setPagando(true)} className="flex h-14 items-center justify-center gap-2 rounded-xl bg-green-600 text-lg font-black text-white">
                    <Receipt size={20} /> Fechar conta
                  </button>
                ) : (
                  <button onClick={onFechar} className="h-14 rounded-xl border font-bold">Pronto</button>
                )}
              </div>
              {aberta && dono && (
                <button
                  onClick={async () => {
                    const v = prompt("Desconto em reais (0 para tirar):", String(c.desconto || ""));
                    if (v !== null) await acao({ acao: "ajustar", desconto: Number(v.replace(",", ".")) || 0 });
                  }}
                  className="w-full text-center text-xs font-semibold text-zinc-500 underline"
                >
                  Dar desconto
                </button>
              )}
            </div>

            {adicionando && cardapio && (
              <div className="absolute inset-0 z-10">
                <CardapioSalao
                  produtos={cardapio.produtos}
                  categorias={cardapio.categorias}
                  titulo={`Adicionar · Mesa ${c.mesa}`}
                  onVoltar={() => setAdicionando(false)}
                  onEnviar={async (itens: ItemEnviado[]) => {
                    const d = await acao({ acao: "lancar", itens }, "Itens lançados.");
                    if (d) setAdicionando(false);
                    return Boolean(d);
                  }}
                />
              </div>
            )}

            {pagando && (
              <PagarConta
                comanda={c}
                onFechar={() => setPagando(false)}
                onPago={async () => {
                  setPagando(false);
                  await carregar();
                  onMudou();
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

type LinhaPagamento = { forma: string; valor: string };

function PagarConta({ comanda, onFechar, onPago }: { comanda: Comanda; onFechar: () => void; onPago: () => void }) {
  const total = Math.round((Number(comanda.total) - Number(comanda.pago_antecipado || 0)) * 100) / 100;
  const [linhas, setLinhas] = useState<LinhaPagamento[]>([]);
  const [dividir, setDividir] = useState(false);
  const [recebido, setRecebido] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [pago, setPago] = useState(false);

  const num = (v: string) => Math.round(Number(String(v).replace(",", ".")) * 100) / 100 || 0;
  const somado = Math.round(linhas.reduce((s, l) => s + num(l.valor), 0) * 100) / 100;
  const falta = Math.round((total - somado) * 100) / 100;
  const emDinheiro = linhas.filter((l) => l.forma === "dinheiro").reduce((s, l) => s + num(l.valor), 0);
  const troco = emDinheiro > 0 && num(recebido) > emDinheiro ? num(recebido) - emDinheiro : 0;
  const pronto = total <= 0 || (linhas.length > 0 && Math.abs(falta) < 0.01);

  function escolher(forma: string) {
    if (!dividir) return setLinhas([{ forma, valor: total.toFixed(2) }]);
    setLinhas((l) => [...l, { forma, valor: Math.max(0, falta).toFixed(2) }]);
  }

  async function finalizar() {
    setEnviando(true);
    try {
      const d = await postar({
        id: comanda.id,
        acao: "fechar",
        taxaServico: comanda.taxa_servico,
        pagamentos: linhas.map((l) => ({ forma: l.forma, valor: num(l.valor) })),
        recebidoDinheiro: num(recebido),
      });
      if (!d?.success) {
        toast.error(d?.error || "Não foi possível fechar.");
        return;
      }
      toast.success(`Mesa ${comanda.mesa} fechada ✓`);
      setPago(true);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="absolute inset-0 z-20 flex items-end bg-black/50 sm:items-center sm:justify-center sm:p-6" onClick={() => !enviando && !pago && onFechar()}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[94%] w-full overflow-y-auto rounded-t-3xl bg-white p-5 sm:max-w-md sm:rounded-3xl">
        {pago ? (
          <div className="py-4 text-center">
            <p className="text-5xl">✅</p>
            <p className="mt-3 text-2xl font-black">Conta fechada</p>
            <p className="text-zinc-500">Mesa {comanda.mesa} · {reais(total)}</p>
            {troco > 0 && <p className="mt-3 rounded-xl bg-green-50 p-3 text-xl font-black text-green-800">Troco: {reais(troco)}</p>}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button onClick={() => imprimir(comanda.id)} className="flex h-12 items-center justify-center gap-2 rounded-xl border font-semibold">
                <Printer size={18} /> Comprovante
              </button>
              <button onClick={onPago} className="h-12 rounded-xl bg-zinc-900 font-bold text-white">Concluir</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-zinc-500">Mesa {comanda.mesa} · total a cobrar</p>
                <p className="text-4xl font-black">{reais(total)}</p>
                {comanda.taxa_servico && <p className="text-xs text-zinc-500">inclui {reais(comanda.taxa_valor)} de serviço ({comanda.taxa_percentual}%)</p>}
              </div>
              <button onClick={onFechar} aria-label="Fechar" className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100">
                <X size={18} />
              </button>
            </div>

            {total > 0 && (
              <>
                <p className="mt-5 font-bold">Como vai pagar?</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {FORMAS.map((f) => {
                    const marcado = !dividir && linhas[0]?.forma === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => escolher(f.id)}
                        className={`flex h-16 items-center justify-center gap-2 rounded-2xl border-2 text-lg font-black ${marcado ? "border-green-600 bg-green-50 text-green-800" : "border-zinc-200"}`}
                      >
                        <span>{f.emoji}</span> {f.nome}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => {
                    setDividir((d) => !d);
                    setLinhas([]);
                  }}
                  className="mt-3 text-sm font-semibold text-[#6D1F2F] underline"
                >
                  {dividir ? "Pagar tudo numa forma só" : "Dividir em mais de uma forma"}
                </button>

                {dividir && (
                  <div className="mt-3 space-y-2">
                    {linhas.map((l, n) => (
                      <div key={n} className="flex items-center gap-2">
                        <span className="w-24 font-semibold">{NOME_FORMA[l.forma]}</span>
                        <input
                          value={l.valor}
                          onChange={(e) => setLinhas((ls) => ls.map((x, k) => (k === n ? { ...x, valor: e.target.value } : x)))}
                          inputMode="decimal"
                          className="h-11 min-w-0 flex-1 rounded-xl border px-3 text-right text-base font-bold"
                        />
                        <button onClick={() => setLinhas((ls) => ls.filter((_, k) => k !== n))} aria-label="Tirar" className="flex h-11 w-11 items-center justify-center rounded-xl border text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <p className={`text-sm font-bold ${Math.abs(falta) < 0.01 ? "text-green-700" : "text-amber-700"}`}>
                      {Math.abs(falta) < 0.01 ? "✓ Valor completo" : falta > 0 ? `Falta ${reais(falta)} — toque numa forma acima` : `Passou ${reais(-falta)}`}
                    </p>
                  </div>
                )}

                {emDinheiro > 0 && (
                  <label className="mt-4 block rounded-2xl bg-zinc-50 p-3">
                    <span className="text-sm font-semibold">Recebeu quanto em dinheiro? (para o troco)</span>
                    <input
                      value={recebido}
                      onChange={(e) => setRecebido(e.target.value)}
                      inputMode="decimal"
                      placeholder={emDinheiro.toFixed(2).replace(".", ",")}
                      className="mt-1 h-12 w-full rounded-xl border bg-white px-3 text-lg font-bold"
                    />
                    {troco > 0 && <span className="mt-2 block text-xl font-black text-green-700">Troco: {reais(troco)}</span>}
                  </label>
                )}
              </>
            )}

            {total <= 0 && <p className="mt-4 rounded-xl bg-green-50 p-3 font-semibold text-green-800">Esta conta já está paga (pelo QR da mesa).</p>}

            <button
              disabled={!pronto || enviando}
              onClick={finalizar}
              className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-green-600 text-lg font-black text-white disabled:opacity-50"
            >
              {enviando ? <Loader2 className="animate-spin" /> : <Check />} Finalizar e fechar mesa
            </button>
          </>
        )}
      </div>
    </div>
  );
}

type Categoria = { id: string; nome: string; setor: string; configurado: boolean };

function ConfigSalao({ onFechar }: { onFechar: () => void }) {
  const [setores, setSetores] = useState<string[]>([]);
  const [novoSetor, setNovoSetor] = useState("");
  const [percentual, setPercentual] = useState("10");
  const [padrao, setPadrao] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    apiFetch("/api/salao/config")
      .then((r) => r.json())
      .then((d) => {
        if (!d?.success) return toast.error(d?.error || "Não foi possível carregar.");
        setSetores(d.config.setores);
        setPercentual(String(d.config.taxa_percentual).replace(".", ","));
        setPadrao(d.config.taxa_ligada_padrao);
        setCategorias(d.categorias);
      })
      .finally(() => setCarregando(false));
  }, []);

  async function salvar() {
    setSalvando(true);
    try {
      const r = await apiFetch("/api/salao/config", {
        method: "PUT",
        body: JSON.stringify({
          setores,
          taxa_percentual: Number(percentual.replace(",", ".")),
          taxa_ligada_padrao: padrao,
          categorias: Object.fromEntries(categorias.map((c) => [c.id, c.setor])),
        }),
      });
      const d = await r.json().catch(() => null);
      if (!d?.success) return toast.error(d?.error || "Não foi possível salvar.");
      toast.success("Configuração salva.");
      onFechar();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 sm:items-center sm:p-6" onClick={onFechar}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 sm:max-w-lg sm:rounded-3xl">
        <div className="flex items-start justify-between">
          <p className="text-xl font-black">Configurar o salão</p>
          <button onClick={onFechar} aria-label="Fechar" className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100">
            <X size={18} />
          </button>
        </div>

        {carregando ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-zinc-400" /></div>
        ) : (
          <>
            <p className="mt-4 font-bold">Taxa de serviço</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input value={percentual} onChange={(e) => setPercentual(e.target.value)} inputMode="decimal" className="h-11 w-20 rounded-xl border px-3 text-center text-base font-bold" />%
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={padrao} onChange={(e) => setPadrao(e.target.checked)} className="h-5 w-5" />
                Já vir ligada em toda mesa nova
              </label>
            </div>
            <p className="mt-1 text-xs text-zinc-500">No fechamento o caixa liga ou desliga com um toque.</p>

            <p className="mt-5 font-bold">Setores de preparo</p>
            <p className="text-xs text-zinc-500">Cada setor tem a sua tela (ex.: a churrasqueira só vê os espetos).</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {setores.map((s) => (
                <span key={s} className="flex items-center gap-1 rounded-full bg-zinc-100 py-1 pl-3 pr-1 text-sm font-semibold">
                  {s}
                  <button onClick={() => setSetores((l) => l.filter((x) => x !== s))} aria-label={`Tirar ${s}`} className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-zinc-200">
                    <X size={12} />
                  </button>
                </span>
              ))}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const s = novoSetor.trim();
                  if (s && !setores.includes(s) && setores.length < 8) setSetores((l) => [...l, s]);
                  setNovoSetor("");
                }}
                className="flex"
              >
                <input value={novoSetor} onChange={(e) => setNovoSetor(e.target.value.slice(0, 24))} placeholder="+ novo setor" className="h-8 w-32 rounded-full border px-3 text-sm" />
              </form>
            </div>

            <p className="mt-5 font-bold">Onde cada categoria é preparada</p>
            <div className="mt-2 divide-y rounded-2xl border">
              {categorias.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 px-3 py-2">
                  <span className="min-w-0 truncate font-semibold">{c.nome}</span>
                  <select
                    value={setores.includes(c.setor) || c.setor === "nenhum" ? c.setor : setores[0]}
                    onChange={(e) => setCategorias((l) => l.map((x) => (x.id === c.id ? { ...x, setor: e.target.value } : x)))}
                    className="h-10 rounded-xl border bg-white px-2 text-sm"
                  >
                    {setores.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    <option value="nenhum">Sem preparo (sai pronto)</option>
                  </select>
                </div>
              ))}
              {!categorias.length && <p className="p-4 text-sm text-zinc-500">Cadastre categorias no cardápio primeiro.</p>}
            </div>
            <p className="mt-1 text-xs text-zinc-500">“Sem preparo”: bebida da geladeira, por exemplo — não vai para a cozinha.</p>

            <button
              disabled={salvando || !setores.length}
              onClick={salvar}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl font-bold text-white disabled:opacity-50"
              style={{ backgroundColor: COR }}
            >
              {salvando && <Loader2 className="animate-spin" size={18} />} Salvar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
