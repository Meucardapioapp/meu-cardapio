"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import EditProfile from "./customer/EditProfile";
import EditAddresses from "./customer/EditAddresses";
import LoginCustomer from "./customer/LoginCustomer";
import {
  User,
  Phone,
  ArrowRight,
  X,
  MapPin,
  Package,
  Mail,
  LogOut,
  Calendar,
  Wallet,
  ChevronRight,
} from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function CustomerArea({
  open,
  onClose,
}: Props) {
    const router = useRouter();
    const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    async function carregarCliente() {
      setDados(null);
setLoading(true);
      const slug = window.location.pathname.split("/")[1];

const token = localStorage.getItem(
  `cliente_token-${slug}`
);

if (!token) {
  setLoginOpen(true);
  setLoading(false);
  setDados(null);
  return;
}

      try {
        const response = await fetch(
          `/api/cliente/me?token=${token}`
        );

        const resultado = await response.json();

        if (resultado.success) {
          setDados(resultado);
        } else {
          setDados(null);
        }
      } catch (error) {
        console.error(error);
      }

      setLoading(false);
    }

    if (open) {
      carregarCliente();
    }
 }, [open, pathname]);

  function sair() {
    const slug = window.location.pathname.split("/")[1];

localStorage.removeItem(
  `cliente_token-${slug}`
);
    setDados(null);
  }

  const totalPedidos = dados?.pedidos?.length || 0;

  const totalGasto = Number(
    dados?.cliente?.total_gasto || 0
  ).toFixed(2);

  const clienteDesde = useMemo(() => {
    if (!dados?.cliente?.created_at) return "";

    return new Date(
      dados.cliente.created_at
    ).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  }, [dados]);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}

      <div
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={onClose}
      />

      {/* Tela inteira */}

      <div
        className="
          fixed
          inset-0
          z-[9999]
          bg-zinc-50
          overflow-y-auto
        "
      >
        {/* Cabeçalho */}

        <div
          className="
            sticky
            top-0
            z-50

            bg-white/95
            backdrop-blur-xl

            border-b
            border-zinc-200
          "
        >
          <div
            className="
              max-w-2xl
              mx-auto

              h-20

              px-6

              flex
              items-center
              justify-between
            "
          >
            <div>

              <h1 className="text-3xl font-black">
                Minha Conta
              </h1>

              <p className="text-sm text-zinc-500 mt-1">
                Seus pedidos, endereços e informações.
              </p>

            </div>

            <button
              onClick={onClose}
              className="
                w-12
                h-12

                rounded-full

                bg-zinc-100

                hover:bg-zinc-200

                transition

                flex
                items-center
                justify-center
              "
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Conteúdo */}

        <div className="max-w-2xl mx-auto px-6 py-8"> 


        {/* ===========================
    LOADING
=========================== */}

{loading && (
  <div className="py-24 flex justify-center">
    <div className="animate-pulse text-zinc-500">
      Carregando sua conta...
    </div>
  </div>
)}

{/* ===========================
    SEM CLIENTE
=========================== */}

{!loading && !dados && (
  <div className="rounded-3xl bg-white border border-zinc-200 p-8 shadow-sm">

    <div
      className="
        w-20
        h-20
        rounded-full
        bg-zinc-100
        flex
        items-center
        justify-center
      "
    >
      <User size={38} />
    </div>

    <h2 className="text-3xl font-black mt-6">
      Bem-vindo 👋
    </h2>

    <p className="text-zinc-500 mt-3 leading-7">
      Faça seu primeiro pedido e seus dados serão
      salvos automaticamente. Depois disso você
      poderá acompanhar pedidos, editar seus
      endereços e comprar novamente com apenas
      alguns toques.
    </p>

    <button
      onClick={onClose}
      className="
        mt-8

        h-14
        w-full

        rounded-2xl

        bg-black

        text-white

        font-semibold

        flex
        items-center
        justify-center
        gap-2
      "
    >
      <Phone size={20} />

      Fazer meu primeiro pedido

      <ArrowRight size={18} />
    </button>

  </div>
)}

{/* ===========================
    CLIENTE LOGADO
=========================== */}

{!loading && dados && (
<>

<div
  className="
    rounded-[34px]

    bg-gradient-to-br
    from-zinc-900
    via-zinc-800
    to-zinc-900

    text-white

    p-7

    shadow-2xl
  "
>

<div className="flex items-start justify-between">

<div className="flex gap-5">

<div
className="
w-20
h-20

rounded-full

bg-white/10

border
border-white/20

flex
items-center
justify-center
"
>

<User size={36} />

</div>

<div>

<h2 className="text-3xl font-black">

{dados.cliente.nome}

</h2>

<p className="text-zinc-300 mt-2">

Cliente desde {clienteDesde || "Hoje"}

</p>

</div>

</div>

<button
className="
w-11
h-11

rounded-full

bg-white/10

flex
items-center
justify-center
"
>

<ChevronRight />

</button>

</div>



<div className="mt-8 border-t border-white/10 pt-6">

  <div className="flex items-center justify-between">

    <div className="flex items-center gap-3">

      <Phone size={18} />

      <span className="font-semibold">
        {dados.cliente.telefone}
      </span>

    </div>

    <ChevronRight
      size={18}
      className="text-zinc-400"
    />

  </div>

</div>

<div className="mt-6 border-t border-white/10 pt-6">

  <div className="flex items-start justify-between">

    <div>

      <h3 className="font-bold text-xl">
        Endereço principal
      </h3>

      {dados.enderecos.length > 0 ? (

        <>

          <p className="mt-3">
            {dados.enderecos[0].rua},{" "}
            {dados.enderecos[0].numero}
          </p>

          <p className="text-zinc-300">
            {dados.enderecos[0].bairro}
          </p>

          <p className="text-zinc-300">
            {dados.enderecos[0].cidade} -{" "}
            {dados.enderecos[0].estado}
          </p>

          <span className="inline-block mt-3 rounded-full bg-white/10 px-3 py-1 text-xs">
            Usado nos pedidos
          </span>

        </>

      ) : (

        <p className="mt-3 text-zinc-400">
          Nenhum endereço cadastrado
        </p>

      )}

    </div>

    <ChevronRight
      size={18}
      className="text-zinc-400 mt-1"
    />

  </div>

</div>



<div className="grid grid-cols-2 gap-4 mt-8">

  <button
    onClick={() => setEditOpen(true)}
    className="rounded-2xl bg-white/10 hover:bg-white/15 transition p-5 text-left"
  >
    <User size={24} className="mb-3" />

    <p className="font-semibold">
      Editar meus dados
    </p>

    <p className="text-xs text-zinc-300 mt-1">
      Nome, telefone e CPF
    </p>
  </button>

  <button
    onClick={() => setAddressOpen(true)}
    className="rounded-2xl bg-white/10 hover:bg-white/15 transition p-5 text-left"
  >
    <MapPin size={24} className="mb-3" />

    <p className="font-semibold">
      Editar endereços
    </p>

    <p className="text-xs text-zinc-300 mt-1">
      Gerencie seus endereços
    </p>
  </button>

</div>

<div
className="
grid
grid-cols-2
gap-4

mt-8
"
>

<div
className="
rounded-2xl

bg-white/10

p-5
"
>

<div className="flex items-center gap-2">

<Package size={18} />

<span className="text-sm">

Pedidos

</span>

</div>

<p className="text-3xl font-black mt-4">

{totalPedidos}

</p>

</div>

<div
className="
rounded-2xl
bg-white/10
p-5
"
>

<div className="flex items-center gap-2">

🎁

<span className="text-sm">
Programa Fidelidade
</span>

</div>

<p className="text-sm mt-4 leading-6">

Em breve você poderá ganhar descontos
a cada quantidade de pedidos.

</p>

</div>


</div>

</div>

{/* ===========================
      ÚLTIMOS PEDIDOS
=========================== */}

<div className="mt-8">

  <div className="flex items-center justify-between mb-5">

    <h2 className="text-2xl font-black">
      Últimos pedidos
    </h2>

    <span className="text-sm text-zinc-500">
      {totalPedidos} pedidos
    </span>

  </div>

  {dados.pedidos.length === 0 ? (

    <div className="rounded-3xl bg-white border border-zinc-200 p-8 text-center">

      <Package
        size={42}
        className="mx-auto text-zinc-300"
      />

      <h3 className="font-bold text-lg mt-5">
        Nenhum pedido ainda
      </h3>

      <p className="text-zinc-500 mt-2">
        Assim que você realizar um pedido,
        ele aparecerá aqui.
      </p>

    </div>

  ) : (

    <div className="space-y-4">

      {dados.pedidos.map((pedido: any) => {

        const status =
          pedido.status || "Recebido";

        const statusColor =
          status === "Entregue"
            ? "bg-green-100 text-green-700"
            : status === "Cancelado"
            ? "bg-red-100 text-red-700"
            : status === "Saiu para entrega"
            ? "bg-blue-100 text-blue-700"
            : "bg-yellow-100 text-yellow-700";

        return (

          <div
            key={pedido.id}
            className="
              bg-white
              rounded-3xl
              border
              border-zinc-200
              p-5
              shadow-sm
            "
          >

            <div className="flex justify-between items-start">

              <div>

                <p className="text-xs text-zinc-500">
                  Pedido
                </p>

                <h3 className="text-xl font-black">
                  #{pedido.id}
                </h3>

              </div>

              <span
                className={`
                  px-3
                  py-1.5
                  rounded-full
                  text-xs
                  font-semibold
                  ${statusColor}
                `}
              >
                {status}
              </span>

            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">

              <div>

                <p className="text-xs text-zinc-500">
                  Data
                </p>

                <p className="font-semibold mt-1">

                  {new Date(
                    pedido.created_at
                  ).toLocaleDateString(
                    "pt-BR",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }
                  )}

                </p>

              </div>

              <div>

                <p className="text-xs text-zinc-500">
                  Valor
                </p>

                <p className="font-black text-lg mt-1">

                  R${" "}

                  {Number(
                    pedido.total_pago ||
                    pedido.total ||
                    0
                  ).toFixed(2)}

                </p>

              </div>

            </div>

<button
  onClick={() => {

    router.push(`/pedido/${pedido.id}`);

  }}
  className="
    mt-6
    w-full
    h-12
    rounded-2xl
    bg-zinc-100
    hover:bg-zinc-200
    transition
    flex
    items-center
    justify-center
    gap-2
    font-semibold
  "
>

  Ver detalhes

  <ChevronRight size={18} />

</button>

          </div>

        );

      })}

    </div>

  )}

</div>

{/* ===========================
      ENDEREÇOS
=========================== */}

<div className="mt-10">

  <div className="flex items-center gap-2 mb-5">

    <MapPin size={22} />

    <h2 className="text-2xl font-black">
      Endereços
    </h2>

  </div>

    {dados.enderecos.length === 0 ? (

    <div className="rounded-3xl bg-white border border-zinc-200 p-8 text-center">

      <MapPin
        size={42}
        className="mx-auto text-zinc-300"
      />

      <h3 className="font-bold text-lg mt-5">
        Nenhum endereço salvo
      </h3>

      <p className="text-zinc-500 mt-2">
        Seu endereço aparecerá aqui após seu
        primeiro pedido.
      </p>

    </div>

  ) : (

    <div className="space-y-4">

      {dados.enderecos.map((endereco: any) => (

        <div
          key={endereco.id}
          className="
            bg-white
            rounded-3xl
            border
            border-zinc-200
            p-5
            shadow-sm
          "
        >

          <div className="flex justify-between items-start">

            <div>

              <h3 className="font-bold text-lg">

                {endereco.apelido || "Endereço"}

              </h3>

              <p className="text-zinc-600 mt-3">

                {endereco.rua}, {endereco.numero}

              </p>

              <p className="text-zinc-500 mt-1">

                {endereco.bairro}

              </p>

              <p className="text-zinc-500">

                {endereco.cidade} - {endereco.estado}

              </p>

              {endereco.cep && (

                <p className="text-zinc-400 text-sm mt-2">

                  CEP {endereco.cep}

                </p>

              )}

            </div>

            <MapPin
              size={22}
              className="text-zinc-400"
            />

          </div>

        </div>

      ))}

    </div>

  )}

</div>

{/* ===========================
      AÇÕES
=========================== */}

<div className="mt-10">

  <button
    onClick={sair}
    className="
      w-full
      h-12
      rounded-2xl
      border
      border-zinc-300
      text-zinc-500
      font-medium
      flex
      items-center
      justify-center
      gap-2
      transition
      hover:border-red-400
      hover:text-red-500
      hover:bg-red-50
    "
  >
    <LogOut size={18} />
    Sair da conta
  </button>

</div>

</>

)}

</div>

</div>

<EditAddresses
  open={addressOpen}
  onClose={() => setAddressOpen(false)}
/>

<EditProfile
  open={editOpen}
  onClose={() => setEditOpen(false)}
  cliente={dados?.cliente}
  onSaved={async () => {
    const slug = window.location.pathname.split("/")[1];

const token = localStorage.getItem(
  `cliente_token-${slug}`
);

    if (!token) return;

    const response = await fetch(`/api/cliente/me?token=${token}`);
    const resultado = await response.json();

    if (resultado.success) {
      setDados(resultado);
    }
  }}
/>

<LoginCustomer
  open={loginOpen}
  onClose={() => {
    setLoginOpen(false);
    onClose();
  }}
  onSuccess={async () => {
    setLoginOpen(false);

    const slug = window.location.pathname.split("/")[1];

const token = localStorage.getItem(
  `cliente_token-${slug}`
);

    if (!token) return;

    const response = await fetch(
      `/api/cliente/me?token=${token}`
    );

    const resultado = await response.json();

    if (resultado.success) {
      setDados(resultado);
    }
  }}
/>

</>
);
}