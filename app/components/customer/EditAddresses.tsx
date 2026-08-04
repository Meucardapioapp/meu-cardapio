"use client";

import { useEffect, useState } from "react";
import {
  X,
  MapPin,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";

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
};

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

export default function EditAddresses({
  open,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(true);

  const [enderecos, setEnderecos] = useState<Endereco[]>([]);

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState<any>(emptyForm);

  const [confirmOpen, setConfirmOpen] = useState(false);

const [enderecoExcluir, setEnderecoExcluir] = useState<string | null>(null);

  async function carregarEnderecos() {
    const token = localStorage.getItem("cliente_token");

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/cliente/enderecos?token=${token}`
      );

      const resultado = await response.json();

      if (resultado.success) {
        setEnderecos(resultado.enderecos || []);
      }
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (open) {
      carregarEnderecos();
    }
  }, [open]);

  function novoEndereco() {
    setForm(emptyForm);
    setShowForm(true);
  }

  function editarEndereco(endereco: Endereco) {
    setForm(endereco);
    setShowForm(true);
  }

  async function salvarEndereco() {
  const token = localStorage.getItem("cliente_token");

  if (!token) return;

  const metodo = form.id ? "PUT" : "POST";

  const response = await fetch("/api/cliente/enderecos", {
    method: metodo,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token,
      ...form,
    }),
  });

  const resultado = await response.json();

  if (!resultado.success) {
    alert(resultado.error);
    return;
  }

  setShowForm(false);

  carregarEnderecos();
}

function excluirEndereco(id: string) {
  setEnderecoExcluir(id);
  setConfirmOpen(true);
}

  if (!open) return null;

  return (
    <>
      {/* Overlay */}

      <div
        className="fixed inset-0 bg-black/50 z-[99998]"
        onClick={onClose}
      />

      {/* Tela */}

      <div className="fixed inset-0 bg-zinc-50 z-[99999] overflow-y-auto">

        {/* Header */}

        <div className="sticky top-0 bg-white border-b border-zinc-200 z-50">

          <div className="max-w-2xl mx-auto h-20 px-6 flex items-center justify-between">

            <div>

              <h1 className="text-3xl font-black">

                Meus Endereços

              </h1>

              <p className="text-sm text-zinc-500 mt-1">

                Gerencie seus endereços salvos.

              </p>

            </div>

            <button
              onClick={onClose}
              className="w-12 h-12 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center"
            >
              <X size={22} />
            </button>

          </div>

        </div>

        {/* Conteúdo */}

        <div className="max-w-2xl mx-auto px-6 py-8">

          <button
            onClick={novoEndereco}
            className="w-full h-14 rounded-2xl bg-black text-white font-semibold flex items-center justify-center gap-2"
          >
            <Plus size={20} />

            Adicionar endereço

          </button>

                    {loading ? (
            <div className="py-24 text-center text-zinc-500">
              Carregando endereços...
            </div>
          ) : enderecos.length === 0 ? (
            <div className="mt-6 rounded-3xl bg-white border border-zinc-200 p-10 text-center">
              <MapPin
                size={42}
                className="mx-auto text-zinc-300"
              />

              <h2 className="font-bold text-xl mt-5">
                Nenhum endereço salvo
              </h2>

              <p className="text-zinc-500 mt-2 leading-7">
                Adicione um endereço para facilitar
                seus próximos pedidos.
              </p>
            </div>
          ) : (
            <div className="space-y-5 mt-6">
              {enderecos.map((endereco) => (
                <div
                  key={endereco.id}
                  className="
                    bg-white
                    rounded-3xl
                    border
                    border-zinc-200
                    p-6
                    shadow-sm
                  "
                >
                  <div className="flex justify-between">

                    <div>

                      <div className="flex items-center gap-2">

                        <h3 className="font-black text-xl">
                          {endereco.apelido || "Endereço"}
                        </h3>

                        {endereco.principal && (
                          <span
                            className="
                              text-xs
                              bg-green-100
                              text-green-700
                              px-2
                              py-1
                              rounded-full
                              font-semibold
                            "
                          >
                            Principal
                          </span>
                        )}

                      </div>

                      <p className="mt-4 text-zinc-700">
                        {endereco.rua}, {endereco.numero}
                      </p>

                      <p className="mt-1 text-zinc-500">
                        {endereco.bairro}
                      </p>

                      <p className="mt-1 text-zinc-500">
                        {endereco.cidade} - {endereco.estado}
                      </p>

                      {endereco.cep && (
                        <p className="mt-2 text-sm text-zinc-400">
                          CEP {endereco.cep}
                        </p>
                      )}

                      {endereco.complemento && (
                        <p className="mt-2 text-sm text-zinc-500">
                          Complemento: {endereco.complemento}
                        </p>
                      )}

                      {endereco.referencia && (
                        <p className="mt-1 text-sm text-zinc-500">
                          Referência: {endereco.referencia}
                        </p>
                      )}

                    </div>

                    <MapPin
                      size={24}
                      className="text-zinc-400"
                    />

                  </div>

                  <div className="flex gap-3 mt-6">

                    <button
                      onClick={() => editarEndereco(endereco)}
                      className="
                        flex-1
                        h-12
                        rounded-2xl
                        bg-zinc-100
                        hover:bg-zinc-200
                        transition
                        font-semibold
                        flex
                        items-center
                        justify-center
                        gap-2
                      "
                    >
                      <Pencil size={18} />

                      Editar
                    </button>

                    <button
                     onClick={() => excluirEndereco(endereco.id)}
                      className="
                        w-12
                        rounded-2xl
                        bg-red-50
                        hover:bg-red-100
                        text-red-600
                        flex
                        items-center
                        justify-center
                        transition
                      "
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

            {showForm && (
        <div className="fixed inset-0 z-[100000] bg-black/60 flex items-end sm:items-center justify-center">

          <div className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl p-6">

            <div className="flex items-center justify-between mb-6">

              <h2 className="text-2xl font-black">
                {form.id ? "Editar endereço" : "Novo endereço"}
              </h2>

              <button
                onClick={() => setShowForm(false)}
                className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center"
              >
                <X size={20} />
              </button>

            </div>

            <div className="space-y-4">

              <input
                value={form.apelido}
                onChange={(e) =>
                  setForm({ ...form, apelido: e.target.value })
                }
                placeholder="Apelido (Casa, Trabalho...)"
                className="w-full h-12 rounded-xl border px-4"
              />

<input
  value={form.cep}
  onChange={async (e) => {
    const cep = e.target.value.replace(/\D/g, "");

    setForm({
      ...form,
      cep: e.target.value,
    });

    if (cep.length !== 8) return;

    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cep}/json/`
      );

      const endereco = await response.json();

      if (endereco.erro) return;

      setForm((prev: any) => ({
        ...prev,
        cep: e.target.value,
        rua: endereco.logradouro || "",
        bairro: endereco.bairro || "",
        cidade: endereco.localidade || "",
        estado: endereco.uf || "",
      }));
    } catch (err) {
      console.error(err);
    }
  }}
  placeholder="CEP"
  className="w-full h-12 rounded-xl border px-4"
/>

              <input
                value={form.rua}
                onChange={(e) =>
                  setForm({ ...form, rua: e.target.value })
                }
                placeholder="Rua"
                className="w-full h-12 rounded-xl border px-4"
              />

              <div className="grid grid-cols-2 gap-4">

                <input
                  value={form.numero}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      numero: e.target.value,
                    })
                  }
                  placeholder="Número"
                  className="h-12 rounded-xl border px-4"
                />

                <input
                  value={form.bairro}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      bairro: e.target.value,
                    })
                  }
                  placeholder="Bairro"
                  className="h-12 rounded-xl border px-4"
                />

              </div>

              <div className="grid grid-cols-2 gap-4">

                <input
                  value={form.cidade}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      cidade: e.target.value,
                    })
                  }
                  placeholder="Cidade"
                  className="h-12 rounded-xl border px-4"
                />

                <input
                  value={form.estado}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      estado: e.target.value,
                    })
                  }
                  placeholder="Estado"
                  className="h-12 rounded-xl border px-4"
                />

              </div>

              <input
                value={form.complemento}
                onChange={(e) =>
                  setForm({
                    ...form,
                    complemento: e.target.value,
                  })
                }
                placeholder="Complemento"
                className="w-full h-12 rounded-xl border px-4"
              />

              <input
                value={form.referencia}
                onChange={(e) =>
                  setForm({
                    ...form,
                    referencia: e.target.value,
                  })
                }
                placeholder="Referência"
                className="w-full h-12 rounded-xl border px-4"
              />

              <label className="flex items-center gap-3">

                <input
                  type="checkbox"
                  checked={form.principal}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      principal: e.target.checked,
                    })
                  }
                />

                Endereço principal

              </label>

<button
  onClick={salvarEndereco}
  className="w-full h-14 rounded-2xl bg-black text-white font-semibold"
>
  Salvar endereço
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

    const token = localStorage.getItem("cliente_token");

    const response = await fetch(
      `/api/cliente/enderecos?token=${token}&id=${enderecoExcluir}`,
      {
        method: "DELETE",
      }
    );

    const resultado = await response.json();

if (resultado.success) {
  setConfirmOpen(false);
  setEnderecoExcluir(null);

  await carregarEnderecos();

  return;
}

alert(resultado.error);
  }}
/>


          </>
  );
}