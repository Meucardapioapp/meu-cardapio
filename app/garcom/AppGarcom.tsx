"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Bell, Check, ChevronRight, Loader2, LogOut, Minus, Plus, Receipt, Trash2 } from "lucide-react";
import EntrarEquipe, { sairEquipe } from "@/app/components/equipe/EntrarEquipe";
import AbrirMesa from "@/app/components/salao/AbrirMesa";
import CardapioSalao, { type ItemEnviado, type ProdutoSalao } from "@/app/components/salao/CardapioSalao";
import { rotuloItem, hora, minutosDesde, porLancamento, reais, type Comanda, type ItemComanda } from "@/app/components/salao/comum";
import { liberarSom, somLiberado, tocarAlerta } from "@/lib/alerta-sonoro";

const COR = "#6D1F2F";

type Pronto = { id: string; comanda_id: string; nome: string; quantidade: number; setor: string | null; mesa: string; meu: boolean };
type Dados = {
  eu: { id: string; nome: string; restaurante: string };
  abertas: Comanda[];
  prontos: Pronto[];
  resumo: { mesas: number; comDez: number; dez: number; vendido: number; pedidos: number };
};

async function api(url: string, corpo?: unknown) {
  const r = await fetch(url, corpo ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) } : { cache: "no-store" });
  const d = await r.json().catch(() => null);
  if (r.status === 401) throw new Error("SAIR");
  return d;
}

function inicioDoDia() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/** App do garçom: mesas abertas, anotar pedido, acompanhar o que ficou pronto. */
export default function AppGarcom() {
  const [estado, setEstado] = useState<"carregando" | "entrar" | "app">("carregando");
  const [dados, setDados] = useState<Dados | null>(null);
  const [comandaId, setComandaId] = useState<string | null>(null);
  const [anotando, setAnotando] = useState(false);
  const [abrindo, setAbrindo] = useState(false);
  const [cardapio, setCardapio] = useState<{ produtos: ProdutoSalao[]; categorias: string[]; taxa: number } | null>(null);
  const [som, setSom] = useState(true);
  const prontosVistos = useRef<Set<string> | null>(null);

  const carregar = useCallback(async () => {
    try {
      const d = await api(`/api/salao/mesas?desde=${encodeURIComponent(inicioDoDia())}`);
      if (!d?.success) return;
      // Item pronto novo para mim: avisa.
      const meus = new Set<string>((d.prontos as Pronto[]).filter((p) => p.meu).map((p) => p.id));
      if (prontosVistos.current && [...meus].some((id) => !prontosVistos.current!.has(id))) {
        tocarAlerta("pronto");
        toast.success("Tem pedido pronto para levar!");
      }
      prontosVistos.current = meus;
      setDados(d);
      setEstado("app");
    } catch (e) {
      if ((e as Error).message === "SAIR") setEstado("entrar");
    }
  }, []);

  const carregarCardapio = useCallback(async () => {
    try {
      const d = await api("/api/salao/cardapio");
      if (d?.success) setCardapio({ produtos: d.produtos, categorias: d.categorias, taxa: d.config?.taxa_percentual ?? 10 });
    } catch {}
  }, []);

  useEffect(() => {
    carregar();
    setSom(somLiberado());
    const t = setInterval(() => !document.hidden && carregar(), 6000);
    const voltar = () => !document.hidden && carregar();
    document.addEventListener("visibilitychange", voltar);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", voltar);
    };
  }, [carregar]);

  useEffect(() => {
    if (estado === "app" && !cardapio) carregarCardapio();
  }, [estado, cardapio, carregarCardapio]);

  async function abrirMesa(mesa: string, pessoas: number | null) {
    const d = await api("/api/salao/mesas", { mesa, pessoas });
    if (!d?.success) {
      toast.error(d?.error || "Não foi possível abrir a mesa.");
      return false;
    }
    if (!d.nova) toast.info(`A mesa ${d.comanda.mesa} já estava aberta.`);
    setAbrindo(false);
    setComandaId(d.comanda.id);
    setAnotando(true);
    carregar();
    return true;
  }

  async function marcarServido(p: Pronto) {
    const d = await api("/api/salao/comanda", { id: p.comanda_id, acao: "item", itemId: p.id, entregue: true });
    if (!d?.success) toast.error(d?.error || "Não foi possível marcar.");
    carregar();
  }

  if (estado === "carregando") {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-zinc-50">
        <Loader2 className="animate-spin text-zinc-400" size={32} />
      </div>
    );
  }
  if (estado === "entrar") return <EntrarEquipe titulo="Garçom" emoji="🧑‍🍳" paginaAtual="/garcom" onEntrou={carregar} />;

  const comanda = dados?.abertas.find((c) => c.id === comandaId) ?? null;

  if (comandaId && anotando && cardapio) {
    return (
      <div className="fixed inset-0"><div className="relative h-full">
        <CardapioSalao
          produtos={cardapio.produtos}
          categorias={cardapio.categorias}
          titulo={`Mesa ${comanda?.mesa ?? ""}`}
          onVoltar={() => setAnotando(false)}
          onEnviar={async (itens: ItemEnviado[]) => {
            const d = await api("/api/salao/comanda", { id: comandaId, acao: "lancar", itens });
            if (!d?.success) {
              toast.error(d?.error || "Não foi possível enviar.");
              return false;
            }
            toast.success("Pedido enviado para a cozinha ✓");
            setAnotando(false);
            carregar();
            return true;
          }}
        />
      </div></div>
    );
  }

  if (comandaId) {
    return (
      <TelaComanda
        id={comandaId}
        taxa={cardapio?.taxa ?? 10}
        onVoltar={() => {
          setComandaId(null);
          carregar();
        }}
        onAnotar={() => setAnotando(true)}
      />
    );
  }

  const prontos = dados?.prontos ?? [];
  const r = dados?.resumo;

  return (
    <div className="min-h-dvh bg-zinc-100 pb-28">
      <header className="sticky top-0 z-20 border-b bg-white">
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between gap-3 px-4">
          <div className="min-w-0">
            <p className="truncate text-lg font-black leading-tight">Olá, {dados?.eu.nome.split(" ")[0]} 👋</p>
            <p className="truncate text-xs text-zinc-500">{dados?.eu.restaurante}</p>
          </div>
          <button onClick={sairEquipe} className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold">
            <LogOut size={16} /> Sair
          </button>
        </div>
        {r && (
          <div className="mx-auto grid max-w-xl grid-cols-4 gap-2 px-4 pb-3 text-center">
            {[
              ["Mesas", String(r.mesas)],
              ["Pedidos", String(r.pedidos)],
              ["Com 10%", String(r.comDez)],
              ["Seus 10%", reais(r.dez)],
            ].map(([t, v]) => (
              <div key={t} className="rounded-xl bg-zinc-50 py-1.5">
                <p className="text-sm font-black leading-tight">{v}</p>
                <p className="text-[11px] text-zinc-500">{t}</p>
              </div>
            ))}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-xl space-y-3 px-4 pt-4">
        {!som && (
          <button
            onClick={() => {
              liberarSom();
              tocarAlerta("pronto");
              setSom(true);
            }}
            className="flex w-full items-center gap-3 rounded-2xl border border-amber-300 bg-amber-100 p-4 text-left"
          >
            <Bell className="shrink-0 text-amber-700" />
            <span className="text-sm font-semibold text-amber-900">Toque aqui para ligar o som quando um pedido ficar pronto.</span>
          </button>
        )}

        {prontos.length > 0 && (
          <section className="rounded-2xl border-2 border-green-400 bg-green-50 p-3">
            <p className="px-1 font-black text-green-900">✅ Pronto para levar ({prontos.length})</p>
            <div className="mt-2 space-y-2">
              {prontos.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-xl bg-white p-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-black">Mesa {p.mesa}</p>
                    <p className="truncate text-sm">
                      {p.quantidade}x {p.nome}
                      {p.setor ? <span className="text-zinc-400"> · {p.setor}</span> : null}
                    </p>
                  </div>
                  <button onClick={() => marcarServido(p)} className="flex h-11 shrink-0 items-center gap-1 rounded-xl bg-green-600 px-3 text-sm font-bold text-white">
                    <Check size={16} /> Servido
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex items-baseline justify-between px-1 pt-1">
          <p className="font-black">Mesas abertas ({dados?.abertas.length ?? 0})</p>
        </div>
        {dados?.abertas.length === 0 && (
          <div className="rounded-2xl bg-white p-8 text-center text-zinc-500">Nenhuma mesa aberta. Toque em “Abrir mesa”.</div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {dados?.abertas.map((c) => {
            const minha = c.garcom_id === dados.eu.id;
            return (
              <button
                key={c.id}
                onClick={() => setComandaId(c.id)}
                className={`rounded-2xl border-2 bg-white p-3 text-left ${c.pediu_conta ? "border-amber-400" : minha ? "border-[#6D1F2F]/40" : "border-transparent"}`}
              >
                <p className="text-2xl font-black leading-none">Mesa {c.mesa}</p>
                <p className="mt-1 text-lg font-bold">{reais(c.total)}</p>
                <p className="truncate text-xs text-zinc-500">
                  {c.garcom_nome ? (minha ? "Sua mesa" : c.garcom_nome) : "Sem garçom"} · {minutosDesde(c.aberta_em)} min
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {c.pediu_conta && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">Pediu a conta</span>}
                  {!!c.itens_preparando && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-600">{c.itens_preparando} preparando</span>}
                  {!!c.itens_prontos && <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-800">{c.itens_prontos} pronto</span>}
                </div>
              </button>
            );
          })}
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          onClick={() => setAbrindo(true)}
          className="mx-auto flex h-14 w-full max-w-xl items-center justify-center gap-2 rounded-xl text-lg font-black text-white"
          style={{ backgroundColor: COR }}
        >
          <Plus /> Abrir mesa
        </button>
      </div>

      {abrindo && <AbrirMesa onFechar={() => setAbrindo(false)} onAbrir={abrirMesa} />}
    </div>
  );
}

function TelaComanda({ id, taxa, onVoltar, onAnotar }: { id: string; taxa: number; onVoltar: () => void; onAnotar: () => void }) {
  const [dados, setDados] = useState<{ comanda: Comanda; itens: ItemComanda[] } | null>(null);
  const [item, setItem] = useState<ItemComanda | null>(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const d = await api(`/api/salao/comanda?id=${id}`);
      if (d?.success) setDados(d);
      else if (d?.error) {
        toast.error(d.error);
        onVoltar();
      }
    } catch {}
  }, [id, onVoltar]);

  useEffect(() => {
    carregar();
    const t = setInterval(() => !document.hidden && carregar(), 6000);
    return () => clearInterval(t);
  }, [carregar]);

  async function acao(corpo: Record<string, unknown>, sucesso?: string) {
    setSalvando(true);
    try {
      const d = await api("/api/salao/comanda", { id, ...corpo });
      if (!d?.success) {
        toast.error(d?.error || "Não foi possível salvar.");
        return false;
      }
      if (sucesso) toast.success(sucesso);
      await carregar();
      return true;
    } finally {
      setSalvando(false);
    }
  }

  if (!dados) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-zinc-50">
        <Loader2 className="animate-spin text-zinc-400" size={32} />
      </div>
    );
  }

  const c = dados.comanda;
  const fechada = c.status !== "aberta";
  const grupos = porLancamento(dados.itens);
  const dez = Math.round(Number(c.subtotal) * taxa) / 100;

  return (
    <div className="min-h-dvh bg-zinc-100 pb-40">
      <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-white px-3">
        <button onClick={onVoltar} aria-label="Voltar" className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-black leading-tight">Mesa {c.mesa}</p>
          <p className="text-xs text-zinc-500">
            Comanda {c.numero} · aberta às {hora(c.aberta_em)}
            {c.pessoas ? ` · ${c.pessoas} pessoas` : ""}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-xl space-y-3 p-3">
        {fechada && <div className="rounded-2xl bg-zinc-800 p-4 font-bold text-white">Esta conta já foi fechada no caixa.</div>}
        {grupos.length === 0 && <div className="rounded-2xl bg-white p-8 text-center text-zinc-500">Nada anotado ainda.</div>}
        {grupos.map((g, n) => (
          <section key={g.lancamento} className="overflow-hidden rounded-2xl border bg-white">
            <p className="bg-zinc-50 px-4 py-2 text-xs font-bold text-zinc-500">
              Pedido {n + 1} · {hora(g.criado_em)} · {g.origem === "qr" ? "pelo QR da mesa" : g.por}
            </p>
            <div className="divide-y">
              {g.itens.map((i) => (
                <button
                  key={i.id}
                  disabled={fechada || i.status === "cancelado" || i.status === "entregue"}
                  onClick={() => setItem(i)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left disabled:opacity-100"
                >
                  <span className={`text-lg font-black ${i.status === "cancelado" ? "text-zinc-400 line-through" : ""}`}>{i.quantidade}x</span>
                  <span className="min-w-0 flex-1">
                    <span className={`block font-semibold ${i.status === "cancelado" ? "text-zinc-400 line-through" : ""}`}>{i.nome}</span>
                    {i.detalhes?.map((d) => (
                      <span key={d} className="block text-sm text-zinc-500">{d}</span>
                    ))}
                    {i.observacao && <span className="block text-sm font-semibold text-amber-700">Obs.: {i.observacao}</span>}
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${rotuloItem(i).classe}`}>
                      {rotuloItem(i).texto}
                      {i.setor && i.status === "novo" ? ` · ${i.setor}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-bold">{reais(Number(i.preco_unit) * i.quantidade)}</span>
                </button>
              ))}
            </div>
          </section>
        ))}

        <div className="space-y-1 rounded-2xl border bg-white p-4 text-sm">
          <div className="flex justify-between"><span>Consumo</span><span className="font-bold">{reais(c.subtotal)}</span></div>
          <div className="flex justify-between text-zinc-500">
            <span>{c.taxa_servico ? `Serviço (${c.taxa_percentual}%)` : `Com ${taxa}% de serviço ficaria`}</span>
            <span>{c.taxa_servico ? reais(c.taxa_valor) : reais(Number(c.subtotal) + dez)}</span>
          </div>
          {Number(c.pago_antecipado) > 0 && (
            <div className="flex justify-between text-green-700"><span>Já pago pelo QR</span><span>- {reais(c.pago_antecipado)}</span></div>
          )}
          <div className="flex justify-between pt-1 text-lg font-black"><span>Total</span><span>{reais(c.total)}</span></div>
        </div>
      </main>

      {!fechada && (
        <div className="fixed inset-x-0 bottom-0 border-t bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto grid max-w-xl grid-cols-[auto_1fr] gap-2">
            <button
              disabled={salvando}
              onClick={() => acao({ acao: "ajustar", pediuConta: !c.pediu_conta }, c.pediu_conta ? "Pedido de conta cancelado." : "O caixa foi avisado: a mesa pediu a conta.")}
              className={`flex h-14 items-center gap-1.5 rounded-xl border-2 px-4 font-bold ${c.pediu_conta ? "border-amber-400 bg-amber-50 text-amber-800" : ""}`}
            >
              <Receipt size={18} /> {c.pediu_conta ? "Conta pedida" : "Pedir conta"}
            </button>
            <button onClick={onAnotar} className="flex h-14 items-center justify-center gap-2 rounded-xl text-lg font-black text-white" style={{ backgroundColor: COR }}>
              <Plus /> Anotar pedido
            </button>
          </div>
        </div>
      )}

      {item && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={() => setItem(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <p className="text-lg font-black">{item.quantidade}x {item.nome}</p>
            <p className="text-sm text-zinc-500">{rotuloItem(item).texto}</p>
            {item.status === "pronto" && item.setor ? (
              <button
                disabled={salvando}
                onClick={async () => (await acao({ acao: "item", itemId: item.id, entregue: true }, "Marcado como servido.")) && setItem(null)}
                className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-green-600 text-lg font-black text-white"
              >
                <Check /> Servido na mesa
              </button>
            ) : item.status === "novo" || (item.status === "pronto" && !item.setor) ? (
              <>
                <div className="mt-4 flex items-center justify-between rounded-2xl bg-zinc-50 p-2">
                  <span className="pl-2 font-semibold">Quantidade</span>
                  <div className="flex items-center">
                    <button
                      disabled={salvando || item.quantidade <= 1}
                      onClick={async () => (await acao({ acao: "item", itemId: item.id, quantidade: item.quantidade - 1 })) && setItem({ ...item, quantidade: item.quantidade - 1 })}
                      aria-label="Menos"
                      className="flex h-12 w-12 items-center justify-center rounded-xl bg-white disabled:opacity-40"
                    >
                      <Minus />
                    </button>
                    <span className="w-10 text-center text-xl font-black">{item.quantidade}</span>
                    <button
                      disabled={salvando}
                      onClick={async () => (await acao({ acao: "item", itemId: item.id, quantidade: item.quantidade + 1 })) && setItem({ ...item, quantidade: item.quantidade + 1 })}
                      aria-label="Mais"
                      className="flex h-12 w-12 items-center justify-center rounded-xl bg-white"
                    >
                      <Plus />
                    </button>
                  </div>
                </div>
                <button
                  disabled={salvando}
                  onClick={async () => {
                    if (!confirm(`Cancelar ${item.quantidade}x ${item.nome}?`)) return;
                    if (await acao({ acao: "item", itemId: item.id, cancelar: true }, "Item cancelado. A cozinha foi avisada.")) setItem(null);
                  }}
                  className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-red-200 font-bold text-red-600"
                >
                  <Trash2 size={18} /> Cancelar item
                </button>
                <p className="mt-3 text-center text-xs text-zinc-500">Dá para alterar enquanto a cozinha não preparou.</p>
              </>
            ) : null}
            <button onClick={() => setItem(null)} className="mt-3 flex h-12 w-full items-center justify-center gap-1 font-semibold text-zinc-500">
              Fechar <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
