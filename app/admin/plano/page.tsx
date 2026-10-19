"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { Check, Copy, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { FaPix } from "react-icons/fa6";
import { apiFetch } from "@/utils/apiFetch";
import {
  PLANOS,
  TAXA_PIX_ONLINE_TEXTO,
  formatarReais,
  type EstadoAssinatura,
  type PlanoId,
} from "@/lib/planos";
import { formatarCpfCnpj, validarCpfOuCnpj } from "@/lib/validacoes";

const INCLUIDO = [
  "Cardápio digital com seu link e sua marca",
  "Pedidos ilimitados, sem taxa por pedido",
  "Alerta sonoro e impressão de pedidos",
  "Pix online, dinheiro e cartão na entrega",
  "Programa de fidelidade e cupons de desconto",
  "Taxa de entrega por bairro e retirada no local",
  "Suporte pelo WhatsApp",
];

const STATUS_TEXTO: Record<string, string> = {
  trial: "Teste grátis",
  ativa: "Ativo",
  inadimplente: "Pagamento pendente",
  cancelada: "Renovação cancelada",
  expirada: "Vencido",
};

async function tokenizarCartao(dados: {
  numero: string;
  nome: string;
  mes: string;
  ano: string;
  cvv: string;
}) {
  const chave = process.env.NEXT_PUBLIC_PAGARME_PUBLIC_KEY;
  if (!chave) throw new Error("Pagamento por cartão indisponível no momento.");

  const resposta = await fetch(`https://api.pagar.me/core/v5/tokens?appId=${chave}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "card",
      card: {
        number: dados.numero.replace(/\D/g, ""),
        holder_name: dados.nome.trim(),
        exp_month: Number(dados.mes),
        exp_year: Number(dados.ano.length === 2 ? `20${dados.ano}` : dados.ano),
        cvv: dados.cvv,
      },
    }),
  });

  const json = await resposta.json().catch(() => ({}));

  if (!resposta.ok || !json?.id) {
    throw new Error("Confira os dados do cartão.");
  }

  return { token: json.id as string, bandeira: json?.card?.brand as string | undefined };
}

function formatarCep(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export default function PlanoPage() {
  const [assinatura, setAssinatura] = useState<EstadoAssinatura | null>(null);
  const [carregando, setCarregando] = useState(true);
  // Plano único: mensal.
  const plano: PlanoId = "mensal";
  const [metodo, setMetodo] = useState<"cartao" | "pix">("cartao");

  const [documento, setDocumento] = useState("");
  const [nome, setNome] = useState("");
  const [numero, setNumero] = useState("");
  const [validade, setValidade] = useState("");
  const [cvv, setCvv] = useState("");
  // Endereço de cobrança do cartão (a Pagar.me exige)
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numeroEnd, setNumeroEnd] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [pix, setPix] = useState<{ qrCode: string; expiresAt?: string } | null>(null);
  // Esperando a confirmação do Pix (só na aba Pix) ou da 1ª cobrança no cartão.
  const [aguardando, setAguardando] = useState(false);
  const [aguardandoCartao, setAguardandoCartao] = useState(false);

  const ultimoEstado = useRef("");

  const carregar = useCallback(async () => {
    const resposta = await apiFetch("/api/assinatura");
    const dados = await resposta.json();

    if (dados.success) {
      // Pagamento confirmado na conferência com a Pagar.me: atualiza a faixa do topo também.
      const chave = `${dados.assinatura?.status}|${dados.assinatura?.acessoAte}`;
      if (ultimoEstado.current && ultimoEstado.current !== chave) {
        window.dispatchEvent(new Event("assinatura-atualizada"));
      }
      ultimoEstado.current = chave;
      setAssinatura(dados.assinatura);
      setDocumento((d) => d || formatarCpfCnpj(dados.documentoSugerido || ""));
      setNome((n) => n || dados.nomeSugerido || "");
      const e = dados.enderecoSugerido;
      if (e) {
        setCep((v) => v || formatarCep(e.cep || ""));
        setRua((v) => v || e.rua || "");
        setNumeroEnd((v) => v || e.numero || "");
        setBairro((v) => v || e.bairro || "");
        setCidade((v) => v || e.cidade || "");
        setUf((v) => v || e.uf || "");
      }
    }

    setCarregando(false);
    return dados.assinatura as EstadoAssinatura | undefined;
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Depois de pagar, confere a cada 5 s até o plano ficar ativo.
  const esperando = aguardando || aguardandoCartao;

  useEffect(() => {
    if (!esperando) return;

    const acessoAntes = assinatura?.acessoAte;
    let tentativas = 0;

    const intervalo = setInterval(async () => {
      tentativas += 1;
      const nova = await carregar();

      if (nova && nova.status === "ativa" && nova.acessoAte !== acessoAntes) {
        clearInterval(intervalo);
        setAguardando(false);
        setAguardandoCartao(false);
        setPix(null);
        toast.success("Pagamento confirmado! Seu plano está ativo.");
        window.dispatchEvent(new Event("assinatura-atualizada"));
      }

      // Cartão: até 2 minutos. Pix: até 10 minutos (o QR continua valendo 24 h).
      if (tentativas > (aguardandoCartao ? 24 : 120)) {
        clearInterval(intervalo);
        if (aguardandoCartao) {
          toast.info("O banco ainda está confirmando a cobrança. Assim que aprovar, seu plano fica ativo sozinho.");
        }
        setAguardando(false);
        setAguardandoCartao(false);
      }
    }, 5000);

    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esperando]);

  async function buscarCep(valor: string) {
    try {
      const r = await fetch(`https://viacep.com.br/ws/${valor.replace(/\D/g, "")}/json/`);
      const d = await r.json();
      if (d?.erro) return;
      if (d.logradouro) setRua(d.logradouro);
      if (d.bairro) setBairro(d.bairro);
      if (d.localidade) setCidade(d.localidade);
      if (d.uf) setUf(d.uf);
    } catch {}
  }

  async function assinarCartao() {
    if (!validarCpfOuCnpj(documento)) return toast.error("Informe um CPF ou CNPJ válido.");
    if (numero.replace(/\D/g, "").length < 13) return toast.error("Número do cartão incompleto.");
    if (!nome.trim()) return toast.error("Informe o nome impresso no cartão.");

    const [mes, ano] = validade.split("/");
    if (!mes || !ano || Number(mes) < 1 || Number(mes) > 12) return toast.error("Validade inválida (MM/AA).");
    if (cvv.length < 3) return toast.error("CVV inválido.");
    if (cep.replace(/\D/g, "").length !== 8 || !rua.trim() || !numeroEnd.trim() || !cidade.trim() || uf.length !== 2) {
      return toast.error("Preencha o endereço de cobrança do cartão.");
    }

    setEnviando(true);

    try {
      const { token, bandeira } = await tokenizarCartao({ numero, nome, mes, ano, cvv });

      const resposta = await apiFetch("/api/assinatura/cartao", {
        method: "POST",
        body: JSON.stringify({
          plano,
          cardToken: token,
          documento,
          nome,
          cartaoFinal: numero.replace(/\D/g, "").slice(-4),
          cartaoBandeira: bandeira,
          endereco: { cep, rua, numero: numeroEnd, bairro, cidade, uf },
        }),
      });

      const dados = await resposta.json();

      if (!dados.success) {
        toast.error(dados.error || "Não foi possível assinar.");
        return;
      }

      setNumero("");
      setCvv("");
      setValidade("");

      if (dados.cartaoTrocado) {
        toast.success("Cartão atualizado! As próximas cobranças vão para ele.");
        carregar();
        window.dispatchEvent(new Event("assinatura-atualizada"));
        return;
      }

      if (dados.paga) {
        await carregar();
        toast.success("Pagamento aprovado! Seu plano está ativo e renova sozinho todo mês.");
        window.dispatchEvent(new Event("assinatura-atualizada"));
        return;
      }

      toast.success("Cartão aceito! Aguardando o banco confirmar a cobrança…");
      setAguardandoCartao(true);
    } catch (e: any) {
      toast.error(e?.message || "Não foi possível processar o cartão.");
    } finally {
      setEnviando(false);
    }
  }

  async function gerarPix() {
    if (!validarCpfOuCnpj(documento)) return toast.error("Informe um CPF ou CNPJ válido.");

    setEnviando(true);

    try {
      const resposta = await apiFetch("/api/assinatura/pix", {
        method: "POST",
        body: JSON.stringify({ plano, documento, nome }),
      });
      const dados = await resposta.json();

      if (!dados.success || !dados.qrCode) {
        toast.error(dados.error || "Não foi possível gerar o Pix.");
        return;
      }

      setPix({ qrCode: dados.qrCode, expiresAt: dados.expiresAt });
      setAguardando(true);
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-[#6D1F2F]" />
      </div>
    );
  }

  const dataAcesso = assinatura ? new Date(assinatura.acessoAte).toLocaleDateString("pt-BR") : "";
  const recorrenteAtiva = assinatura?.metodo === "cartao" && assinatura.status === "ativa";
  // Já paga no cartão: a tela vira "trocar cartão" (não cobra de novo).
  const temRecorrencia =
    assinatura?.metodo === "cartao" && (assinatura.status === "ativa" || assinatura.status === "inadimplente");
  const metodoEfetivo: "cartao" | "pix" = temRecorrencia && assinatura?.status === "ativa" ? "cartao" : metodo;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-black text-zinc-900">Meu plano</h1>

      {assinatura && (
        <div
          className={`mt-4 rounded-2xl p-5 border ${
            assinatura.ativo ? "bg-white border-zinc-200" : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-zinc-500">Situação</p>
              <p className="text-xl font-black text-zinc-900">
                {STATUS_TEXTO[assinatura.status] ?? assinatura.status}
                {assinatura.plano ? ` · ${PLANOS[assinatura.plano].nome}` : ""}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-zinc-500">
                {assinatura.ativo ? "Cardápio no ar até" : "Cardápio fora do ar desde"}
              </p>
              <p className="font-bold">{dataAcesso}</p>
            </div>
          </div>

          {assinatura.status === "trial" && (
            <p className="mt-3 text-sm text-zinc-600">
              Faltam {assinatura.diasRestantes} {assinatura.diasRestantes === 1 ? "dia" : "dias"} de teste grátis.
              Assine agora sem perder nada: <strong>os dias de teste que sobram são somados ao seu plano</strong>.
            </p>
          )}

          {!assinatura.ativo && (
            <p className="mt-3 text-sm font-semibold text-red-700">
              Seu cardápio está fora do ar e não recebe pedidos. Renove seu plano abaixo: assim que o pagamento
              for confirmado, tudo volta na hora.
            </p>
          )}

          {assinatura.status === "inadimplente" && assinatura.ativo && (
            <p className="mt-3 text-sm font-semibold text-amber-700">
              Não conseguimos cobrar seu cartão. Atualize o cartão abaixo ou pague no Pix até {dataAcesso} para
              seu cardápio não sair do ar.
            </p>
          )}

          {assinatura.status === "cancelada" && assinatura.ativo && (
            <p className="mt-3 text-sm text-zinc-600">
              Plano cancelado: não haverá novas cobranças. Seu cardápio continua no ar até {dataAcesso}. Para voltar,
              é só assinar de novo abaixo (os dias que sobram são somados).
            </p>
          )}

          {recorrenteAtiva && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-600">
              <span>
                Cobrança automática no cartão
                {assinatura.cartaoFinal ? ` final ${assinatura.cartaoFinal}` : ""}.
              </span>
              <a href="/admin/configuracoes#cancelar-plano" className="text-zinc-500 font-semibold underline">
                Cancelar plano
              </a>
            </div>
          )}
        </div>
      )}

      {/* Plano */}
      {temRecorrencia && (
        <p className="mt-6 rounded-2xl bg-zinc-100 p-4 text-sm text-zinc-700">
          Você já tem cobrança automática no cartão. Para trocar o cartão, preencha os dados do novo cartão
          abaixo (não há cobrança extra).
        </p>
      )}
      {!temRecorrencia && (
        <div className="mt-6 rounded-2xl border-2 border-[#6D1F2F] bg-white p-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-bold text-zinc-900">{PLANOS.mensal.nome}</p>
            <p className="mt-1">
              <span className="text-3xl font-black text-zinc-900">{formatarReais(PLANOS.mensal.preco)}</span>
              <span className="text-zinc-500">/mês</span>
            </p>
          </div>
          <p className="text-sm text-zinc-500">Tudo incluído · sem fidelidade · cancele quando quiser</p>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Pagamento */}
        <div className="rounded-2xl bg-white border p-5">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMetodo("cartao")}
              className={`h-12 rounded-xl border-2 font-semibold flex items-center justify-center gap-2 ${
                metodoEfetivo === "cartao" ? "border-[#6D1F2F] text-[#6D1F2F]" : "border-zinc-200"
              }`}
            >
              <CreditCard size={18} /> Cartão
            </button>
            <button
              onClick={() => setMetodo("pix")}
              hidden={temRecorrencia && assinatura?.status === "ativa"}
              className={`h-12 rounded-xl border-2 font-semibold flex items-center justify-center gap-2 ${
                metodoEfetivo === "pix" ? "border-[#6D1F2F] text-[#6D1F2F]" : "border-zinc-200"
              }`}
            >
              <FaPix size={16} /> Pix
            </button>
          </div>

          <p className="mt-3 text-xs text-zinc-500">
            {metodoEfetivo === "cartao"
              ? "Cobrança automática todo mês no cartão. Cancele quando quiser em Minha conta."
              : "Paga 1 mês. Para o mês seguinte, gere outro Pix (avisamos antes de vencer)."}
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-zinc-600">CPF ou CNPJ do responsável</label>
              <input
                value={documento}
                onChange={(e) => setDocumento(formatarCpfCnpj(e.target.value))}
                inputMode="numeric"
                className="mt-1 w-full h-12 rounded-xl border px-3 text-base"
              />
            </div>

            {metodoEfetivo === "cartao" && !pix && (
              <>
                <div>
                  <label className="text-xs font-semibold text-zinc-600">Número do cartão</label>
                  <input
                    value={numero}
                    onChange={(e) =>
                      setNumero(
                        e.target.value.replace(/\D/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ")
                      )
                    }
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="0000 0000 0000 0000"
                    className="mt-1 w-full h-12 rounded-xl border px-3 text-base tracking-wider"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-600">Nome impresso no cartão</label>
                  <input
                    value={nome}
                    onChange={(e) => setNome(e.target.value.toUpperCase())}
                    autoComplete="cc-name"
                    className="mt-1 w-full h-12 rounded-xl border px-3 text-base"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-600">Validade</label>
                    <input
                      value={validade}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                        if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2)}`;
                        setValidade(v);
                      }}
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      placeholder="MM/AA"
                      className="mt-1 w-full h-12 rounded-xl border px-3 text-base"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-600">CVV</label>
                    <input
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      placeholder="123"
                      className="mt-1 w-full h-12 rounded-xl border px-3 text-base"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-sm font-bold text-zinc-800">Endereço de cobrança do cartão</p>
                  <p className="text-xs text-zinc-500">Preenchemos com o endereço do restaurante. Confira se é o mesmo da fatura do cartão.</p>
                  <div className="mt-2 grid grid-cols-[1fr_6rem] gap-3">
                    <input
                      value={cep}
                      onChange={(e) => {
                        const v = formatarCep(e.target.value);
                        setCep(v);
                        if (v.replace(/\D/g, "").length === 8) buscarCep(v);
                      }}
                      inputMode="numeric"
                      autoComplete="postal-code"
                      placeholder="CEP"
                      className="w-full h-12 rounded-xl border px-3 text-base"
                    />
                    <input
                      value={numeroEnd}
                      onChange={(e) => setNumeroEnd(e.target.value.slice(0, 15))}
                      placeholder="Nº"
                      className="w-full h-12 rounded-xl border px-3 text-base"
                    />
                  </div>
                  <input
                    value={rua}
                    onChange={(e) => setRua(e.target.value.slice(0, 100))}
                    autoComplete="address-line1"
                    placeholder="Rua"
                    className="mt-3 w-full h-12 rounded-xl border px-3 text-base"
                  />
                  <div className="mt-3 grid grid-cols-[1fr_1fr_4.5rem] gap-3">
                    <input
                      value={bairro}
                      onChange={(e) => setBairro(e.target.value.slice(0, 60))}
                      placeholder="Bairro"
                      className="w-full h-12 rounded-xl border px-3 text-base"
                    />
                    <input
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value.slice(0, 60))}
                      autoComplete="address-level2"
                      placeholder="Cidade"
                      className="w-full h-12 rounded-xl border px-3 text-base"
                    />
                    <input
                      value={uf}
                      onChange={(e) => setUf(e.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase())}
                      placeholder="UF"
                      className="w-full h-12 rounded-xl border px-3 text-base uppercase"
                    />
                  </div>
                </div>
              </>
            )}

            {metodoEfetivo === "pix" && pix && (
              <div className="rounded-2xl border p-4 text-center">
                <p className="font-semibold">Escaneie o QR Code no app do banco</p>
                <div className="flex justify-center my-4">
                  <QRCodeCanvas value={pix.qrCode} size={200} />
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(pix.qrCode);
                    toast.success("Código Pix copiado!");
                  }}
                  className="w-full h-12 rounded-xl bg-zinc-900 text-white font-semibold flex items-center justify-center gap-2"
                >
                  <Copy size={16} /> Copiar Pix copia e cola
                </button>
                <p className="mt-3 text-sm text-zinc-500 flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Aguardando pagamento…
                </p>
              </div>
            )}
          </div>

          {!(metodoEfetivo === "pix" && pix) && (
            <button
              disabled={enviando || (metodoEfetivo === "cartao" ? aguardandoCartao : aguardando)}
              onClick={metodoEfetivo === "cartao" ? assinarCartao : gerarPix}
              className="mt-5 w-full h-14 rounded-xl bg-[#6D1F2F] text-white font-bold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {enviando || (metodoEfetivo === "cartao" ? aguardandoCartao : aguardando) ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {enviando ? "Processando…" : "Confirmando pagamento…"}
                </>
              ) : metodoEfetivo === "cartao" && temRecorrencia ? (
                "Salvar novo cartão"
              ) : metodoEfetivo === "cartao" ? (
                `Assinar por ${formatarReais(PLANOS[plano].preco)}/mês`
              ) : (
                `Gerar Pix de ${formatarReais(PLANOS[plano].preco)}`
              )}
            </button>
          )}

          <p className="mt-3 text-xs text-zinc-500 flex items-center gap-1.5">
            <ShieldCheck size={14} /> Pagamento processado pela Pagar.me. Não guardamos os dados do cartão.
          </p>
        </div>

        {/* O que está incluído */}
        <div className="rounded-2xl bg-white border p-5 h-fit">
          <p className="font-bold">Tudo incluído</p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-700">
            {INCLUIDO.map((item) => (
              <li key={item} className="flex gap-2">
                <Check size={16} className="text-green-600 shrink-0 mt-0.5" /> {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-zinc-500">
            Sem taxa por pedido. {TAXA_PIX_ONLINE_TEXTO}, para cobrir o Pix automático.
          </p>
        </div>
      </div>

    </div>
  );
}
