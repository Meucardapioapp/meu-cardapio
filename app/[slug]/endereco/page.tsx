"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buscarCardapio, cardapioGuardado } from "@/lib/cardapio-cliente";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, LocateFixed, Loader2, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRestaurant } from "@/contexts/RestaurantContext";
import { agoraNoFuso, statusDaLoja } from "@/lib/horario";
import { paraUF } from "@/lib/uf";
import { reais, semAcento } from "@/lib/dinheiro";
import { formatarTelefone, telefoneValido } from "@/lib/validacoes";
import { lerCarrinho, quantidadeCarrinho, totalCarrinho } from "@/lib/carrinho";

type Erros = Partial<Record<"nome" | "whatsapp" | "bairro" | "rua" | "numero" | "geral", string>>;
type Frete = { estado: "vazio" | "calculando" | "ok" | "fora" | "erro"; valor?: number; km?: number | null; mensagem?: string };

function Campo({
  id,
  rotulo,
  erro,
  children,
  dica,
}: {
  id: string;
  rotulo: string;
  erro?: string;
  dica?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-semibold text-zinc-600">
        {rotulo}
      </label>
      <div className="mt-1">{children}</div>
      {erro ? <p className="mt-1 text-xs text-red-600">{erro}</p> : dica ? <p className="mt-1 text-xs text-zinc-400">{dica}</p> : null}
    </div>
  );
}

const estiloInput = (erro?: string) =>
  `h-12 w-full rounded-xl border px-4 text-base outline-none transition focus:border-zinc-500 ${erro ? "border-red-400 bg-red-50" : "border-zinc-200 bg-white"}`;

export default function EnderecoPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { logo, corPrincipal } = useRestaurant();

  const [carrinho, setCarrinho] = useState<any[]>([]);
  const [dados, setDados] = useState<any>(null);
  const [bairros, setBairros] = useState<{ bairro: string; valor: number }[]>([]);
  const [modoFrete, setModoFrete] = useState<"bairro" | "km">("bairro");
  const [enderecosSalvos, setEnderecosSalvos] = useState<any[]>([]);

  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cpf, setCpf] = useState("");
  const [bairro, setBairro] = useState("");
  const [buscaBairro, setBuscaBairro] = useState("");
  const [listaBairroAberta, setListaBairroAberta] = useState(false);
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [referencia, setReferencia] = useState("");
  const [cep, setCep] = useState("");

  const [frete, setFrete] = useState<Frete>({ estado: "vazio" });
  const enderecoLocal = useRef(false);
  const [erros, setErros] = useState<Erros>({});
  const restauranteId = dados?.restaurante?.id ? String(dados.restaurante.id) : "";

  // ---------- carregar ----------
  useEffect(() => {
    setCarrinho(lerCarrinho(slug));

    try {
      const salvo = JSON.parse(localStorage.getItem(`endereco-${slug}`) || "{}");
      if (salvo?.nome) setNome(salvo.nome);
      if (salvo?.whatsapp) setWhatsapp(formatarTelefone(salvo.whatsapp));
      if (salvo?.cpf) setCpf(salvo.cpf);
      if (salvo?.bairro) {
        setBairro(salvo.bairro);
        setBuscaBairro(salvo.bairro);
      }
      if (salvo?.rua) {
        setRua(salvo.rua);
        enderecoLocal.current = true;
      }
      if (salvo?.numero) setNumero(salvo.numero);
      if (salvo?.complemento) setComplemento(salvo.complemento);
      if (salvo?.referencia) setReferencia(salvo.referencia);
      if (salvo?.cep) setCep(salvo.cep);
    } catch {}

    (async () => {
      const guardado = cardapioGuardado(slug);
      if (guardado) setDados(guardado);
      const cardapio = guardado ?? (await buscarCardapio(slug));
      if (!cardapio) return;
      if (!guardado) setDados(cardapio);
      else buscarCardapio(slug).then((novo) => novo && setDados(novo));
      const id = String(cardapio.restaurante.id);
      const [{ data: lista }, config] = await Promise.all([
        supabase.from("bairros_entrega").select("bairro, valor").eq("restaurante_id", id).order("bairro"),
        fetch(`/api/calcular-frete?restauranteId=${encodeURIComponent(id)}`)
          .then((r) => r.json())
          .catch(() => null),
      ]);
      if (config?.modo === "km") setModoFrete("km");
      setBairros((lista ?? []).map((b: any) => ({ bairro: String(b.bairro), valor: Number(b.valor || 0) })));
    })();

    let token = "";
    try {
      token = localStorage.getItem(`cliente_token-${slug}`) || "";
    } catch {}
    if (token) {
      fetch("/api/cliente/me", { headers: { "x-cliente-token": token } })
        .then((r) => r.json())
        .then((r) => {
          if (!r?.success) return;
          setNome((v) => v || r.cliente?.nome || "");
          setWhatsapp((v) => v || formatarTelefone(r.cliente?.telefone || ""));
          setCpf((v) => v || r.cliente?.cpf || "");
          const lista = r.enderecos ?? [];
          setEnderecosSalvos(lista);
          // Primeiro pedido nesta visita: usa o último endereço salvo.
          if (!enderecoLocal.current && lista[0]) usarEndereco(lista[0]);
        })
        .catch(() => {});
    }
    router.prefetch(`/${slug}/pagamento`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  function usarEndereco(e: any) {
    setRua(e.rua || "");
    setNumero(e.numero || "");
    setComplemento(e.complemento || "");
    setReferencia(e.referencia || "");
    setBairro(e.bairro || "");
    setBuscaBairro(e.bairro || "");
    setErros({});
  }

  // ---------- usar minha localização ----------
  const [localizando, setLocalizando] = useState(false);
  const [avisoLocal, setAvisoLocal] = useState("");
  function usarLocalizacao() {
    setAvisoLocal("");
    if (!navigator.geolocation) return setAvisoLocal("Este celular não informa a localização. Digite o endereço.");
    setLocalizando(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const r = await fetch("/api/localizacao", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
          });
          const d = await r.json();
          if (!d?.success) return setAvisoLocal(d?.error || "Não achamos seu endereço. Digite abaixo.");
          const e = d.endereco;
          if (e.rua) setRua(e.rua);
          if (e.numero) setNumero(e.numero);
          if (e.cep) setCep(String(e.cep).replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2"));
          if (e.bairro) {
            if (modoFrete === "bairro") {
              const achado = bairros.find((b) => semAcento(b.bairro).trim() === semAcento(e.bairro).trim());
              setBuscaBairro(achado ? achado.bairro : e.bairro);
              setBairro(achado ? achado.bairro : "");
              if (!achado) setListaBairroAberta(true);
            } else setBairro(e.bairro);
          }
          setErros({});
          setAvisoLocal(e.numero ? "Confira o endereço antes de continuar." : "Confira a rua e digite o número.");
          if (!e.numero) setTimeout(() => document.getElementById("campo-numero")?.focus(), 50);
        } catch {
          setAvisoLocal("Sem conexão. Digite o endereço.");
        } finally {
          setLocalizando(false);
        }
      },
      () => {
        setLocalizando(false);
        setAvisoLocal("Não conseguimos sua localização. Digite o endereço.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }

  // ---------- frete ----------
  // Por bairro: a taxa já está na lista, aparece na hora.
  useEffect(() => {
    if (modoFrete !== "bairro") return;
    if (!bairro) return setFrete({ estado: "vazio" });
    const achado =
      bairros.find((b) => b.bairro === bairro) || bairros.find((b) => semAcento(b.bairro).trim() === semAcento(bairro).trim());
    if (achado && achado.bairro !== bairro) {
      setBairro(achado.bairro);
      setBuscaBairro(achado.bairro);
      return;
    }
    if (achado) setFrete({ estado: "ok", valor: achado.valor });
    else if (bairros.length) setFrete({ estado: "fora", mensagem: "Não entregamos neste bairro." });
  }, [modoFrete, bairro, bairros]);

  // Por distância: calcula sozinho quando rua, número e bairro estão preenchidos.
  const ultimaConsulta = useRef("");
  useEffect(() => {
    if (modoFrete !== "km" || !restauranteId) return;
    const chave = [rua.trim(), numero.trim(), bairro.trim(), cep.replace(/\D/g, "")].join("|");
    if (rua.trim().length < 3 || !numero.trim() || bairro.trim().length < 2) {
      ultimaConsulta.current = "";
      return setFrete({ estado: "vazio" });
    }
    if (chave === ultimaConsulta.current) return;
    const t = setTimeout(async () => {
      ultimaConsulta.current = chave;
      setFrete({ estado: "calculando" });
      try {
        const r = await fetch("/api/calcular-frete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ restauranteId, bairro, rua, numero, cep }),
        });
        const d = await r.json();
        if (ultimaConsulta.current !== chave) return;
        if (r.ok && d?.faixaFrete) setFrete({ estado: "ok", valor: Number(d.faixaFrete.valor), km: d.faixaFrete.distanciaKm ?? null });
        else if (d?.foraDaArea) setFrete({ estado: "fora", mensagem: d.erro || "Endereço fora da área de entrega." });
        else setFrete({ estado: "erro", mensagem: d?.erro || d?.error || "Não achamos esse endereço. Confira a rua e o número." });
      } catch {
        setFrete({ estado: "erro", mensagem: "Sem conexão. Tente de novo." });
        ultimaConsulta.current = "";
      }
    }, 900);
    return () => clearTimeout(t);
  }, [modoFrete, restauranteId, rua, numero, bairro, cep]);

  const bairrosFiltrados = useMemo(() => {
    const t = semAcento(buscaBairro.trim());
    return t ? bairros.filter((b) => semAcento(b.bairro).includes(t)) : bairros;
  }, [buscaBairro, bairros]);

  // ---------- loja ----------
  const restaurante = dados?.restaurante;
  const uf = restaurante?.uf || paraUF(restaurante?.estado);
  const status = dados?.aparencia ? statusDaLoja(dados.aparencia, agoraNoFuso(uf)) : null;
  const pausado = dados ? dados.pedidosAtivos === false : false;
  const lojaAberta = !pausado && (status ? status.aberta : true);

  const subtotal = totalCarrinho(carrinho);
  const taxa = frete.estado === "ok" ? Number(frete.valor || 0) : 0;

  function continuar() {
    const e: Erros = {};
    if (nome.trim().length < 2) e.nome = "Digite seu nome";
    if (!telefoneValido(whatsapp)) e.whatsapp = "Digite um WhatsApp com DDD";
    if (!bairro.trim()) e.bairro = modoFrete === "bairro" ? "Escolha seu bairro na lista" : "Digite seu bairro";
    if (rua.trim().length < 3) e.rua = "Digite a rua";
    if (!numero.trim()) e.numero = "Digite o número (ou S/N)";
    if (!lojaAberta) e.geral = pausado ? "O restaurante pausou os pedidos online agora." : status?.texto || "Restaurante fechado agora.";
    else if (frete.estado === "fora") e.geral = frete.mensagem || "Endereço fora da área de entrega.";
    else if (frete.estado === "calculando") e.geral = "Calculando a entrega, só um instante...";
    else if (frete.estado !== "ok" && !e.bairro && !e.rua && !e.numero) e.geral = frete.mensagem || "Não conseguimos calcular a entrega para este endereço.";

    setErros(e);
    const primeiro = (["nome", "whatsapp", "bairro", "rua", "numero"] as const).find((k) => e[k]);
    if (primeiro) {
      document.getElementById(`campo-${primeiro}`)?.focus();
      return;
    }
    if (e.geral) return;

    try {
      localStorage.setItem(
        `endereco-${slug}`,
        JSON.stringify({
          nome: nome.trim(),
          whatsapp,
          cpf,
          rua: rua.trim(),
          numero: numero.trim(),
          complemento: complemento.trim(),
          referencia: referencia.trim(),
          bairro: bairro.trim(),
          cep,
          taxaEntrega: taxa,
          subtotal,
          total: subtotal + taxa,
        })
      );
      localStorage.setItem("tipoPedido", "entrega");
    } catch {}
    router.push(`/${slug}/pagamento`);
  }

  return (
    <main className="min-h-screen bg-zinc-50 pb-44 text-zinc-900">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-xl items-center gap-3 px-3">
          <button
            type="button"
            onClick={() => router.push(`/${slug}/carrinho`)}
            aria-label="Voltar ao carrinho"
            className="flex h-10 w-10 items-center justify-center rounded-full active:bg-zinc-100"
          >
            <ArrowLeft size={22} style={{ color: corPrincipal }} />
          </button>
          {logo && <img src={logo} alt="" className="h-8 w-8 rounded-full object-cover" />}
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold leading-tight">Entrega</p>
            <p className="text-xs text-zinc-500">Passo 2 de 3</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-xl space-y-4 px-3 pt-3">
        {status && !lojaAberta && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <strong>{pausado ? "Pedidos online pausados" : "Restaurante fechado agora"}</strong>
            {!pausado && status.proximaAbertura && <> · abre {status.proximaAbertura}</>}
          </div>
        )}

        <section className="space-y-3 rounded-3xl bg-white p-4">
          <p className="text-[15px] font-bold">Seus dados</p>
          <Campo id="campo-nome" rotulo="Nome" erro={erros.nome}>
            <input
              id="campo-nome"
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                setErros((x) => ({ ...x, nome: undefined }));
              }}
              autoComplete="name"
              placeholder="Seu nome"
              className={estiloInput(erros.nome)}
            />
          </Campo>
          <Campo id="campo-whatsapp" rotulo="WhatsApp" erro={erros.whatsapp} dica="O restaurante avisa por aqui sobre o pedido.">
            <input
              id="campo-whatsapp"
              value={whatsapp}
              onChange={(e) => {
                setWhatsapp(formatarTelefone(e.target.value));
                setErros((x) => ({ ...x, whatsapp: undefined }));
              }}
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="(00) 00000-0000"
              className={estiloInput(erros.whatsapp)}
            />
          </Campo>
        </section>

        <section className="space-y-3 rounded-3xl bg-white p-4">
          <p className="text-[15px] font-bold">Endereço de entrega</p>

          <button
            type="button"
            onClick={usarLocalizacao}
            disabled={localizando}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition active:scale-[0.99] disabled:opacity-60"
            style={{ borderColor: `${corPrincipal}55`, color: corPrincipal, backgroundColor: `${corPrincipal}0A` }}
          >
            {localizando ? <Loader2 size={17} className="animate-spin" /> : <LocateFixed size={17} />}
            {localizando ? "Buscando seu endereço..." : "Usar minha localização"}
          </button>
          {avisoLocal && <p className="-mt-1 text-xs text-zinc-500">{avisoLocal}</p>}

          {enderecosSalvos.length > 1 && (
            <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {enderecosSalvos.slice(0, 5).map((e: any, i: number) => {
                const ativo = e.rua === rua && String(e.numero) === numero && e.bairro === bairro;
                return (
                  <button
                    key={e.id ?? i}
                    type="button"
                    onClick={() => usarEndereco(e)}
                    className="flex max-w-[220px] shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-left text-xs"
                    style={{ borderColor: ativo ? corPrincipal : "#E4E4E7", backgroundColor: ativo ? `${corPrincipal}0D` : "white" }}
                  >
                    <MapPin size={14} className="shrink-0" style={{ color: ativo ? corPrincipal : "#71717A" }} />
                    <span className="truncate">
                      {e.rua}, {e.numero} · {e.bairro}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {modoFrete === "bairro" ? (
            <Campo id="campo-bairro" rotulo="Bairro" erro={erros.bairro}>
              <div className="relative">
                <input
                  id="campo-bairro"
                  value={buscaBairro}
                  onChange={(e) => {
                    setBuscaBairro(e.target.value);
                    setBairro("");
                    setListaBairroAberta(true);
                    setErros((x) => ({ ...x, bairro: undefined }));
                  }}
                  onFocus={() => setListaBairroAberta(true)}
                  onBlur={() => setTimeout(() => setListaBairroAberta(false), 150)}
                  placeholder={bairros.length ? "Digite para procurar seu bairro" : "Carregando bairros..."}
                  autoComplete="off"
                  className={`${estiloInput(erros.bairro)} pr-10`}
                />
                {bairro && <Check size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600" />}
                {listaBairroAberta && !bairro && bairrosFiltrados.length > 0 && (
                  <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-xl">
                    {bairrosFiltrados.map((b) => (
                      <button
                        key={b.bairro}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setBairro(b.bairro);
                          setBuscaBairro(b.bairro);
                          setListaBairroAberta(false);
                          document.getElementById("campo-rua")?.focus();
                        }}
                        className="flex w-full items-center justify-between px-4 py-3 text-left text-[15px] active:bg-zinc-50"
                      >
                        <span>{b.bairro}</span>
                        <span className="text-sm text-zinc-500">{b.valor > 0 ? reais(b.valor) : "Grátis"}</span>
                      </button>
                    ))}
                  </div>
                )}
                {listaBairroAberta && !bairro && buscaBairro.trim() && bairrosFiltrados.length === 0 && bairros.length > 0 && (
                  <p className="mt-1 text-xs text-red-600">Não entregamos nesse bairro. Confira o nome ou escolha retirar no local.</p>
                )}
              </div>
            </Campo>
          ) : (
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <Campo id="campo-bairro" rotulo="Bairro" erro={erros.bairro}>
                <input
                  id="campo-bairro"
                  value={bairro}
                  onChange={(e) => {
                    setBairro(e.target.value);
                    setErros((x) => ({ ...x, bairro: undefined }));
                  }}
                  placeholder="Seu bairro"
                  className={estiloInput(erros.bairro)}
                />
              </Campo>
              <Campo id="campo-cep" rotulo="CEP (opcional)">
                <input
                  id="campo-cep"
                  value={cep}
                  onChange={(e) => setCep(e.target.value.replace(/\D/g, "").slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2"))}
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="00000-000"
                  className={estiloInput()}
                />
              </Campo>
            </div>
          )}

          <div className="grid grid-cols-[1fr_96px] gap-3">
            <Campo id="campo-rua" rotulo="Rua" erro={erros.rua}>
              <input
                id="campo-rua"
                value={rua}
                onChange={(e) => {
                  setRua(e.target.value);
                  setErros((x) => ({ ...x, rua: undefined }));
                }}
                autoComplete="address-line1"
                placeholder="Nome da rua"
                className={estiloInput(erros.rua)}
              />
            </Campo>
            <Campo id="campo-numero" rotulo="Número" erro={erros.numero}>
              <input
                id="campo-numero"
                value={numero}
                onChange={(e) => {
                  setNumero(e.target.value.slice(0, 10));
                  setErros((x) => ({ ...x, numero: undefined }));
                }}
                inputMode="text"
                placeholder="Nº"
                className={estiloInput(erros.numero)}
              />
            </Campo>
          </div>
          <Campo id="campo-complemento" rotulo="Complemento (opcional)">
            <input
              id="campo-complemento"
              value={complemento}
              onChange={(e) => setComplemento(e.target.value)}
              autoComplete="address-line2"
              placeholder="Apto, bloco, casa..."
              className={estiloInput()}
            />
          </Campo>
          <Campo id="campo-referencia" rotulo="Ponto de referência (opcional)">
            <input
              id="campo-referencia"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Perto do mercado, portão azul..."
              className={estiloInput()}
            />
          </Campo>

          {frete.estado !== "vazio" && (
            <div
              className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm ${
                frete.estado === "ok"
                  ? "bg-emerald-50 text-emerald-800"
                  : frete.estado === "calculando"
                    ? "bg-zinc-100 text-zinc-600"
                    : "bg-red-50 text-red-700"
              }`}
            >
              {frete.estado === "calculando" && <Loader2 size={16} className="animate-spin" />}
              {frete.estado === "ok" && <Check size={16} />}
              <span>
                {frete.estado === "calculando"
                  ? "Calculando a entrega..."
                  : frete.estado === "ok"
                    ? `Entregamos aqui · ${taxa > 0 ? reais(taxa) : "entrega grátis"}${frete.km ? ` (${String(frete.km).replace(".", ",")} km)` : ""}`
                    : frete.mensagem}
              </span>
            </div>
          )}
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto max-w-xl">
          <div className="mb-2 flex justify-between text-sm text-zinc-600">
            <span>
              {quantidadeCarrinho(carrinho)} {quantidadeCarrinho(carrinho) === 1 ? "item" : "itens"} {reais(subtotal)} + entrega{" "}
              {frete.estado === "ok" ? (taxa > 0 ? reais(taxa) : "grátis") : "—"}
            </span>
            <strong className="text-zinc-900">{reais(subtotal + taxa)}</strong>
          </div>
          {erros.geral && (
            <p role="alert" className="mb-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {erros.geral}
            </p>
          )}
          <button
            type="button"
            onClick={continuar}
            className="h-14 w-full rounded-2xl text-[15px] font-bold text-white shadow-lg transition active:scale-[0.99]"
            style={{ backgroundColor: frete.estado === "ok" && lojaAberta ? corPrincipal : "#A1A1AA" }}
          >
            Ir para o pagamento
          </button>
        </div>
      </div>
    </main>
  );
}
