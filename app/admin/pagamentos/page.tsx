"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  CreditCard,
  Banknote,
  Check,
  Shield,
  Save,
} from "lucide-react";

export default function PagamentosPage() {
  const [loading, setLoading] = useState(true);

const [config, setConfig] = useState({
  dinheiro: false,
  cartao_entrega: true,
});

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  async function carregarConfiguracoes() {
    try {
      const restauranteId =
        localStorage.getItem("restaurante_id");

      if (!restauranteId) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("configuracoes_pagamento")
        .select("*")
        .eq("restaurante_id", restauranteId)
        .single();

      if (data) {

setConfig({
  dinheiro: data.dinheiro ?? false,
  cartao_entrega: data.cartao_entrega ?? true,
});

      }
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  }

  async function salvarConfiguracoes() {
    const restauranteId =
      localStorage.getItem("restaurante_id");

    if (!restauranteId) {
      alert("Restaurante não encontrado");
      return;
    }

console.log("SALVANDO...");
console.log({
  restauranteId,
  dinheiro: config.dinheiro,
});

const { data, error } = await supabase
  .from("configuracoes_pagamento")
  .upsert({
  restaurante_id: restauranteId,
  dinheiro: config.dinheiro,
  cartao_entrega: config.cartao_entrega,
},
    {
      onConflict: "restaurante_id",
    }
  )
  .select();

console.log("RESULTADO:", data);
console.log("ERRO:", error);

  if (error) {
  console.error(error);
  alert(JSON.stringify(error, null, 2));
  return;
}  

    alert("Configurações salvas");
  }

  function Toggle({
    checked,
    onChange,
  }: any) {
    return (
      <button
        onClick={onChange}
        className={`
          relative
          w-14
          h-8
          rounded-full
          transition-all
          ${
            checked
              ? "bg-red-700"
              : "bg-zinc-300"
          }
        `}
      >
        <div
          className={`
            absolute
            top-1
            w-6
            h-6
            bg-white
            rounded-full
            transition-all
            ${
              checked
                ? "left-7"
                : "left-1"
            }
          `}
        />
      </button>
    );
  }

  if (loading) {
    return (
      <div className="p-10">
        Carregando...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8">

      <h1 className="text-5xl font-black text-zinc-900">
        Configurações de Pagamento
      </h1>

      <p className="text-zinc-500 text-xl mt-3 mb-8">
        Gerencie as formas de pagamento
        aceitas no seu restaurante
      </p>

      {/* ONLINE */}

<div className="bg-white rounded-[28px] border border-zinc-200 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-4xl font-black">
            Pagamento Online
          </h2>

          <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold">
            Ativo
          </span>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">

          <div className="space-y-5">

            {[
              "PIX",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-4"
              >
                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                  <Check
                    size={16}
                    className="text-green-700"
                  />
                </div>

                <span className="text-xl">
                  {item}
                </span>
              </div>
            ))}

          </div>

<div className="bg-green-50 border border-green-200 rounded-2xl p-5">

  <div className="flex items-center gap-2 mb-4">

    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
      <Check size={16} className="text-green-700" />
    </div>

    <h3 className="text-lg font-black text-green-800">
      Processamento automático
    </h3>

  </div>

  <p className="text-green-700 leading-7">
Pix fica disponível
automaticamente para todos os
clientes.
  </p>

</div>

        </div>

      </div>

      {/* ENTREGA */}

      <div className="bg-white rounded-[28px] border border-zinc-200 shadow-sm p-6 mb-6">

        <div className="flex items-center justify-between mb-8">

          <div>

            <h2 className="text-4xl font-black">
              Pagamento na Entrega
            </h2>

            <p className="text-zinc-500 mt-2">
              Escolha se deseja aceitar
              pagamentos no momento da
              entrega.
            </p>

          </div>

        </div>

          <>
            <div className="border rounded-[24px] overflow-hidden">

              <div className="flex items-center justify-between p-6 border-b">

                <div className="flex gap-4">

                  <Banknote
                    className="text-red-700"
                  />

                  <div>

                    <h3 className="font-bold text-xl">
                       Aceitar dinheiro na entrega
                    </h3>

<p className="text-zinc-500 mt-1">
  Quando ativado, esta opção será exibida
  aos clientes durante o checkout.
</p>

                  </div>

                </div>

<div className="flex flex-col items-end">

  <span
    className={`text-sm font-bold ${
      config.dinheiro
        ? "text-green-600"
        : "text-zinc-400"
    }`}
  >
    {config.dinheiro
      ? "ATIVO"
      : "DESATIVADO"}
  </span>

  <div className="mt-2">

    <Toggle
      checked={config.dinheiro}
      onChange={() =>
        setConfig({
          ...config,
          dinheiro: !config.dinheiro,
        })
      }
    />

  </div>

</div>

              </div>

              

            </div>

            <div className="flex items-center justify-between p-6 border-b">

  <div className="flex gap-4">

    <CreditCard className="text-red-700" />

    <div>

      <h3 className="font-bold text-xl">
        Aceitar cartão de crédito ou débito
      </h3>

      <p className="text-zinc-500 mt-1">
        Quando ativado, o cliente poderá pagar com cartão de crédito ou débito na entrega.
      </p>

    </div>

  </div>

  <div className="flex flex-col items-end">

    <span
      className={`text-sm font-bold ${
        config.cartao_entrega
          ? "text-green-600"
          : "text-zinc-400"
      }`}
    >
      {config.cartao_entrega
        ? "ATIVO"
        : "DESATIVADO"}
    </span>

    <div className="mt-2">

      <Toggle
        checked={config.cartao_entrega}
        onChange={() =>
          setConfig({
            ...config,
            cartao_entrega: !config.cartao_entrega,
          })
        }
      />

    </div>

  </div>

</div>

<div className="mt-5 bg-zinc-50 border border-zinc-200 rounded-2xl p-5">
             <p className="text-blue-600 leading-7">
  <strong>Importante:</strong> 
Quando as opções de pagamento na entrega estiverem desativadas, os clientes poderão finalizar pedidos apenas utilizando Pix.
</p>

            </div>
          </>

      </div>

      {/* RODAPÉ */}

      <div className="bg-white rounded-[28px] border border-zinc-200 shadow-sm p-6 flex flex-col lg:flex-row justify-between items-center gap-6">

        <div>

 

          <div>

 <h3 className="font-black text-xl">
  Revise suas configurações
</h3>

<p className="text-zinc-500">
  Após clicar em "Salvar Alterações",
  as novas configurações serão aplicadas
  imediatamente ao seu cardápio.
</p>

          </div>

        </div>

        <button
          onClick={salvarConfiguracoes}
          className="
            bg-red-700
            hover:bg-red-800
            text-white
            px-10
            py-5
            rounded-3xl
            font-black
            flex
            items-center
            gap-3
          "
        >
          <Save size={20} />
          Salvar Alterações
        </button>

      </div>

    </div>
  );
}