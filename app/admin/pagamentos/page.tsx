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
  dinheiro: true,
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
  dinheiro:
    data.dinheiro ?? true,

  cartao_entrega:
    data.cartao_entrega ?? true,
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

    const { error } = await supabase
      .from("configuracoes_pagamento")
      .upsert({
        restaurante_id: restauranteId,

        dinheiro:
          config.dinheiro,

        cartao_entrega:
          config.cartao_entrega,
      });

    if (error) {
      console.log(error);
      alert("Erro ao salvar");
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
    <div className="max-w-6xl mx-auto p-8">

      <h1 className="text-5xl font-black text-zinc-900">
        Configurações de Pagamento
      </h1>

      <p className="text-zinc-500 text-xl mt-3 mb-8">
        Gerencie as formas de pagamento
        aceitas no seu restaurante
      </p>

      {/* ONLINE */}

      <div className="bg-white rounded-[32px] border border-zinc-200 shadow-sm p-8 mb-8">

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
              "Cartão Online (Crédito e Débito)",
              "Google Pay",
              "Apple Pay",
              "NuPay",
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

          <div className="bg-green-50 border border-green-200 rounded-[24px] p-6">

            <h3 className="text-green-800 font-black text-2xl mb-4">
              Importante
            </h3>

            <p className="text-green-700 mb-4">
              Os pagamentos online não
              podem ser desativados.
            </p>

            <p className="text-green-700">
              Eles ajudam a aumentar suas
              vendas e agilizam o processo
              de entrega.
            </p>

          </div>

        </div>

      </div>

      {/* ENTREGA */}

      <div className="bg-white rounded-[32px] border border-zinc-200 shadow-sm p-8 mb-8">

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
                      Dinheiro
                    </h3>

                    <p className="text-zinc-500">
                      Permitir que o cliente
                      pague em dinheiro ao
                      entregador
                    </p>

                  </div>

                </div>

                <Toggle
                  checked={config.dinheiro}
                  onChange={() =>
                    setConfig({
                      ...config,
                      dinheiro:
                        !config.dinheiro,
                    })
                  }
                />

              </div>

              <div className="flex items-center justify-between p-6">

                <div className="flex gap-4">

                  <CreditCard
                    className="text-red-700"
                  />

                  <div>

                    <h3 className="font-bold text-xl">
                      Cartão na Entrega
                    </h3>

                    <p className="text-zinc-500">
                      Permitir que o cliente
                      pague com cartão na
                      entrega
                    </p>

                  </div>

                </div>

                <Toggle
                  checked={
                    config.cartao_entrega
                  }
                  onChange={() =>
                    setConfig({
                      ...config,
                      cartao_entrega:
                        !config.cartao_entrega,
                    })
                  }
                />

              </div>

            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-[24px] p-5">

              <p className="text-blue-700">
                <strong>Observação:</strong>
                {" "}
                Se você não possui máquina
                de cartão ou entregador,
                desative as opções acima.
              </p>

            </div>
          </>

      </div>

      {/* RODAPÉ */}

      <div className="bg-white rounded-[32px] border border-zinc-200 shadow-sm p-8 flex flex-col lg:flex-row justify-between items-center gap-6">

        <div className="flex items-center gap-4">

          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">

            <Shield
              className="text-red-700"
            />

          </div>

          <div>

            <h3 className="font-black text-xl">
              Suas alterações são salvas
              automaticamente
            </h3>

            <p className="text-zinc-500">
              Sempre que você modificar as
              configurações elas serão
              aplicadas imediatamente.
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
            py-4
            rounded-2xl
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