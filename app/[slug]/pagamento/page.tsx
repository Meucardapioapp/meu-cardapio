"use client";

import { useEffect, useMemo, useState } from "react";
import { buscarCardapio, cardapioGuardado } from "@/lib/cardapio-cliente";
import { useParams, useRouter } from "next/navigation";
import { useRestaurant } from "@/contexts/RestaurantContext";
import { formatarCPF, validarCPF } from "@/lib/validacoes";
import {
  ShoppingCart,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Banknote,
  Check,
  Gift,
  AlertTriangle,
  TicketPercent,
  X,
} from "lucide-react";
import { normalizarCodigoCupom, type ProgramaFidelidade } from "@/lib/fidelidade";
import { FaPix } from "react-icons/fa6";
import { agoraNoFuso, statusDaLoja } from "@/lib/horario";
import { paraUF } from "@/lib/uf";
import { lerCarrinho, limparCarrinho, precoUnitario } from "@/lib/carrinho";

type Metodo = "pix" | "pix_chave" | "cartao_entrega" | "dinheiro";

const METODO_API: Record<Metodo, string> = {
  pix: "pix",
  pix_chave: "pix_chave",
  cartao_entrega: "card_delivery",
  dinheiro: "cash",
};

function lerJSON<T>(chave: string, padrao: T): T {
  try {
    const valor = localStorage.getItem(chave);
    return valor ? (JSON.parse(valor) as T) : padrao;
  } catch {
    return padrao;
  }
}

const reais = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Opcao({
  id,
  titulo,
  descricao,
  icone,
  ativo,
  cor,
  onEscolher,
}: {
  id: Metodo;
  titulo: string;
  descricao: string;
  icone: React.ReactNode;
  ativo: boolean;
  cor: string;
  onEscolher: (id: Metodo) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onEscolher(id)}
      className="w-full bg-white rounded-2xl border-2 p-4 flex items-center justify-between gap-3 text-left transition active:scale-[0.99]"
      style={{ borderColor: ativo ? cor : "#E5E7EB" }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 rounded-xl bg-zinc-50 flex items-center justify-center shrink-0">
          {icone}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-zinc-900">{titulo}</p>
          <p className="text-xs text-zinc-500">{descricao}</p>
        </div>
      </div>

      <span
        className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0"
        style={{
          borderColor: ativo ? cor : "#D4D4D8",
          backgroundColor: ativo ? cor : "white",
        }}
      >
        {ativo && <Check size={14} color="white" strokeWidth={3} />}
      </span>
    </button>
  );
}

export default function PagamentoPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { logo, corPrincipal } = useRestaurant();
  const [lembrarCpf, setLembrarCpf] = useState(false);

  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const [restauranteId, setRestauranteId] = useState<string | null>(null);
  const [whatsappRestaurante, setWhatsappRestaurante] = useState("");
  const [lojaAberta, setLojaAberta] = useState(true);
  const [pedidosAtivos, setPedidosAtivos] = useState(true);

  const [aceitaPix, setAceitaPix] = useState(false);
  const [aceitaPixChave, setAceitaPixChave] = useState(false);
  const [aceitaDinheiro, setAceitaDinheiro] = useState(false);
  const [aceitaCartaoEntrega, setAceitaCartaoEntrega] = useState(false);
  const [metodo, setMetodo] = useState<Metodo | null>(null);

  const [retirada, setRetirada] = useState(false);
  const [mesa, setMesa] = useState("");
  const [dados, setDados] = useState<any>({});
  const [carrinho, setCarrinho] = useState<any[]>([]);
  const [taxaEntrega, setTaxaEntrega] = useState(0);

  const [cpf, setCpf] = useState("");
  const [precisaTroco, setPrecisaTroco] = useState(false);
  const [trocoPara, setTrocoPara] = useState("");

  const [clienteToken, setClienteToken] = useState("");
  const [programa, setPrograma] = useState<ProgramaFidelidade | null>(null);
  const [premioDisponivel, setPremioDisponivel] = useState(false);
  const [usarPremio, setUsarPremio] = useState(false);

  const [cupomTexto, setCupomTexto] = useState("");
  const [cupom, setCupom] = useState<{ codigo: string; desconto: number } | null>(null);
  const [cupomErro, setCupomErro] = useState("");
  const [validandoCupom, setValidandoCupom] = useState(false);
  const [mostrarCupom, setMostrarCupom] = useState(false);

  useEffect(() => {
    async function carregar() {
      const tipoSalvo = localStorage.getItem("tipoPedido");
      let mesaAtual = "";
      try { mesaAtual = sessionStorage.getItem(`mesa-${slug}`) || ""; } catch {}
      const ehMesa = tipoSalvo === "mesa" && Boolean(mesaAtual);
      setMesa(ehMesa ? mesaAtual : "");
      const ehRetirada = tipoSalvo === "retirada" || ehMesa;
      const endereco = lerJSON<any>(`endereco-${slug}`, {});
      const dadosRetirada = lerJSON<any>("dadosRetirada", {});
      const itens = lerCarrinho(slug);

      setRetirada(ehRetirada);
      setCarrinho(itens);
      setTaxaEntrega(ehRetirada ? 0 : Number(endereco.taxaEntrega || 0));
      setDados(
        ehRetirada
          ? { nome: dadosRetirada.nome, telefone: dadosRetirada.telefone, cpf: dadosRetirada.cpf }
          : { ...endereco, telefone: endereco.whatsapp }
      );
      let cpfLembrado = "";
      try {
        cpfLembrado = localStorage.getItem("cpf-pix") || "";
      } catch {}
      if (cpfLembrado) setLembrarCpf(true);
      setCpf(formatarCPF(cpfLembrado || (ehRetirada ? dadosRetirada.cpf : endereco.cpf) || ""));

      const token =
        localStorage.getItem(`cliente_token-${slug}`) ||
        localStorage.getItem("cliente_token") ||
        "";
      setClienteToken(token);

      // Já veio do cardápio nesta visita: abre na hora (o servidor confere tudo ao finalizar).
      const cardapio = cardapioGuardado(slug) ?? (await buscarCardapio(slug));
      const restaurante = cardapio?.restaurante;

      if (!restaurante) {
        setErro("Restaurante não encontrado.");
        setCarregando(false);
        return;
      }

      setRestauranteId(String(restaurante.id));
      setWhatsappRestaurante(String(restaurante.whatsapp || "").replace(/\D/g, ""));

      const [configResposta, fidelidade] = await Promise.all([
        fetch(`/api/configuracoes-pagamento?restauranteId=${restaurante.id}`).then((r) => r.json()),
        fetch(
          `/api/fidelidade?restauranteId=${encodeURIComponent(String(restaurante.id))}`,
          { headers: { "x-cliente-token": token } }
        )
          .then((r) => r.json())
          .catch(() => null),
      ]);

      const aparencia = cardapio?.aparencia;

      // Horário no fuso do restaurante (inclusive o que passa da meia-noite).
      const uf = restaurante.uf || paraUF(restaurante.estado);
      setLojaAberta(statusDaLoja(aparencia, agoraNoFuso(uf)).aberta);

      const pix = Boolean(configResposta?.pix_online);
      const dinheiro = Boolean(configResposta?.dinheiro);
      const cartao = Boolean(configResposta?.cartao_entrega);

      const pixChave = Boolean(configResposta?.pix_chave);
      setAceitaPix(pix);
      setAceitaPixChave(pixChave);
      setAceitaDinheiro(dinheiro);
      setAceitaCartaoEntrega(cartao);
      setPedidosAtivos(configResposta?.pedidos_ativos !== false);
      setMetodo(pix ? "pix" : pixChave ? "pix_chave" : cartao ? "cartao_entrega" : dinheiro ? "dinheiro" : null);

      if (fidelidade?.programa) {
        setPrograma(fidelidade.programa);
        setPremioDisponivel(Boolean(fidelidade.cliente?.premioDisponivel));
      }

      setCarregando(false);
    }

    carregar();
  }, [slug]);

  const quantidadeItens = carrinho.reduce((s, i) => s + Number(i.quantity || 0), 0);
  const subtotal = useMemo(
    () => carrinho.reduce((s, i) => s + precoUnitario(i) * Number(i.quantity), 0),
    [carrinho]
  );
  const descontoCupom = cupom ? Math.min(cupom.desconto, subtotal) : 0;
  const premioEmDinheiro = programa?.tipoPremio === "dinheiro";
  const descontoFiel =
    usarPremio && premioEmDinheiro
      ? Math.min(Number(programa?.valorDesconto || 0), Math.max(subtotal + taxaEntrega - descontoCupom, 0))
      : 0;
  const total = Math.max(subtotal + taxaEntrega - descontoCupom - descontoFiel, 0);

  async function aplicarCupom() {
    const codigo = normalizarCodigoCupom(cupomTexto);
    setCupomErro("");
    if (codigo.length < 3 || !restauranteId) {
      setCupomErro("Digite o código do cupom.");
      return;
    }
    setValidandoCupom(true);
    try {
      const resposta = await fetch("/api/cupom/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restauranteId, codigo, subtotal, telefone: dados.telefone || "" }),
      }).then((r) => r.json());

      if (!resposta.success) {
        setCupom(null);
        setCupomErro(resposta.error || "Cupom inválido.");
        return;
      }
      setCupom({ codigo: resposta.cupom.codigo, desconto: Number(resposta.desconto || 0) });
      setCupomTexto(resposta.cupom.codigo);
    } catch {
      setCupomErro("Sem conexão. Tente de novo.");
    } finally {
      setValidandoCupom(false);
    }
  }

  const cpfOk = validarCPF(cpf);
  const trocoNumero = Number(trocoPara.replace(/\./g, "").replace(",", "."));

  function voltar() {
    router.push(retirada ? `/${slug}/carrinho` : `/${slug}/endereco`);
  }

  function escolherMetodo(m: Metodo) {
    setMetodo(m);
    if (typeof window !== "undefined" && typeof (window as any).fbq === "function") {
      (window as any).fbq("track", "AddPaymentInfo", { value: total, currency: "BRL", payment_type: m });
    }
  }

  async function finalizar() {
    if (enviando || !restauranteId) return;

    setErro("");

    if (!pedidosAtivos) {
      setErro("Este restaurante não está recebendo pedidos online agora.");
      return;
    }

    if (!lojaAberta) {
      setErro("O restaurante está fechado e não está recebendo pedidos.");
      return;
    }

    if (!metodo) {
      setErro("Escolha uma forma de pagamento.");
      return;
    }

    if (metodo === "pix" && !cpfOk) {
      setErro("Para gerar o Pix, informe um CPF válido.");
      return;
    }

    if (metodo === "dinheiro" && precisaTroco && !(trocoNumero > total)) {
      setErro(`O troco precisa ser para um valor maior que ${reais(total)}.`);
      return;
    }

    if (carrinho.length === 0) {
      setErro("Seu carrinho está vazio.");
      return;
    }

    setEnviando(true);

    try {
      const resposta = await fetch("/api/pedido/criar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restauranteId,
          nome: dados.nome,
          telefone: dados.telefone,
          tipoPedido: mesa ? "mesa" : retirada ? "retirada" : "entrega",
          mesa: mesa || undefined,
          bairro: retirada ? "" : dados.bairro,
          rua: retirada ? "" : dados.rua,
          numero: retirada ? "" : dados.numero,
          complemento: retirada ? "" : dados.complemento,
          cep: retirada ? "" : dados.cep || "",
          referencia: dados.referencia || "",
          observacoes: "",
          payment_method: METODO_API[metodo],
          trocoPara: metodo === "dinheiro" && precisaTroco ? trocoNumero : null,
          usarPremioFidelidade: usarPremio,
          cupom: cupom?.codigo || "",
          clienteToken,
          itens: carrinho.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            observacao: item.observacao || "",
            adicionaisSelecionados: (item.adicionaisSelecionados || []).map((a: any) => ({
              id: a.id,
              nome: a.nome,
            })),
            obrigatoriosSelecionados: (item.obrigatoriosSelecionados || []).map((o: any) => ({
              id: o.id,
              grupo: o.grupo,
              nome: o.nome,
            })),
          })),
        }),
      });

      const resultado = await resposta.json();

      if (!resultado.success) {
        if (resultado.code === "CUPOM_INVALIDO") {
          setCupom(null);
          setCupomErro(resultado.error);
          setMostrarCupom(true);
        }
        setErro(resultado.error || "Não foi possível criar o pedido.");
        setEnviando(false);
        return;
      }

      if (resultado.cliente?.token_acesso) {
        localStorage.setItem(`cliente_token-${slug}`, resultado.cliente.token_acesso);
      }

      const pedido = resultado.pedido;
      const codigo = pedido.codigo_acesso;

      if (metodo === "pix") {
        const pix = await fetch("/api/pagarme/criar-pix", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pedidoId: pedido.id, codigo, cpf }),
        }).then((r) => r.json());

        if (!pix.success || !pix.qrCode) {
          setErro(pix.error || "Não foi possível gerar o Pix. Tente novamente.");
          setEnviando(false);
          return;
        }

        try {
          if (lembrarCpf) localStorage.setItem("cpf-pix", cpf);
          else localStorage.removeItem("cpf-pix");
        } catch {}
        const exp = pix.expiresAt ? `&exp=${encodeURIComponent(pix.expiresAt)}` : "";
        window.location.href = `/${slug}/pix?id=${pedido.id}&c=${codigo}&qr=${encodeURIComponent(pix.qrCode)}${exp}`;
        return;
      }

      limparCarrinho(slug);
      localStorage.removeItem(`endereco-${slug}`);
      localStorage.removeItem("dadosRetirada");
      sessionStorage.removeItem(`sessao-${slug}`);

      window.location.href = `/${slug}/pedido-aprovado?id=${pedido.id}&c=${codigo}`;
    } catch {
      setErro("Sem conexão. Confira sua internet e tente novamente.");
      setEnviando(false);
    }
  }

  const semFormas = !carregando && !aceitaPix && !aceitaPixChave && !aceitaDinheiro && !aceitaCartaoEntrega;

  return (
    <main className="min-h-screen bg-zinc-50 pb-44">
      <div className="max-w-xl mx-auto px-4 pt-4">
        {/* Topo */}
        <div className="relative flex items-center justify-between mb-6 h-20">
          <button
            type="button"
            onClick={voltar}
            aria-label="Voltar"
            className="w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center active:scale-95"
          >
            <ArrowLeft size={22} style={{ color: corPrincipal }} />
          </button>

          {logo && (
            <img
              src={logo}
              alt="Logo"
              className="absolute left-1/2 -translate-x-1/2 w-16 h-16 object-cover rounded-full shadow-md bg-white border"
            />
          )}

          <div
            className="px-3 py-2 rounded-xl text-white flex items-center gap-2"
            style={{ backgroundColor: corPrincipal }}
          >
            <ShoppingCart size={16} />
            <span>{quantidadeItens}</span>
          </div>
        </div>

        <h1 className="text-2xl font-black text-zinc-900">Pagamento</h1>
        <p className="text-zinc-500 mt-1 mb-4">Confira e escolha como vai pagar</p>

        {!carregando && (
          <div className="mb-5 rounded-2xl bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-zinc-500">
                  {mesa ? `Mesa ${mesa}` : retirada ? "Retirar no local" : "Entregar em"}
                </p>
                {!retirada && (
                  <p className="mt-0.5 text-[15px] font-semibold leading-snug text-zinc-900">
                    {[dados.rua, dados.numero].filter(Boolean).join(", ")}
                    {dados.complemento ? ` · ${dados.complemento}` : ""}
                    <span className="block text-sm font-normal text-zinc-500">{dados.bairro}</span>
                  </p>
                )}
                <p className="mt-0.5 text-sm text-zinc-500">
                  {dados.nome} · {dados.telefone}
                </p>
              </div>
              <button type="button" onClick={voltar} className="shrink-0 text-sm font-semibold" style={{ color: corPrincipal }}>
                Alterar
              </button>
            </div>
          </div>
        )}

        {!pedidosAtivos && !carregando && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <div className="flex gap-3">
              <AlertTriangle className="shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold">Pedidos online pausados</p>
                <p className="text-sm mt-1">
                  O restaurante não está recebendo pedidos pelo cardápio agora.
                </p>
                {whatsappRestaurante && (
                  <a
                    href={`https://wa.me/55${whatsappRestaurante.replace(/^55/, "")}`}
                    className="inline-block mt-3 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Pedir pelo WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {carregando ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-white animate-pulse" />
            ))}
          </div>
        ) : semFormas ? (
          <div className="rounded-2xl bg-white p-5 text-zinc-600">
            O restaurante ainda não configurou as formas de pagamento.
          </div>
        ) : (
          <div className="space-y-3">
            {aceitaPix && (
              <div>
                <Opcao
                  id="pix"
                  ativo={metodo === "pix"}
                  cor={corPrincipal}
                  onEscolher={escolherMetodo}
                  titulo="Pix"
                  descricao="Pague agora pelo app do banco"
                  icone={<FaPix size={24} color="#32BCAD" />}
                />

                {metodo === "pix" && (
                  <div className="mt-2 rounded-2xl bg-white border p-4">
                    <label className="text-xs font-semibold text-zinc-600" htmlFor="cpf">
                      CPF de quem vai pagar
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        id="cpf"
                        value={cpf}
                        onChange={(e) => setCpf(formatarCPF(e.target.value))}
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="000.000.000-00"
                        className="flex-1 text-base font-semibold outline-none py-2"
                      />
                      {cpf.length === 14 && (
                        <span className={`text-xs font-bold ${cpfOk ? "text-green-600" : "text-red-500"}`}>
                          {cpfOk ? "OK" : "Inválido"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      Exigido pelo banco para gerar o Pix.
                    </p>
                    <label className="mt-3 flex items-center gap-2 text-xs text-zinc-600">
                      <input type="checkbox" checked={lembrarCpf} onChange={(e) => setLembrarCpf(e.target.checked)} />
                      Lembrar meu CPF neste celular
                    </label>
                  </div>
                )}
              </div>
            )}

            {aceitaPixChave && (
              <Opcao
                id="pix_chave"
                ativo={metodo === "pix_chave"}
                cor={corPrincipal}
                onEscolher={escolherMetodo}
                titulo={aceitaPix ? "Pix na chave do restaurante" : "Pix"}
                descricao="Ao finalizar, você recebe o Pix copia e cola com o valor"
                icone={<FaPix size={24} color="#32BCAD" />}
              />
            )}

            {aceitaCartaoEntrega && (
              <Opcao
                id="cartao_entrega"
                ativo={metodo === "cartao_entrega"}
                cor={corPrincipal}
                onEscolher={escolherMetodo}
                titulo="Cartão de crédito ou débito"
                descricao={mesa ? "Pague no final (maquininha)" : retirada ? "Pague na retirada" : "Pague na entrega (maquininha)"}
                icone={<CreditCard size={22} color={corPrincipal} />}
              />
            )}

            {aceitaDinheiro && (
              <div>
                <Opcao
                  id="dinheiro"
                  ativo={metodo === "dinheiro"}
                  cor={corPrincipal}
                  onEscolher={escolherMetodo}
                  titulo="Dinheiro"
                  descricao={mesa ? "Pague no final" : retirada ? "Pague na retirada" : "Pague na entrega"}
                  icone={<Banknote size={22} color="#16A34A" />}
                />

                {metodo === "dinheiro" && (
                  <div className="mt-2 rounded-2xl bg-white border p-4 space-y-3">
                    <label className="flex items-center gap-3 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={precisaTroco}
                        onChange={(e) => setPrecisaTroco(e.target.checked)}
                        className="w-5 h-5"
                      />
                      Preciso de troco
                    </label>

                    {precisaTroco && (
                      <div>
                        <label className="text-xs font-semibold text-zinc-600" htmlFor="troco">
                          Troco para quanto?
                        </label>
                        <div className="flex items-center gap-2 mt-1 border rounded-xl px-3">
                          <span className="text-zinc-500">R$</span>
                          <input
                            id="troco"
                            value={trocoPara}
                            onChange={(e) => setTrocoPara(e.target.value.replace(/[^\d,]/g, ""))}
                            inputMode="decimal"
                            placeholder="100,00"
                            className="flex-1 text-base font-semibold outline-none py-3"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Prêmio do cliente fiel */}
        {programa && premioDisponivel && (
          <label
            className="mt-4 block rounded-2xl border-2 bg-white p-4 cursor-pointer"
            style={{ borderColor: usarPremio ? corPrincipal : "#E5E7EB" }}
          >
            <span className="flex items-center gap-3">
              <Gift size={24} style={{ color: corPrincipal }} className="shrink-0" />
              <span className="flex-1">
                <span className="block font-bold">Parabéns!! Você é nosso cliente fiel 🎉</span>
                <span className="block text-sm text-zinc-600">
                  Usar meu prêmio agora: <strong>{programa.textoPremio}</strong>
                </span>
              </span>
              <input
                type="checkbox"
                checked={usarPremio}
                onChange={(e) => setUsarPremio(e.target.checked)}
                className="w-6 h-6"
              />
            </span>
            {!usarPremio && (
              <span className="block mt-2 text-xs text-zinc-500">
                Se preferir, guarde o prêmio para o próximo pedido.
              </span>
            )}
          </label>
        )}

        {/* Cupom */}
        <div className="mt-4 rounded-2xl bg-white border p-4">
          {cupom ? (
            <div className="flex items-center gap-3">
              <TicketPercent size={22} className="text-green-600 shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-zinc-900">Cupom {cupom.codigo} aplicado</p>
                <p className="text-sm text-green-700">Você economizou {reais(descontoCupom)}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCupom(null);
                  setCupomTexto("");
                }}
                aria-label="Remover cupom"
                className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>
          ) : !mostrarCupom ? (
            <button
              type="button"
              onClick={() => setMostrarCupom(true)}
              className="w-full flex items-center gap-3 text-left"
            >
              <TicketPercent size={22} style={{ color: corPrincipal }} />
              <span className="flex-1 font-semibold">Tem um cupom de desconto?</span>
              <span className="text-sm font-bold" style={{ color: corPrincipal }}>Adicionar</span>
            </button>
          ) : (
            <div>
              <label htmlFor="cupom" className="text-sm font-semibold text-zinc-700">
                Tem um cupom?
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="cupom"
                  value={cupomTexto}
                  onChange={(e) => {
                    setCupomTexto(normalizarCodigoCupom(e.target.value));
                    setCupomErro("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") aplicarCupom();
                  }}
                  placeholder="Digite o código"
                  autoCapitalize="characters"
                  autoComplete="off"
                  className="flex-1 min-w-0 h-12 rounded-xl border px-3 text-base font-bold uppercase tracking-wider outline-none"
                />
                <button
                  type="button"
                  onClick={aplicarCupom}
                  disabled={validandoCupom}
                  className="h-12 px-5 rounded-xl text-white font-bold disabled:opacity-60"
                  style={{ backgroundColor: corPrincipal }}
                >
                  {validandoCupom ? "..." : "Aplicar"}
                </button>
              </div>
              {cupomErro && <p className="mt-2 text-sm text-red-600">{cupomErro}</p>}
            </div>
          )}
        </div>

        {/* Resumo */}
        <div className="bg-white rounded-2xl p-5 mt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Resumo do pedido</h2>
            <button type="button" onClick={() => router.push(`/${slug}/carrinho`)} className="text-sm font-semibold" style={{ color: corPrincipal }}>
              Editar itens
            </button>
          </div>
          <div className="mb-3 space-y-1.5 border-b border-zinc-100 pb-3">
            {carrinho.map((item: any) => (
              <div key={item.uniqueId} className="flex justify-between gap-3 text-sm">
                <span className="min-w-0 text-zinc-700">
                  <strong>{item.quantity}x</strong> {item.nome}
                  {(item.obrigatoriosSelecionados ?? []).length > 0 && (
                    <span className="block text-xs text-zinc-500">{(item.obrigatoriosSelecionados ?? []).map((o: any) => o.nome).join(" · ")}</span>
                  )}
                  {(item.adicionaisSelecionados ?? []).length > 0 && (
                    <span className="block text-xs text-zinc-500">+ {(item.adicionaisSelecionados ?? []).map((x: any) => x.nome).join(", ")}</span>
                  )}
                </span>
                <span className="shrink-0 text-zinc-700">{reais(precoUnitario(item) * Number(item.quantity))}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between mb-2 text-zinc-700">
            <span>Total dos produtos</span>
            <span>{reais(subtotal)}</span>
          </div>

          <div className="flex justify-between mb-2 text-zinc-700">
            <span>{mesa ? `Mesa ${mesa}` : retirada ? "Retirada no local" : "Taxa de entrega"}</span>
            <span>{retirada ? "Grátis" : reais(taxaEntrega)}</span>
          </div>

          {descontoCupom > 0 && (
            <div className="flex justify-between mb-2 text-green-700">
              <span>Cupom {cupom?.codigo}</span>
              <span>- {reais(descontoCupom)}</span>
            </div>
          )}

          {usarPremio && programa && (
            <div className="flex justify-between mb-2 text-green-700 font-semibold">
              {premioEmDinheiro ? (
                <>
                  <span>Cliente fiel</span>
                  <span>- {reais(descontoFiel)}</span>
                </>
              ) : (
                <>
                  <span>Cliente fiel + {programa.textoPremio}</span>
                  <span>{reais(0)}</span>
                </>
              )}
            </div>
          )}

          <hr className="my-3" />

          <div className="flex justify-between items-center">
            <span className="text-lg font-black">Total</span>
            <span className="text-2xl font-black" style={{ color: corPrincipal }}>
              {reais(total)}
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 mt-5 text-zinc-500 text-sm">
            <ShieldCheck size={16} />
            Ambiente seguro
          </div>
        </div>
      </div>

      {/* Botão */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-xl mx-auto">
          {erro && (
            <p role="alert" className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {erro}
            </p>
          )}

          <button
            type="button"
            disabled={enviando || carregando || semFormas || !pedidosAtivos}
            onClick={finalizar}
            className="w-full h-14 rounded-xl text-white font-bold shadow-lg transition active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-3"
            style={{ backgroundColor: corPrincipal }}
          >
            {enviando ? (
              <>
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Finalizando pedido...
              </>
            ) : metodo === "pix" ? (
              `Gerar Pix de ${reais(total)}`
            ) : (
              `Finalizar pedido • ${reais(total)}`
            )}
          </button>
          <p className="mt-2 text-center text-[11px] leading-4 text-zinc-400">
            Seus dados vão para o restaurante preparar e entregar o pedido.{" "}
            <a href="/privacidade" target="_blank" rel="noreferrer" className="underline">Política de Privacidade</a>
          </p>
        </div>
      </div>
    </main>
  );
}
