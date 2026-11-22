"use client";

import { useEffect, useState } from "react";
import { X, MapPin, Plus, Pencil, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

type Endereco = {
  id: string;
  apelido: string | null;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento: string | null;
  referencia: string | null;
  principal: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  corPrincipal?: string;
};

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB",
  "PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const emptyForm = {
  id: "",
  apelido: "",
  cep: "",
  rua: "",
  numero: "",
  bairro: "",
  cidade: "",
  estado: "",
  complemento: "",
  referencia: "",
  principal: false,
};

const mascaraCep = (v: string) =>
  v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");

export default function EditAddresses({ open, onClose, corPrincipal }: Props) {
  const cor = corPrincipal || "#18181b";
  const [loading, setLoading] = useState(true);
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [semNumero, setSemNumero] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [enderecoExcluir, setEnderecoExcluir] = useState<string | null>(null);

  const tokenAtual = () => {
    const slug = window.location.pathname.split("/")[1];
    return localStorage.getItem(`cliente_token-${slug}`) || "";
  };

  async function carregarEnderecos() {
    const token = tokenAtual();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch("/api/cliente/enderecos", { headers: { "x-cliente-token": token } });
      const resultado = await response.json();
      if (resultado.success) setEnderecos(resultado.enderecos || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (open) {
      setLoading(true);
      carregarEnderecos();
    }
  }, [open]);

  function novoEndereco() {
    setForm(emptyForm);
    setSemNumero(false);
    setShowForm(true);
  }

  function editarEndereco(endereco: Endereco) {
    setForm(endereco);
    setSemNumero(/^s\/?n$/i.test(String(endereco.numero || "")));
    setShowForm(true);
  }

  async function salvarEndereco() {
    const token = tokenAtual();
    if (!token) return;

    if (!form.rua?.trim() || !form.bairro?.trim()) {
      toast.error("Informe pelo menos a rua e o bairro.");
      return;
    }
    const numeroFinal = semNumero ? "S/N" : String(form.numero || "").trim();
    if (!numeroFinal) {
      toast.error("Informe o número (ou marque \"sem número\").");
      return;
    }

    setSalvando(true);
    try {
      const response = await fetch("/api/cliente/enderecos", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...form, numero: numeroFinal }),
      });
      const resultado = await response.json();
      if (!resultado.success) {
        toast.error(resultado.error || "Não foi possível salvar o endereço.");
        return;
      }
      toast.success(form.id ? "Endereço atualizado!" : "Endereço adicionado!");
      setShowForm(false);
      carregarEnderecos();
    } catch {
      toast.error("Erro de conexão. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  function excluirEndereco(id: string) {
    setEnderecoExcluir(id);
    setConfirmOpen(true);
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[99998] bg-black/50" onClick={onClose} />

      <div className="fixed inset-0 z-[99999] overflow-y-auto bg-zinc-50">
        {/* Cabeçalho (mesmo padrão da Minha conta) */}
        <div className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-5">
            <div>
              <h1 className="text-xl font-black leading-tight">Meus endereços</h1>
              <p className="text-xs text-zinc-500">Gerencie seus endereços de entrega</p>
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
          <button
            onClick={novoEndereco}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl font-bold text-white shadow-md transition active:scale-[0.98]"
            style={{ backgroundColor: cor }}
          >
            <Plus size={20} />
            Adicionar endereço
          </button>

          {loading ? (
            <div className="mt-6 space-y-4">
              <div className="h-40 animate-pulse rounded-3xl bg-zinc-200" />
              <div className="h-40 animate-pulse rounded-3xl bg-zinc-200" />
            </div>
          ) : enderecos.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-10 text-center">
              <MapPin size={40} className="mx-auto text-zinc-300" />
              <h2 className="mt-4 text-lg font-bold">Nenhum endereço salvo</h2>
              <p className="mt-1 text-sm leading-6 text-zinc-500">
                Adicione um endereço para facilitar seus próximos pedidos.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {enderecos.map((endereco) => (
                <div key={endereco.id} className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black">{endereco.apelido || "Endereço"}</h3>
                        {endereco.principal && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                            style={{ backgroundColor: cor }}
                          >
                            <Check size={11} strokeWidth={3} /> Principal
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-zinc-700">
                        {endereco.rua}, {endereco.numero}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {endereco.bairro}
                        {endereco.cidade ? ` · ${endereco.cidade} - ${endereco.estado}` : ""}
                      </p>
                      {endereco.complemento && (
                        <p className="mt-1 text-sm text-zinc-500">Compl.: {endereco.complemento}</p>
                      )}
                      {endereco.referencia && (
                        <p className="text-sm text-zinc-500">Ref.: {endereco.referencia}</p>
                      )}
                    </div>
                    <MapPin size={22} className="shrink-0 text-zinc-300" />
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => editarEndereco(endereco)}
                      className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-100 font-semibold transition hover:bg-zinc-200"
                    >
                      <Pencil size={17} />
                      Editar
                    </button>
                    <button
                      onClick={() => excluirEndereco(endereco.id)}
                      aria-label="Excluir endereço"
                      className="flex h-11 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="fixed inset-0 z-[100000] flex items-end justify-center bg-black/60 sm:items-center">
          <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 sm:max-w-xl sm:rounded-3xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-black">{form.id ? "Editar endereço" : "Novo endereço"}</h2>
              <button
                onClick={() => setShowForm(false)}
                aria-label="Fechar"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <input
                value={form.apelido}
                onChange={(e) => setForm({ ...form, apelido: e.target.value.slice(0, 40) })}
                placeholder="Apelido (Casa, Trabalho...)"
                autoFocus
                className="h-12 w-full rounded-xl border border-zinc-300 px-4 outline-none focus:border-zinc-500"
              />

              <input
                value={form.cep}
                onChange={async (e) => {
                  const mascarado = mascaraCep(e.target.value);
                  setForm((prev: any) => ({ ...prev, cep: mascarado }));
                  const cep = mascarado.replace(/\D/g, "");
                  if (cep.length !== 8) return;
                  try {
                    const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                    const d = await r.json();
                    if (d.erro) return;
                    setForm((prev: any) => ({
                      ...prev,
                      rua: d.logradouro || prev.rua,
                      bairro: d.bairro || prev.bairro,
                      cidade: d.localidade || prev.cidade,
                      estado: d.uf || prev.estado,
                    }));
                  } catch (err) {
                    console.error(err);
                  }
                }}
                placeholder="CEP"
                inputMode="numeric"
                className="h-12 w-full rounded-xl border border-zinc-300 px-4 outline-none focus:border-zinc-500"
              />

              <input
                value={form.rua}
                onChange={(e) => setForm({ ...form, rua: e.target.value })}
                placeholder="Rua"
                className="h-12 w-full rounded-xl border border-zinc-300 px-4 outline-none focus:border-zinc-500"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    value={semNumero ? "" : form.numero}
                    onChange={(e) => setForm({ ...form, numero: e.target.value.slice(0, 20) })}
                    placeholder="Número"
                    disabled={semNumero}
                    className="h-12 w-full rounded-xl border border-zinc-300 px-4 outline-none focus:border-zinc-500 disabled:bg-zinc-100"
                  />
                  <label className="mt-2 flex items-center gap-2 text-xs text-zinc-600">
                    <input
                      type="checkbox"
                      checked={semNumero}
                      onChange={(e) => setSemNumero(e.target.checked)}
                      className="h-4 w-4"
                      style={{ accentColor: cor }}
                    />
                    Sem número
                  </label>
                </div>
                <input
                  value={form.bairro}
                  onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                  placeholder="Bairro"
                  className="h-12 w-full rounded-xl border border-zinc-300 px-4 outline-none focus:border-zinc-500"
                />
              </div>

              <div className="grid grid-cols-[1fr_110px] gap-4">
                <input
                  value={form.cidade}
                  onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                  placeholder="Cidade"
                  className="h-12 w-full rounded-xl border border-zinc-300 px-4 outline-none focus:border-zinc-500"
                />
                <select
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  className="h-12 w-full rounded-xl border border-zinc-300 bg-white px-3 outline-none focus:border-zinc-500"
                >
                  <option value="">UF</option>
                  {UFS.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </div>

              <input
                value={form.complemento}
                onChange={(e) => setForm({ ...form, complemento: e.target.value })}
                placeholder="Complemento (apto, bloco...)"
                className="h-12 w-full rounded-xl border border-zinc-300 px-4 outline-none focus:border-zinc-500"
              />

              <input
                value={form.referencia}
                onChange={(e) => setForm({ ...form, referencia: e.target.value })}
                placeholder="Ponto de referência"
                className="h-12 w-full rounded-xl border border-zinc-300 px-4 outline-none focus:border-zinc-500"
              />

              <label className="flex items-center gap-3 py-1">
                <input
                  type="checkbox"
                  checked={form.principal}
                  onChange={(e) => setForm({ ...form, principal: e.target.checked })}
                  className="h-5 w-5"
                  style={{ accentColor: cor }}
                />
                <span className="font-medium">Usar como endereço principal</span>
              </label>

              <button
                onClick={salvarEndereco}
                disabled={salvando}
                className="h-14 w-full rounded-2xl font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
                style={{ backgroundColor: cor }}
              >
                {salvando ? "Salvando..." : "Salvar endereço"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Excluir endereço"
        description="Tem certeza que deseja excluir este endereço? Essa ação não poderá ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        onCancel={() => {
          setConfirmOpen(false);
          setEnderecoExcluir(null);
        }}
        onConfirm={async () => {
          if (!enderecoExcluir) return;
          const token = tokenAtual();
          try {
            const response = await fetch(`/api/cliente/enderecos?id=${encodeURIComponent(String(enderecoExcluir))}`, {
              method: "DELETE",
              headers: { "x-cliente-token": token },
            });
            const resultado = await response.json();
            if (resultado.success) {
              toast.success("Endereço excluído.");
              setConfirmOpen(false);
              setEnderecoExcluir(null);
              await carregarEnderecos();
              return;
            }
            toast.error(resultado.error || "Não foi possível excluir.");
          } catch {
            toast.error("Erro de conexão. Tente de novo.");
          }
        }}
      />
    </>
  );
}
