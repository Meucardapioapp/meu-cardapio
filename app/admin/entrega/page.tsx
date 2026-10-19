"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";
import TemposEntrega from "../components/TemposEntrega";
import CobrancaEntrega from "../components/CobrancaEntrega";
import {
  Plus,
  MapPin,
  Loader2,
} from "lucide-react"



type BairroEntrega = {
  id?: string
  bairro: string
  valor: number
}

export default function EntregaPage() {
  const [loading, setLoading] = useState(true)





const [bairroEditando, setBairroEditando] =
  useState<BairroEntrega | null>(null);

const [bairros, setBairros] = useState<BairroEntrega[]>([]);

const [novoBairro, setNovoBairro] = useState("");

const [novoValor, setNovoValor] = useState("");

const [bairroParaExcluir, setBairroParaExcluir] =
  useState<BairroEntrega | null>(null);

const [editandoBairro, setEditandoBairro] =
  useState<string | null>(null);

  const restauranteId =
    typeof window !== "undefined"
      ? localStorage.getItem(
          "restaurante_id"
        )
      : null

  useEffect(() => {
    carregarConfiguracoes()
  }, [])

  async function carregarConfiguracoes() {
  try {
    if (!restauranteId) return

   

const { data: bairrosData, error: bairrosError } =
  await supabase
    .from("bairros_entrega")
    .select("*")
    .eq("restaurante_id", restauranteId)
    .order("bairro");

if (bairrosError) {
  console.error(bairrosError);
} else if (bairrosData) {
  setBairros(bairrosData);
}


  } catch (error) {
    } finally {
    setLoading(false)
  }
}


async function adicionarBairro() {
  if (!restauranteId) return;

  if (!novoBairro.trim()) {
   toast.warning("Informe o nome do bairro.");
    return;
  }

  const valor = Number(
    novoValor.replace(",", ".")
  );

  if (isNaN(valor)) {
    toast.warning("Informe um valor válido.");
    return;
  }

  const { data, error } = await supabase
    .from("bairros_entrega")
    .insert({
      restaurante_id: restauranteId,
      bairro: novoBairro.trim(),
      valor,
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    toast.error(error.message);
    return;
  }

  setBairros((prev) =>
    [...prev, data].sort((a, b) =>
      a.bairro.localeCompare(b.bairro)
    )
  );

  setNovoBairro("");
  setNovoValor("");
}


async function salvarEdicao() {
  if (!bairroEditando) return;

  const valor = Number(
    novoValor.replace(",", ".")
  );

  const { error } = await supabase
    .from("bairros_entrega")
    .update({
      bairro: novoBairro,
      valor,
    })
    .eq("id", bairroEditando.id);

  if (error) {
    toast.error(error.message);
    return;
  }

  setBairros((prev) =>
    prev.map((b) =>
      b.id === bairroEditando.id
        ? {
            ...b,
            bairro: novoBairro,
            valor,
          }
        : b
    )
  );

  setNovoBairro("");
  setNovoValor("");
  setBairroEditando(null);

  toast.success("Bairro atualizado!");
}


if (loading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-10 h-10 animate-spin text-[#7A1F3D]" />
    </div>
  )
}

return (
  <div className="max-w-7xl mx-auto">

    <TemposEntrega />

    <CobrancaEntrega>
    <div className="bg-[#F5F2F4] rounded-3xl p-3 sm:p-6 border border-[#E6DDE1]">

<div className="space-y-6">











<>
  <div className="bg-white rounded-3xl p-4 sm:p-8 border">

    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-8">

      <div>
        <h2 className="text-2xl lg:text-3xl font-black">
          Cobrança por Bairros
        </h2>

        <p className="text-zinc-500 mt-2">
          Defina os bairros atendidos e o valor da entrega.
        </p>
      </div>

<div className="grid grid-cols-[1fr_7rem] gap-3 sm:flex">

  <input
    value={novoBairro}
    onChange={(e) =>
      setNovoBairro(e.target.value)
    }
    placeholder="Nome do bairro"
    className="border rounded-2xl px-4 py-3 min-w-0"
  />

  <input
    value={novoValor}
    onChange={(e) =>
      setNovoValor(e.target.value)
    }
    placeholder="Valor"
    inputMode="decimal"
    className="border rounded-2xl px-4 py-3 w-full sm:w-32"
  />

  <button
    onClick={
  bairroEditando
    ? salvarEdicao
    : adicionarBairro
}
    className="col-span-2 bg-[#7A1F3D] text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2"
  >
<Plus size={18} />
{bairroEditando ? "Salvar" : "Adicionar"}
  </button>

{bairroEditando && (
  <button
    onClick={() => {
      setBairroEditando(null);
      setNovoBairro("");
      setNovoValor("");
    }}
    className="
      col-span-2
      border
      border-zinc-300
      px-6
      py-3
      rounded-2xl
      hover:bg-zinc-100
      transition
    "
  >
    Cancelar
  </button>
)}

</div>

    </div>

    <table className="w-full">

      <thead>

        <tr className="border-b">

          <th className="text-left py-4">
            Bairro
          </th>

          <th className="text-left">
            Taxa de Entrega
          </th>

          <th className="text-center">
            Ações
          </th>

        </tr>

      </thead>

<tbody>

  {bairros.length === 0 ? (

    <tr>

      <td
        colSpan={3}
        className="text-center py-8 text-zinc-500"
      >
        Nenhum bairro cadastrado.
      </td>

    </tr>

  ) : (

    bairros.map((bairro) => (

      <tr
        key={bairro.id}
        className="border-b"
      >

        <td className="py-4">
          {bairro.bairro}
        </td>

        <td>
{bairro.valor.toLocaleString("pt-BR", {
  style: "currency",
  currency: "BRL",
})}
        </td>

        <td className="flex justify-center gap-4 py-4">

<button
  onClick={() => {
    setNovoBairro(bairro.bairro);
    setNovoValor(bairro.valor.toString());
    setBairroEditando(bairro);
  }}
  className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-full text-sm font-semibold"
>
  Editar
</button>

<button
  onClick={() => setBairroParaExcluir(bairro)}
  className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-xl text-sm font-semibold transition"
>
  Excluir
</button>

        </td>

      </tr>

    ))

  )}

</tbody>

    </table>

  </div>

<div className="mt-10 border-t pt-6">


  <img
    src="/tutorial-bairros.png"
    loading="lazy"
    decoding="async"
    alt="Tutorial de cobrança por bairros"
    className="
      w-full
      rounded-3xl
      border
      shadow-xl
    "
  />

</div>


</>



      </div>






    </div>
    </CobrancaEntrega>

<ConfirmDialog
  open={bairroParaExcluir !== null}
  title="Excluir Bairro"
  description={
    bairroParaExcluir
      ? `Tem certeza que deseja excluir o bairro "${bairroParaExcluir.bairro}"? Esta ação não poderá ser desfeita.`
      : ""
  }
  confirmText="Excluir"
  cancelText="Cancelar"
  onCancel={() => setBairroParaExcluir(null)}
  onConfirm={async () => {
    if (!bairroParaExcluir) return;

    const { error } = await supabase
      .from("bairros_entrega")
      .delete()
      .eq("id", bairroParaExcluir.id);

if (error) {
  toast.error(error.message);
  return;
}

    setBairros((prev) =>
      prev.filter((b) => b.id !== bairroParaExcluir.id)
    );

    setBairroParaExcluir(null);
  }}
/>

  </div>
)
}