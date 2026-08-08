"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  Gift,
  Save,
  Search,
  MessageCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Fidelidade = {
  id: string;
  restaurante_id: string;
  ativo: boolean;
  pedidos_necessarios: number;
  valor_desconto: number;
};

export default function ClientesPage() {
  const [loading, setLoading] = useState(true);

  const [fidelidade, setFidelidade] =
    useState<Fidelidade | null>(null);

  const [ativo, setAtivo] = useState(false);

const [valorDesconto, setValorDesconto] =
  useState("0");

    const [salvando, setSalvando] =
  useState(false);

  const [clientes, setClientes] = useState<any[]>([]);

const [busca, setBusca] = useState("");

  async function carregarConfiguracao() {
    setLoading(true);

    const restauranteId = localStorage.getItem(
      "restaurante_id"
    );

    if (!restauranteId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("fidelidade")
      .select("*")
      .eq("restaurante_id", restauranteId)
      .single();

    if (!error && data) {
      setFidelidade(data);

      setAtivo(data.ativo);

setValorDesconto(
  String(data.valor_desconto ?? 0)
);
    }

    setLoading(false);
  }

async function salvarConfiguracao() {
  const restauranteId = localStorage.getItem("restaurante_id");

  if (!restauranteId) {
    toast.error("Restaurante não encontrado.");
    return;
  }

  setSalvando(true);

  const valor = Number(
    valorDesconto.replace(",", ".")
  );

  if (!fidelidade) {
    const { error } = await supabase
      .from("fidelidade")
      .insert({
        restaurante_id: restauranteId,
        ativo,
        pedidos_necessarios: 10,
        valor_desconto: valor,
      });

    setSalvando(false);

    if (error) {
      console.error(error);
      toast.error("Erro ao salvar.");
      return;
    }

    toast.success("Configuração salva.");

    await carregarConfiguracao();

    return;
  }

  const { error } = await supabase
    .from("fidelidade")
    .update({
      ativo,
      valor_desconto: valor,
      updated_at: new Date().toISOString(),
    })
    .eq("restaurante_id", restauranteId);

  setSalvando(false);

  if (error) {
    console.error(error);
    toast.error("Erro ao salvar.");
    return;
  }

  toast.success("Configuração atualizada.");

  await carregarConfiguracao();
}

async function carregarClientes() {
  const restauranteId =
    localStorage.getItem("restaurante_id");

  if (!restauranteId) return;

  const { data, error } = await supabase
    .from("vw_clientes_admin")
    .select("*")
    .eq("restaurante_id", restauranteId)
    .order("nome");

  if (error) {
    console.error(error);
    return;
  }

  setClientes(data || []);
}

useEffect(() => {
  async function carregarTudo() {
    await carregarConfiguracao();
    await carregarClientes();
  }

  carregarTudo();
}, []);
  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-7 w-7 animate-spin text-zinc-500" />
      </div>
    );
  }

  const clientesFiltrados = clientes.filter((cliente) =>
  cliente.nome
    ?.toLowerCase()
    .includes(busca.toLowerCase())
);

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold">
          Clientes
        </h1>

        <p className="text-zinc-500 mt-1">
          Gerencie seus clientes e o programa de
          fidelidade.
        </p>
      </div>

      <Card className="rounded-3xl border-0 shadow-sm">

        <CardContent className="p-7">

          <div className="flex items-center gap-3">

            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">

              <Gift
                size={24}
                className="text-emerald-600"
              />

            </div>

            <div>

              <h2 className="text-xl font-bold">
                Programa de Fidelidade
              </h2>

              <p className="text-sm text-zinc-500">
                Configure a recompensa para clientes
                que realizarem pedidos via Pix.
              </p>

            </div>

          </div>

          <div className="mt-8 grid md:grid-cols-2 gap-6">

            <div>

<p className="mb-2 text-sm font-semibold">
  Status
</p>

<div className="flex items-center justify-between rounded-xl border bg-white px-4 h-14">

  <div>

    <p className="font-medium">
      Programa ativo
    </p>

    <p className="text-xs text-zinc-500">
      Liberar selos automaticamente.
    </p>

  </div>

 <input
  type="checkbox"
  checked={ativo}
  onChange={(e) => setAtivo(e.target.checked)}
  className="w-5 h-5 accent-[#7A1F3D]"
/>

</div>

            </div>

            <div>

<p className="mb-2 text-sm font-semibold">
  Desconto após 10 pedidos Pix
</p>

<Input
  value={valorDesconto}
  onChange={(e) =>
    setValorDesconto(e.target.value)
  }
  className="h-14 rounded-xl"
/>

            </div>

          </div>

          <div className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-100 p-5">

            <p className="text-sm leading-6 text-emerald-800">

              Cada pedido pago via <strong>Pix</strong> gera
              automaticamente <strong>1 selo</strong>.

              <br />

              Ao completar
              <strong>
                {" "}10 selos
              </strong>
              , o próximo pedido receberá o desconto
              configurado automaticamente.

            </p>

          </div>

          <div className="mt-7 flex justify-end">

  <Button
    onClick={salvarConfiguracao}
    disabled={salvando}
    className="rounded-xl h-12 px-6"
  >

    {salvando ? (

      <Loader2
        size={18}
        className="animate-spin mr-2"
      />

    ) : (

      <Save
        size={18}
        className="mr-2"
      />

    )}

    Salvar alterações

  </Button>

</div>

        </CardContent>

      </Card>

<Card className="rounded-3xl border-0 shadow-sm">

  <CardContent className="p-7">

    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

      <div>

        <h2 className="text-2xl font-bold">
          Clientes cadastrados
        </h2>

        <p className="text-zinc-500 mt-1">
          Acompanhe seus clientes, pedidos e fidelidade.
        </p>

      </div>

      <div className="relative w-full md:w-[320px]">

        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
        />

        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar cliente..."
          className="pl-11 h-11 rounded-xl"
        />

      </div>

    </div>

    <div className="mt-8 overflow-x-auto">

      <table className="w-full">

        <thead>

          <tr className="border-b">

            <th className="text-left py-4 font-semibold">
              Cliente
            </th>

            <th className="text-left py-4 font-semibold">
              Telefone
            </th>

            <th className="text-center py-4 font-semibold">
              Pedidos
            </th>

<th className="text-center py-4 font-semibold">
  Fidelidade
</th>

            <th className="text-right py-4 font-semibold">
              Total gasto
            </th>

          </tr>

        </thead>

<tbody>

  {clientesFiltrados.map((cliente) => {

    const telefone = cliente.telefone?.replace(/\D/g, "") || "";

    return (

      <tr
        key={cliente.id}
        className="border-b hover:bg-zinc-50 transition"
      >

        {/* CLIENTE */}

        <td className="py-5">

          <div className="flex items-center gap-3">

<div
  className="
    w-12
    h-12

    rounded-full

    bg-gradient-to-br
    from-[#7A1F3D]
    to-[#A52A53]

    text-white

    font-bold

    flex
    items-center
    justify-center

    shadow-lg
  "
>
              {cliente.nome?.charAt(0).toUpperCase()}

            </div>

            <div>

              <p className="font-semibold">

                {cliente.nome}

              </p>

            </div>

          </div>

        </td>

        {/* TELEFONE */}

        <td>

          <div className="flex items-center gap-3">

            <span>

              {cliente.telefone}

            </span>

            <a
              href={`https://wa.me/55${telefone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:scale-110 transition"
            >

              <div
  className="
    w-9
    h-9
    rounded-full
    bg-green-100
    text-green-600

    flex
    items-center
    justify-center

    hover:bg-green-500
    hover:text-white

    transition
  "
>
  <MessageCircle size={18} />
</div>

            </a>

          </div>

        </td>

        {/* PEDIDOS */}

        <td className="text-center font-semibold">

          {cliente.pedidos}

        </td>

        {/* SELOS */}

<td className="py-5">

  <div className="flex flex-col items-center gap-2">

    <div className="w-36 h-3 rounded-full bg-zinc-200 overflow-hidden">

      <div
        className="h-full bg-emerald-500 transition-all duration-500"
        style={{
          width: `${Math.min(
            (cliente.selos_pix / 10) * 100,
            100
          )}%`,
        }}
      />

    </div>

    <span className="text-xs font-medium text-zinc-500">

      {cliente.selos_pix}/10 selos

    </span>

    {cliente.selos_pix >= 10 && (

      <span className="
        px-3
        py-1
        rounded-full
        bg-green-100
        text-green-700
        text-xs
        font-semibold
      ">

        🎁 Desconto disponível

      </span>

    )}

  </div>

</td>

        {/* TOTAL */}

<td className="text-right">

  <span
    className="
      font-bold
      text-emerald-600
      text-base
    "
  >
    {Number(cliente.total_gasto).toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    )}
  </span>

</td>

      </tr>

    );

  })}

  {clientesFiltrados.length === 0 && (

    <tr>

      <td
        colSpan={5}
        className="py-16 text-center text-zinc-500"
      >

        Nenhum cliente encontrado.

      </td>

    </tr>

  )}

</tbody>

      </table>

    </div>

  </CardContent>

</Card>


    </div>
  );
}
