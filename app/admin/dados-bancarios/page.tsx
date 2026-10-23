"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  CircleCheck,
  Eye,
  EyeOff,
  Info,
  Landmark,
  Loader2,
  Lock,
  Pencil,
  Search,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import { apiFetch } from "@/utils/apiFetch";
import { formatarCpfCnpj } from "@/lib/validacoes";
import {
  BANCOS,
  BANCOS_AGENCIA_SEM_DIGITO,
  type CampoConta,
  type ContaBancaria,
  nomeDoBanco,
  normalizarContaBancaria,
  validarContaBancaria,
} from "@/lib/bancos";

const COR = "#6D1F2F";
/** Os dados completos somem da tela sozinhos depois desse tempo. */
const TEMPO_VISIVEL_MS = 3 * 60 * 1000;

type Resumo = {
  cpfCnpj: string;
  banco: string;
  bancoNome: string;
  agencia: string;
  conta: string;
  tipoConta: "corrente" | "poupanca";
};

type Info = { temConta: boolean; pixOnline: boolean; cpfTravado: boolean; resumo: Resumo | null };
type ContaTela = ContaBancaria & { bancoNome: string };
type Modo = "resumo" | "editar" | "conferir";
type MotivoSenha = "ver" | "editar" | "salvar";

const VAZIA: ContaBancaria = {
  titular: "",
  cpfCnpj: "",
  banco: "",
  agencia: "",
  agenciaDigito: "",
  conta: "",
  contaDigito: "",
  tipoConta: "corrente",
};

const tipoTexto = (t: string) => (t === "poupanca" ? "Poupança" : "Corrente");

export default function DadosBancariosPage() {
  const [info, setInfo] = useState<Info | null>(null);
  const [erroCarregar, setErroCarregar] = useState("");
  const [modo, setModo] = useState<Modo>("resumo");
  const [revelado, setRevelado] = useState<ContaTela | null>(null);
  const [form, setForm] = useState<ContaBancaria>(VAZIA);
  const [erros, setErros] = useState<Partial<Record<CampoConta, string>>>({});
  const [modalSenha, setModalSenha] = useState<{ motivo: MotivoSenha; erro?: string } | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);

  // A senha fica só na memória desta tela, enquanto a pessoa altera os dados.
  const senhaRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function carregar() {
    setErroCarregar("");
    try {
      const r = await apiFetch("/api/painel/dados-bancarios");
      const d = await r.json().catch(() => null);
      if (!d?.success) {
        setErroCarregar(d?.error || "Não foi possível carregar os dados bancários.");
        return;
      }
      setInfo(d);
      if (!d.temConta) {
        setForm(VAZIA);
        setModo("editar");
      }
    } catch {
      setErroCarregar("Sem conexão. Tente de novo.");
    }
  }

  useEffect(() => {
    carregar();
    return () => {
      senhaRef.current = "";
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function esconderDados() {
    setRevelado(null);
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  function esquecerSenha() {
    senhaRef.current = "";
  }

  /** Confere a senha e busca os dados completos (para ver ou para alterar). */
  async function abrirComSenha(senha: string, motivo: MotivoSenha) {
    const r = await apiFetch("/api/painel/dados-bancarios", {
      method: "POST",
      body: JSON.stringify({ senha }),
    });
    const d = await r.json().catch(() => null);
    if (!d?.success) {
      setModalSenha({ motivo, erro: d?.error || "Não foi possível confirmar a senha." });
      return;
    }

    setModalSenha(null);
    const conta: ContaTela | null = d.conta;
    if (d.cpfTravado !== undefined) setInfo((i) => (i ? { ...i, cpfTravado: Boolean(d.cpfTravado) } : i));

    if (motivo === "ver") {
      setRevelado(conta);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setRevelado(null), TEMPO_VISIVEL_MS);
      return;
    }

    // Alterar: guarda a senha para salvar sem pedir de novo.
    senhaRef.current = senha;
    esconderDados();
    setForm(conta ? { ...VAZIA, ...conta } : VAZIA);
    setErros({});
    setAviso(null);
    setModo("editar");
  }

  async function confirmarSenha(senha: string) {
    if (!modalSenha) return;
    const motivo = modalSenha.motivo;
    if (!senha) {
      setModalSenha({ motivo, erro: "Digite sua senha." });
      return;
    }
    try {
      if (motivo === "salvar") {
        senhaRef.current = senha;
        setModalSenha(null);
        await salvar();
        return;
      }
      await abrirComSenha(senha, motivo);
    } catch {
      setModalSenha({ motivo, erro: "Sem conexão. Tente de novo." });
    }
  }

  function continuar() {
    const normal = normalizarContaBancaria(form);
    const e = validarContaBancaria(normal);
    setErros(e);
    if (Object.keys(e).length) return;
    setForm(normal);
    setModo("conferir");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function salvar() {
    if (!senhaRef.current) {
      setModalSenha({ motivo: "salvar" });
      return;
    }

    setSalvando(true);
    setAviso(null);
    try {
      const r = await apiFetch("/api/pagarme/criar-recebedor", {
        method: "POST",
        body: JSON.stringify({ ...normalizarContaBancaria(form), senha: senhaRef.current }),
      });
      const d = await r.json().catch(() => null);

      if (!d?.success) {
        if (d?.campo === "senha") {
          esquecerSenha();
          setModalSenha({ motivo: "salvar", erro: d.error });
          return;
        }
        if (d?.campo) {
          setErros({ [d.campo]: d.error });
          setModo("editar");
        }
        setAviso({ ok: false, texto: d?.error || "Não foi possível salvar. Tente de novo." });
        return;
      }

      esquecerSenha();
      setAviso({
        ok: true,
        texto: d.contaMudou
          ? "Pronto! Sua conta foi atualizada aqui e na Pagar.me. Por segurança, os saques ficam liberados 24 horas depois da troca de conta."
          : "Pronto! Seus dados foram atualizados aqui e na Pagar.me.",
      });
      setModo("resumo");
      await carregar();
      window.dispatchEvent(new Event("dados-bancarios-atualizados"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setAviso({ ok: false, texto: "Sem conexão. Tente de novo." });
    } finally {
      setSalvando(false);
    }
  }

  function cancelarEdicao() {
    esquecerSenha();
    setErros({});
    setModo("resumo");
  }

  if (erroCarregar) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-4xl font-black">Dados Bancários</h1>
        <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{erroCarregar}</p>
        <button type="button" onClick={carregar} className="mt-4 rounded-xl px-5 py-3 font-bold text-white" style={{ backgroundColor: COR }}>
          Tentar de novo
        </button>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="flex max-w-3xl items-center gap-2 text-zinc-500">
        <Loader2 className="animate-spin" size={20} /> Carregando...
      </div>
    );
  }

  return (
    <div className="max-w-3xl pb-10">
      <h1 className="text-4xl font-black">Dados Bancários</h1>
      <p className="mt-2 text-zinc-500">A conta onde você recebe as vendas pagas no Pix online.</p>

      {!info.temConta && (
        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
          Opcional. Você já pode vender com dinheiro e cartão na entrega sem preencher isto. Os dados bancários servem para ativar o{" "}
          <strong>Pix online automático</strong>: o cliente paga no cardápio e o valor cai na sua conta (taxa de 2,5% por Pix recebido).
        </div>
      )}

      {aviso && (
        <div
          className={`mt-4 flex items-start gap-2 rounded-2xl border p-4 text-sm ${
            aviso.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {aviso.ok ? <CircleCheck size={18} className="mt-0.5 shrink-0" /> : <TriangleAlert size={18} className="mt-0.5 shrink-0" />}
          <p>{aviso.texto}</p>
        </div>
      )}

      {modo === "resumo" && info.temConta && info.resumo && (
        <CartaoResumo
          info={info}
          revelado={revelado}
          onVer={() => (revelado ? esconderDados() : setModalSenha({ motivo: "ver" }))}
          onAlterar={() => setModalSenha({ motivo: "editar" })}
        />
      )}

      {modo === "editar" && (
        <Formulario
          form={form}
          setForm={setForm}
          erros={erros}
          setErros={setErros}
          cpfTravado={info.cpfTravado && info.temConta}
          podeCancelar={info.temConta}
          onCancelar={cancelarEdicao}
          onContinuar={continuar}
        />
      )}

      {modo === "conferir" && (
        <Conferir
          form={form}
          contaNova={!info.temConta}
          salvando={salvando}
          onVoltar={() => setModo("editar")}
          onSalvar={salvar}
        />
      )}

      {modalSenha && (
        <ModalSenha
          motivo={modalSenha.motivo}
          erro={modalSenha.erro}
          onCancelar={() => setModalSenha(null)}
          onConfirmar={confirmarSenha}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <dt className="text-sm text-zinc-500">{rotulo}</dt>
      <dd className="text-right font-semibold text-zinc-900 [overflow-wrap:anywhere]">{valor || "—"}</dd>
    </div>
  );
}

function CartaoResumo({
  info,
  revelado,
  onVer,
  onAlterar,
}: {
  info: Info;
  revelado: ContaTela | null;
  onVer: () => void;
  onAlterar: () => void;
}) {
  const r = info.resumo!;
  const v = revelado;

  return (
    <div className="mt-6 rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F8F1F3]" style={{ color: COR }}>
          <Landmark size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-zinc-900">Conta que recebe suas vendas</p>
          <p className="text-sm text-zinc-500">{v ? v.bancoNome || `Banco ${v.banco}` : r.bancoNome || `Banco ${r.banco}`}</p>
        </div>
        {info.pixOnline ? (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">Pix online ativo</span>
        ) : (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">Pix online pendente</span>
        )}
      </div>

      <dl className="mt-4 divide-y divide-zinc-100 rounded-2xl border border-zinc-200 px-4">
        <Linha rotulo="Titular" valor={v ? v.titular : "••••••••"} />
        <Linha rotulo="CPF/CNPJ" valor={v ? formatarCpfCnpj(v.cpfCnpj) : r.cpfCnpj} />
        <Linha rotulo="Banco" valor={v ? `${v.banco} · ${v.bancoNome || "—"}` : `${r.banco} · ${r.bancoNome || "—"}`} />
        <Linha rotulo="Agência" valor={v ? `${v.agencia}${v.agenciaDigito ? `-${v.agenciaDigito}` : ""}` : r.agencia} />
        <Linha rotulo="Conta" valor={v ? `${v.conta}-${v.contaDigito}` : r.conta} />
        <Linha rotulo="Tipo" valor={tipoTexto(v ? v.tipoConta : r.tipoConta)} />
      </dl>

      {v && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
          <Info size={13} /> Estes são os dados que estão na Pagar.me. Eles somem da tela sozinhos em 3 minutos.
        </p>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onVer}
          className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-3 font-semibold text-zinc-800 hover:bg-zinc-50"
        >
          {v ? <EyeOff size={18} /> : <Eye size={18} />} {v ? "Esconder dados" : "Ver dados completos"}
        </button>
        <button
          type="button"
          onClick={onAlterar}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold text-white"
          style={{ backgroundColor: COR }}
        >
          <Pencil size={18} /> Alterar dados
        </button>
      </div>

      <p className="mt-4 flex items-start gap-2 text-xs text-zinc-500">
        <ShieldCheck size={15} className="mt-0.5 shrink-0" style={{ color: COR }} />
        Para ver ou alterar os dados completos, pedimos a sua senha. Assim ninguém troca a conta que recebe o seu dinheiro, nem com o celular desbloqueado.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Campo({
  rotulo,
  dica,
  erro,
  children,
  className = "",
}: {
  rotulo: string;
  dica?: React.ReactNode;
  erro?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-semibold text-zinc-800">{rotulo}</label>
      {children}
      {erro ? <p className="mt-1.5 text-xs font-semibold text-red-600">{erro}</p> : dica ? <p className="mt-1.5 text-xs text-zinc-500">{dica}</p> : null}
    </div>
  );
}

const entrada = (erro?: string, travado?: boolean) =>
  `w-full rounded-xl border px-4 py-3.5 text-base outline-none transition focus:border-[#6D1F2F] focus:ring-2 focus:ring-[#6D1F2F]/15 ${
    erro ? "border-red-400 bg-red-50/40" : "border-zinc-300"
  } ${travado ? "cursor-not-allowed bg-zinc-100 text-zinc-500" : "bg-white"}`;

function Formulario({
  form,
  setForm,
  erros,
  setErros,
  cpfTravado,
  podeCancelar,
  onCancelar,
  onContinuar,
}: {
  form: ContaBancaria;
  setForm: (f: ContaBancaria) => void;
  erros: Partial<Record<CampoConta, string>>;
  setErros: (e: Partial<Record<CampoConta, string>>) => void;
  cpfTravado: boolean;
  podeCancelar: boolean;
  onCancelar: () => void;
  onContinuar: () => void;
}) {
  const semDigitoAgencia = BANCOS_AGENCIA_SEM_DIGITO.has(form.banco);
  const nomeBanco = nomeDoBanco(form.banco);

  function mudar<K extends CampoConta>(campo: K, valor: ContaBancaria[K]) {
    setForm({ ...form, [campo]: valor });
    if (erros[campo]) setErros({ ...erros, [campo]: undefined });
  }

  function escolherBanco(codigo: string) {
    const digital = BANCOS_AGENCIA_SEM_DIGITO.has(codigo);
    setForm({
      ...form,
      banco: codigo,
      agencia: digital && !form.agencia ? "0001" : form.agencia,
      agenciaDigito: digital ? "" : form.agenciaDigito,
    });
    setErros({ ...erros, banco: undefined });
  }

  return (
    <div className="mt-6 rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
      <p className="text-lg font-black text-zinc-900">{podeCancelar ? "Alterar dados bancários" : "Cadastrar conta bancária"}</p>
      <p className="mt-1 text-sm text-zinc-500">Copie os dados do app do seu banco. Tudo o que você salvar aqui é atualizado na Pagar.me na hora.</p>

      <div className="mt-5 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <TriangleAlert size={18} className="mt-0.5 shrink-0" />
        <p>
          A conta precisa estar <strong>no nome e no CPF/CNPJ</strong> informados abaixo. Conta de outra pessoa ou <strong>conta salário</strong> não recebe a
          transferência, e o dinheiro volta.
        </p>
      </div>

      <div className="mt-5 space-y-5">
        <Campo rotulo="Nome completo do titular" erro={erros.titular} dica="Igual aparece no banco. Se a conta for de empresa, use a razão social.">
          <input
            value={form.titular}
            onChange={(e) => mudar("titular", e.target.value)}
            placeholder="Ex.: Maria Aparecida da Silva"
            autoComplete="name"
            maxLength={80}
            className={entrada(erros.titular)}
          />
        </Campo>

        <Campo
          rotulo="CPF ou CNPJ do titular"
          erro={erros.cpfCnpj}
          dica={
            cpfTravado ? (
              <span className="flex items-start gap-1">
                <Lock size={12} className="mt-0.5 shrink-0" /> Fica fixo porque o seu saldo na Pagar.me está ligado a ele. A conta nova precisa estar neste mesmo
                documento. Para trocar o titular, fale com o suporte.
              </span>
            ) : undefined
          }
        >
          <input
            value={formatarCpfCnpj(form.cpfCnpj)}
            onChange={(e) => mudar("cpfCnpj", e.target.value.replace(/\D/g, "").slice(0, 14))}
            placeholder="000.000.000-00"
            inputMode="numeric"
            readOnly={cpfTravado}
            className={entrada(erros.cpfCnpj, cpfTravado)}
          />
        </Campo>

        <Campo rotulo="Banco" erro={erros.banco}>
          <EscolherBanco valor={form.banco} erro={erros.banco} onEscolher={escolherBanco} />
        </Campo>

        <div className="grid grid-cols-[1fr_auto] gap-3">
          <Campo rotulo="Agência" erro={erros.agencia} dica={semDigitoAgencia ? `No ${nomeBanco} a agência é 0001 e não tem dígito.` : "Sem o dígito."}>
            <input
              value={form.agencia}
              onChange={(e) => mudar("agencia", e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="0001"
              inputMode="numeric"
              className={entrada(erros.agencia)}
            />
          </Campo>
          {!semDigitoAgencia && (
            <Campo rotulo="Dígito" erro={erros.agenciaDigito} dica="Se tiver" className="w-24">
              <input
                value={form.agenciaDigito}
                onChange={(e) => mudar("agenciaDigito", e.target.value.replace(/[^0-9xX]/g, "").slice(0, 1).toUpperCase())}
                placeholder="—"
                className={entrada(erros.agenciaDigito)}
              />
            </Campo>
          )}
        </div>

        <div>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <Campo rotulo="Número da conta" erro={erros.conta}>
              <input
                value={form.conta}
                onChange={(e) => mudar("conta", e.target.value.replace(/\D/g, "").slice(0, 13))}
                placeholder="12345678"
                inputMode="numeric"
                className={entrada(erros.conta)}
              />
            </Campo>
            <Campo rotulo="Dígito" erro={erros.contaDigito} className="w-24">
              <input
                value={form.contaDigito}
                onChange={(e) => mudar("contaDigito", e.target.value.replace(/[^0-9xX]/g, "").slice(0, 2).toUpperCase())}
                placeholder="9"
                className={entrada(erros.contaDigito)}
              />
            </Campo>
          </div>
          {!erros.conta && !erros.contaDigito && (
            <p className="mt-1.5 text-xs text-zinc-500">
              Ex.: se no app aparece <strong>12345678-9</strong>, a conta é 12345678 e o dígito é 9.
            </p>
          )}
        </div>

        <Campo rotulo="Tipo da conta">
          <div className="grid grid-cols-2 gap-2">
            {(["corrente", "poupanca"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => mudar("tipoConta", t)}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 font-semibold ${
                  form.tipoConta === t ? "border-[#6D1F2F] bg-[#F8F1F3] text-[#6D1F2F]" : "border-zinc-300 text-zinc-700"
                }`}
              >
                {form.tipoConta === t && <Check size={16} />} {t === "corrente" ? "Corrente" : "Poupança"}
              </button>
            ))}
          </div>
        </Campo>
      </div>

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        {podeCancelar && (
          <button type="button" onClick={onCancelar} className="rounded-xl border border-zinc-200 px-4 py-3.5 font-semibold text-zinc-700">
            Cancelar
          </button>
        )}
        <button
          type="button"
          onClick={onContinuar}
          className={`rounded-xl px-4 py-3.5 font-bold text-white ${podeCancelar ? "" : "sm:col-span-2"}`}
          style={{ backgroundColor: COR }}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

function EscolherBanco({ valor, erro, onEscolher }: { valor: string; erro?: string; onEscolher: (codigo: string) => void }) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const caixaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (caixaRef.current && !caixaRef.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [aberto]);

  const lista = useMemo(() => {
    const t = busca
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
    if (!t) return BANCOS;
    return BANCOS.filter((b) =>
      `${b.codigo} ${b.nome}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .includes(t)
    );
  }, [busca]);

  const nome = nomeDoBanco(valor);

  return (
    <div ref={caixaRef} className="relative">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        className={`${entrada(erro)} flex items-center justify-between text-left`}
      >
        <span className={valor ? "text-zinc-900" : "text-zinc-400"}>{valor ? `${valor} · ${nome || "Banco"}` : "Escolha o banco"}</span>
        <ChevronDown size={18} className="text-zinc-400" />
      </button>

      {aberto && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">
          <div className="flex items-center gap-2 border-b border-zinc-100 px-3">
            <Search size={16} className="text-zinc-400" />
            <input
              autoFocus
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar pelo nome ou código"
              className="h-11 min-w-0 flex-1 bg-transparent text-base outline-none"
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {lista.map((b) => (
              <button
                key={b.codigo}
                type="button"
                onClick={() => {
                  onEscolher(b.codigo);
                  setAberto(false);
                  setBusca("");
                }}
                className={`flex w-full items-center gap-3 border-b border-zinc-50 px-4 py-3 text-left hover:bg-zinc-50 ${
                  valor === b.codigo ? "bg-[#F8F1F3] font-semibold text-[#6D1F2F]" : ""
                }`}
              >
                <span className="w-9 text-xs text-zinc-400">{b.codigo}</span>
                {b.nome}
              </button>
            ))}
            {lista.length === 0 && /^\d{3}$/.test(busca.trim()) && (
              <button
                type="button"
                onClick={() => {
                  onEscolher(busca.trim());
                  setAberto(false);
                  setBusca("");
                }}
                className="w-full px-4 py-3 text-left hover:bg-zinc-50"
              >
                Usar o código <strong>{busca.trim()}</strong>
              </button>
            )}
            {lista.length === 0 && !/^\d{3}$/.test(busca.trim()) && (
              <p className="px-4 py-3 text-sm text-zinc-500">Não achou? Digite o código do banco (3 números).</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Conferir({
  form,
  contaNova,
  salvando,
  onVoltar,
  onSalvar,
}: {
  form: ContaBancaria;
  contaNova: boolean;
  salvando: boolean;
  onVoltar: () => void;
  onSalvar: () => void;
}) {
  return (
    <div className="mt-6 rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
      <p className="text-lg font-black text-zinc-900">Confira antes de salvar</p>
      <p className="mt-1 text-sm text-zinc-500">Compare com o app do seu banco. Um número errado faz a transferência voltar.</p>

      <dl className="mt-4 divide-y divide-zinc-100 rounded-2xl border border-zinc-200 px-4">
        <Linha rotulo="Titular" valor={form.titular} />
        <Linha rotulo="CPF/CNPJ" valor={formatarCpfCnpj(form.cpfCnpj)} />
        <Linha rotulo="Banco" valor={`${form.banco} · ${nomeDoBanco(form.banco) || "—"}`} />
        <Linha rotulo="Agência" valor={`${form.agencia}${form.agenciaDigito ? `-${form.agenciaDigito}` : " (sem dígito)"}`} />
        <Linha rotulo="Conta" valor={`${form.conta}-${form.contaDigito}`} />
        <Linha rotulo="Tipo" valor={tipoTexto(form.tipoConta)} />
      </dl>

      {!contaNova && (
        <p className="mt-3 flex items-start gap-2 text-xs text-zinc-500">
          <Info size={14} className="mt-0.5 shrink-0" />
          Se você trocar o banco, a agência ou a conta, os saques ficam travados por 24 horas, por segurança. Trocar só o nome não trava.
        </p>
      )}

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={onVoltar} disabled={salvando} className="rounded-xl border border-zinc-200 px-4 py-3.5 font-semibold text-zinc-700 disabled:opacity-50">
          Voltar e corrigir
        </button>
        <button
          type="button"
          onClick={onSalvar}
          disabled={salvando}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 font-bold text-white disabled:opacity-60"
          style={{ backgroundColor: COR }}
        >
          {salvando ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
          {salvando ? "Salvando na Pagar.me..." : "Está certo, salvar"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ModalSenha({
  motivo,
  erro,
  onCancelar,
  onConfirmar,
}: {
  motivo: MotivoSenha;
  erro?: string;
  onCancelar: () => void;
  onConfirmar: (senha: string) => Promise<void>;
}) {
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onCancelar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onCancelar]);

  const titulo = motivo === "ver" ? "Ver dados completos" : motivo === "editar" ? "Alterar dados bancários" : "Confirmar e salvar";

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      await onConfirmar(senha);
    } finally {
      setEnviando(false);
      setSenha("");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={onCancelar}>
      <form
        onSubmit={enviar}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F8F1F3]" style={{ color: COR }}>
            <Lock size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-black text-zinc-900">{titulo}</p>
            <p className="text-sm text-zinc-500">Digite a senha que você usa para entrar no painel.</p>
          </div>
          <button type="button" onClick={onCancelar} aria-label="Fechar" className="rounded-full p-1.5 hover:bg-zinc-100">
            <X size={18} />
          </button>
        </div>

        <div className="relative mt-5">
          <input
            type={mostrar ? "text" : "password"}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoFocus
            autoComplete="current-password"
            placeholder="Sua senha"
            className={`${entrada(erro)} pr-12`}
          />
          <button
            type="button"
            onClick={() => setMostrar((m) => !m)}
            aria-label={mostrar ? "Esconder senha" : "Mostrar senha"}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400"
          >
            {mostrar ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {erro && <p className="mt-2 text-sm font-semibold text-red-600">{erro}</p>}

        <button
          type="submit"
          disabled={enviando || !senha}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 font-bold text-white disabled:opacity-50"
          style={{ backgroundColor: COR }}
        >
          {enviando && <Loader2 size={18} className="animate-spin" />} Confirmar
        </button>
        <a href="/recuperar-senha" className="mt-3 block text-center text-sm font-semibold" style={{ color: COR }}>
          Esqueci minha senha
        </a>
      </form>
    </div>
  );
}
