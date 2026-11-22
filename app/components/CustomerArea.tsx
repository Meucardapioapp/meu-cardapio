"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import EditProfile from "./customer/EditProfile";
import EditAddresses from "./customer/EditAddresses";
import LoginCustomer from "./customer/LoginCustomer";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { reais } from "@/lib/dinheiro";
import {
  User,
  Phone,
  ArrowRight,
  X,
  MapPin,
  Package,
  Ticket,
  LogOut,
  Wallet,
  ChevronRight,
  Pencil,
  Check,
} from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Cor da loja (deixa a tela com a identidade do restaurante). */
  corPrincipal?: string;
  /** Abre já rolado até "Últimos pedidos". */
  foco?: "pedidos";
  /** Monta o carrinho com os itens de um pedido antigo. */
  onPedirDeNovo?: (pedido: any) => void;
  /** "Conta": esconde a lista de pedidos (ela tem a aba própria). */
  semPedidos?: boolean;
  onVerPedidos?: () => void;
};

const NOME_STATUS: Record<string, string> = {
  pendente: "Recebido",
  aceito: "Em preparo",
  entrega: "Saiu para entrega",
  pronto: "Pronto",
  concluido: "Entregue",
  recusado: "Recusado",
  cancelado: "Cancelado",
};

const corDoStatus = (status: string) =>
  status === "Entregue"
    ? "bg-green-100 text-green-700"
    : status === "Cancelado" || status === "Recusado"
    ? "bg-red-100 text-red-700"
    : status === "Saiu para entrega"
    ? "bg-blue-100 text-blue-700"
    : "bg-amber-100 text-amber-700";

export default function CustomerArea({
  open,
  onClose,
  corPrincipal,
  foco,
  onPedirDeNovo,
  semPedidos = false,
  onVerPedidos,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const cor = corPrincipal || "#18181b";

  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState<any>(null);
  const [fidelidade, setFidelidade] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [apagando, setApagando] = useState(false);

  const slugAtual = () => window.location.pathname.split("/")[1];
  const tokenAtual = () => localStorage.getItem(`cliente_token-${slugAtual()}`) || "";

  async function carregarFidelidade(rid: string | undefined, token: string) {
    if (!rid) return;
    try {
      const r = await fetch(`/api/fidelidade?restauranteId=${encodeURIComponent(rid)}`, {
        headers: { "x-cliente-token": token },
      });
      const f = await r.json().catch(() => null);
      if (f?.success && f.programa) setFidelidade(f);
    } catch {}
  }

  async function recarregar() {
    const token = tokenAtual();
    if (!token) return;
    const r = await fetch("/api/cliente/me", { headers: { "x-cliente-token": token } });
    const d = await r.json().catch(() => null);
    if (d?.success) {
      setDados(d);
      carregarFidelidade(d.cliente?.restaurante_id, token);
    }
  }

  useEffect(() => {
    async function carregarCliente() {
      setDados(null);
      setFidelidade(null);
      setLoading(true);

      const token = tokenAtual();
      if (!token) {
        setLoginOpen(true);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/cliente/me", { headers: { "x-cliente-token": token } });
        const resultado = await response.json();

        if (resultado.success) {
          setDados(resultado);
          // Fidelidade (programa + selos do cliente), se o restaurante tiver.
          carregarFidelidade(resultado.cliente?.restaurante_id, token);
        } else {
          setDados(null);
        }
      } catch (error) {
        console.error(error);
      }

      setLoading(false);
    }

    if (open) carregarCliente();
  }, [open, pathname]);

  async function apagarMeusDados() {
    setApagando(true);
    const token = tokenAtual();
    try {
      const r = await fetch("/api/cliente/excluir", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-cliente-token": token },
        body: JSON.stringify({ confirmar: "APAGAR" }),
      });
      const d = await r.json().catch(() => null);
      if (!d?.success) {
        window.alert(d?.error || "Não foi possível apagar agora.");
        return;
      }
      const slug = slugAtual();
      localStorage.removeItem(`cliente_token-${slug}`);
      try {
        for (const k of Object.keys(localStorage))
          if (k.includes(slug) && /endereco|cliente|dados/i.test(k)) localStorage.removeItem(k);
      } catch {}
      setDados(null);
      setConfirmarExclusao(false);
      onClose();
    } finally {
      setApagando(false);
    }
  }

  function sair() {
    localStorage.removeItem(`cliente_token-${slugAtual()}`);
    setDados(null);
    onClose();
  }

  const totalPedidos = Number(dados?.cliente?.total_pedidos || dados?.pedidos?.length || 0);
  const totalGasto = Number(dados?.cliente?.total_gasto || 0);
  const inicial = String(dados?.cliente?.nome || "?").trim().charAt(0).toUpperCase();

  const clienteDesde = useMemo(() => {
    if (!dados?.cliente?.created_at) return "";
    return new Date(dados.cliente.created_at).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  }, [dados]);

  const fidelInfo = useMemo(() => {
    if (!fidelidade?.programa) return null;
    const necessarios = Number(fidelidade.programa.pedidosNecessarios || 10);
    const selos = Number(fidelidade.cliente?.selos || 0);
    const premio = String(fidelidade.programa.textoPremio || "recompensa");
    return { necessarios, selos, premio, disponivel: selos >= necessarios };
  }, [fidelidade]);

  useEffect(() => {
    if (!open || foco !== "pedidos" || loading || !dados) return;
    const t = setTimeout(
      () => document.getElementById("meus-pedidos")?.scrollIntoView({ behavior: "smooth", block: "start" }),
      120
    );
    return () => clearTimeout(t);
  }, [open, foco, loading, dados]);

  if (!open) return null;

  const principalId = dados?.enderecos?.find((e: any) => e.principal)?.id ?? dados?.enderecos?.[0]?.id;

  return (
    <>
      <div className="fixed inset-0 z-[9998] bg-black/50" onClick={onClose} />

      <div className="fixed inset-0 z-[9999] overflow-y-auto bg-zinc-50">
        {/* Cabeçalho */}
        <div className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-5">
            <div>
              <h1 className="text-xl font-black leading-tight">Minha conta</h1>
              <p className="text-xs text-zinc-500">Seus dados, endereços e fidelidade</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 transition hover:bg-zinc-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-2xl px-5 pb-16 pt-6">
          {/* Carregando */}
          {loading && (
            <div className="space-y-4">
              <div className="h-44 animate-pulse rounded-3xl bg-zinc-200" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-24 animate-pulse rounded-2xl bg-zinc-200" />
                <div className="h-24 animate-pulse rounded-2xl bg-zinc-200" />
              </div>
            </div>
          )}

          {/* Sem cliente */}
          {!loading && !dados && (
            <div className="rounded-3xl border border-zinc-200 bg-white p-7 text-center shadow-sm">
              <div
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: cor }}
              >
                <User size={36} />
              </div>
              <h2 className="mt-5 text-2xl font-black">Bem-vindo 👋</h2>
              <p className="mx-auto mt-3 max-w-sm leading-7 text-zinc-500">
                Faça seu primeiro pedido e seus dados ficam salvos neste aparelho. Depois você acompanha pedidos, salva
                endereços e pede de novo com poucos toques.
              </p>
              <button
                onClick={onClose}
                className="mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-2xl font-bold text-white shadow-md transition active:scale-[0.98]"
                style={{ backgroundColor: cor }}
              >
                Ver o cardápio
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* Cliente logado */}
          {!loading && dados && (
            <>
              {/* Cartão principal (com a cor da loja) */}
              <div
                className="rounded-3xl p-6 text-white shadow-xl"
                style={{ background: `linear-gradient(135deg, ${cor} 0%, ${cor}DD 55%, #111827 100%)` }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/15 text-2xl font-black">
                    {inicial || <User size={30} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-2xl font-black">{dados.cliente.nome}</h2>
                    <p className="mt-0.5 text-sm text-white/70">Cliente desde {clienteDesde || "hoje"}</p>
                  </div>
                  <button
                    onClick={() => setEditOpen(true)}
                    aria-label="Editar meus dados"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
                  >
                    <Pencil size={17} />
                  </button>
                </div>

                <div className="mt-5 flex items-center gap-2 text-sm text-white/85">
                  <Phone size={15} />
                  {dados.cliente.telefone}
                </div>

                {/* Números reais */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <div className="flex items-center gap-1.5 text-xs text-white/70">
                      <Package size={14} /> Pedidos
                    </div>
                    <p className="mt-1.5 text-2xl font-black">{totalPedidos}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <div className="flex items-center gap-1.5 text-xs text-white/70">
                      <Wallet size={14} /> Total gasto
                    </div>
                    <p className="mt-1.5 text-2xl font-black">{reais(totalGasto)}</p>
                  </div>
                </div>
              </div>

              {/* Fidelidade (só se o restaurante tiver programa) */}
              {fidelInfo && (
                <div className="mt-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Ticket size={18} style={{ color: cor }} />
                    <h3 className="font-bold">Cartão fidelidade</h3>
                  </div>
                  {fidelInfo.disponivel ? (
                    <div
                      className="mt-3 rounded-2xl px-4 py-3 text-center text-white"
                      style={{ backgroundColor: cor }}
                    >
                      <p className="text-[15px] font-extrabold">🎉 Você ganhou: {fidelInfo.premio}</p>
                      <p className="text-xs text-white/85">Marque “Usar meu prêmio” na hora de pagar.</p>
                    </div>
                  ) : (
                    <>
                      <p className="mt-2 text-sm text-zinc-600">
                        Junte <strong>{fidelInfo.necessarios} pedidos</strong> e ganhe{" "}
                        <strong style={{ color: cor }}>{fidelInfo.premio}</strong>.
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        {Array.from({ length: fidelInfo.necessarios }).map((_, i) => (
                          <Ticket
                            key={i}
                            size={20}
                            strokeWidth={1.8}
                            style={{
                              color: i < fidelInfo.selos ? cor : "#D6B46A",
                              fill: i < fidelInfo.selos ? cor : "transparent",
                            }}
                          />
                        ))}
                      </div>
                      {fidelInfo.selos > 0 && (
                        <p className="mt-2 text-xs text-zinc-500">
                          Faltam <strong>{fidelInfo.necessarios - fidelInfo.selos}</strong>{" "}
                          {fidelInfo.necessarios - fidelInfo.selos === 1 ? "pedido" : "pedidos"}.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Atalhos */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setEditOpen(true)}
                  className="rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.98]"
                >
                  <User size={22} style={{ color: cor }} />
                  <p className="mt-2 font-bold">Meus dados</p>
                  <p className="text-xs text-zinc-500">Nome, telefone e CPF</p>
                </button>
                <button
                  onClick={() => setAddressOpen(true)}
                  className="rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.98]"
                >
                  <MapPin size={22} style={{ color: cor }} />
                  <p className="mt-2 font-bold">Endereços</p>
                  <p className="text-xs text-zinc-500">Adicionar e editar</p>
                </button>
              </div>

              {/* Meus pedidos: link (quando a lista tem aba própria) */}
              {semPedidos && onVerPedidos && (
                <button
                  type="button"
                  onClick={onVerPedidos}
                  className="mt-4 flex w-full items-center justify-between rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-left shadow-sm transition active:scale-[0.99]"
                >
                  <span className="flex items-center gap-3">
                    <Package size={20} style={{ color: cor }} />
                    <span>
                      <span className="block font-bold">Meus pedidos</span>
                      <span className="block text-sm text-zinc-500">
                        {totalPedidos} {totalPedidos === 1 ? "pedido" : "pedidos"} · acompanhar e pedir de novo
                      </span>
                    </span>
                  </span>
                  <ChevronRight size={20} className="text-zinc-400" />
                </button>
              )}

              {/* Lista de pedidos (quando não há aba separada) */}
              {!semPedidos && (
                <div className="mt-8 scroll-mt-24" id="meus-pedidos">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-black">Últimos pedidos</h2>
                    <span className="text-sm text-zinc-500">
                      {totalPedidos} {totalPedidos === 1 ? "pedido" : "pedidos"}
                    </span>
                  </div>

                  {dados.pedidos.length === 0 ? (
                    <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center">
                      <Package size={40} className="mx-auto text-zinc-300" />
                      <h3 className="mt-4 font-bold">Nenhum pedido ainda</h3>
                      <p className="mt-1 text-sm text-zinc-500">Assim que você pedir, aparece aqui.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dados.pedidos.map((pedido: any) => {
                        const status = NOME_STATUS[String(pedido.status)] || pedido.status || "Recebido";
                        return (
                          <div key={pedido.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-xs text-zinc-500">Pedido</p>
                                <h3 className="text-lg font-black">#{pedido.numero_pedido ?? pedido.id}</h3>
                              </div>
                              <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${corDoStatus(status)}`}>
                                {status}
                              </span>
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                              <p className="text-sm text-zinc-500">
                                {new Date(pedido.created_at).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                              <p className="text-lg font-black">{reais(pedido.total_pago || pedido.total || 0)}</p>
                            </div>
                            <div className="mt-4 flex gap-3">
                              {onPedirDeNovo && Array.isArray(pedido.itens) && pedido.itens.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => onPedirDeNovo(pedido)}
                                  className="h-11 flex-1 rounded-xl font-bold text-white transition active:scale-[0.98]"
                                  style={{ backgroundColor: cor }}
                                >
                                  Pedir de novo
                                </button>
                              )}
                              <button
                                onClick={() => router.push(`/pedido/${pedido.id}?c=${pedido.codigo_acesso ?? ""}`)}
                                className="flex h-11 flex-1 items-center justify-center gap-1 rounded-xl bg-zinc-100 font-semibold transition hover:bg-zinc-200"
                              >
                                Ver detalhes
                                <ChevronRight size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Endereços */}
              <div className="mt-8">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-black">Endereços</h2>
                  <button
                    onClick={() => setAddressOpen(true)}
                    className="text-sm font-bold"
                    style={{ color: cor }}
                  >
                    + Adicionar
                  </button>
                </div>

                {dados.enderecos.length === 0 ? (
                  <button
                    onClick={() => setAddressOpen(true)}
                    className="w-full rounded-3xl border-2 border-dashed border-zinc-300 bg-white p-7 text-center transition hover:border-zinc-400"
                  >
                    <MapPin size={36} className="mx-auto text-zinc-300" />
                    <h3 className="mt-3 font-bold">Nenhum endereço salvo</h3>
                    <p className="mt-1 text-sm text-zinc-500">Toque para adicionar seu endereço de entrega.</p>
                  </button>
                ) : (
                  <div className="space-y-3">
                    {dados.enderecos.map((endereco: any) => {
                      const ehPrincipal = endereco.id === principalId;
                      return (
                        <button
                          key={endereco.id}
                          onClick={() => setAddressOpen(true)}
                          className="flex w-full items-start justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition active:scale-[0.99]"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold">{endereco.apelido || "Endereço"}</h3>
                              {ehPrincipal && (
                                <span
                                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                                  style={{ backgroundColor: cor }}
                                >
                                  <Check size={11} strokeWidth={3} /> Principal
                                </span>
                              )}
                            </div>
                            <p className="mt-1.5 text-sm text-zinc-600">
                              {endereco.rua}, {endereco.numero}
                            </p>
                            <p className="text-sm text-zinc-500">
                              {endereco.bairro}
                              {endereco.cidade ? ` · ${endereco.cidade} - ${endereco.estado}` : ""}
                            </p>
                          </div>
                          <ChevronRight size={18} className="mt-1 shrink-0 text-zinc-400" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Ações da conta */}
              <div className="mt-10">
                <button
                  onClick={sair}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-zinc-300 font-semibold text-zinc-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut size={18} />
                  Sair da conta
                </button>
                <button
                  onClick={() => setConfirmarExclusao(true)}
                  className="mt-4 w-full text-center text-xs font-semibold text-zinc-400 underline hover:text-red-500"
                >
                  Apagar meus dados deste cardápio
                </button>
                <p className="mt-2 text-center text-[11px] text-zinc-400">
                  <a href="/privacidade" target="_blank" rel="noreferrer" className="underline">
                    Política de Privacidade
                  </a>
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmarExclusao}
        title="Apagar seus dados?"
        description="Isso apaga seu cadastro, endereços e selos de fidelidade deste restaurante. Seus pedidos ficam sem o nome e o telefone. Não dá para desfazer."
        confirmText={apagando ? "Apagando..." : "Sim, apagar"}
        cancelText="Cancelar"
        onConfirm={apagarMeusDados}
        onCancel={() => !apagando && setConfirmarExclusao(false)}
      />

      <EditAddresses
        corPrincipal={cor}
        open={addressOpen}
        onClose={() => {
          setAddressOpen(false);
          recarregar();
        }}
      />

      <EditProfile
        corPrincipal={cor}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        cliente={dados?.cliente}
        onSaved={recarregar}
      />

      <LoginCustomer
        corPrincipal={cor}
        open={loginOpen}
        onClose={() => {
          setLoginOpen(false);
          onClose();
        }}
        onSuccess={async () => {
          setLoginOpen(false);
          await recarregar();
        }}
      />
    </>
  );
}
