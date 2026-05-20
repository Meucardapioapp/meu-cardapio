"use client";

import { useEffect, useState } from "react";

interface Adicional {
  id: string;
  nome: string;
  preco: number;
  produto_id: string;
}

interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  imagem: string;
}

interface ProductModalProps {
  produto: Produto;
  onClose: () => void;
  onAddToCart: (item: any) => void;
}

export default function ProductModal({
  produto,
  onClose,
  onAddToCart,
}: ProductModalProps) {

  const [observacao, setObservacao] = useState("");

  const [adicionais, setAdicionais] = useState<
    Adicional[]
  >([]);

  const [selecionados, setSelecionados] = useState<
    Adicional[]
  >([]);

  useEffect(() => {

    async function fetchAdicionais() {

      try {

        const response = await fetch(
          `https://ipxadfapzgyyquznmxqf.supabase.co/rest/v1/adicionais?produto_id=eq.${produto.id}`,
          {
            headers: {
              apikey:
                "sb_publishable_qU7HvW9BCxxP7cC7lfkVZA_kfE5lblA",

              Authorization:
                "Bearer sb_publishable_qU7HvW9BCxxP7cC7lfkVZA_kfE5lblA",
            },
          }
        );

        const data = await response.json();

        setAdicionais(data || []);

      } catch (error) {

        console.log(error);

      }

    }

    fetchAdicionais();

  }, [produto.id]);

  function toggleAdicional(adicional: Adicional) {

    const exists = selecionados.find(
      (item) => item.id === adicional.id
    );

    if (exists) {

      setSelecionados(
        selecionados.filter(
          (item) => item.id !== adicional.id
        )
      );

    } else {

      setSelecionados([
        ...selecionados,
        adicional,
      ]);

    }

  }

  const totalAdicionais = selecionados.reduce(
    (acc, item) => acc + Number(item.preco),
    0
  );

  const total =
    Number(produto.preco) + totalAdicionais;

  function handleAdd() {

    onAddToCart({
      name: produto.nome,

      price: total,

      quantity: 1,

      observacao,

      adicionais: selecionados.map(
        (item) => ({
          nome: item.nome,
          preco: Number(item.preco),
        })
      ),
    });

    onClose();

  }

  return (

    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">

      <div className="bg-zinc-900 rounded-3xl w-full max-w-md overflow-hidden border border-zinc-800">

        <div className="relative">

          <img
            src={produto.imagem}
            alt={produto.nome}
            className="w-full h-64 object-cover"
          />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/60 text-white w-8 h-8 rounded-full"
          >
            ×
          </button>

        </div>

        <div className="p-5">

          <h2 className="text-3xl font-bold text-white">
            {produto.nome}
          </h2>

          <p className="text-zinc-400 mt-2">
            {produto.descricao}
          </p>

          {/* ADICIONAIS */}
          <div className="mt-6">

            <h3 className="text-white font-semibold text-lg mb-3">
              Adicionais
            </h3>

            {adicionais.length === 0 ? (

              <p className="text-zinc-500">
                Nenhum adicional disponível
              </p>

            ) : (

              <div className="space-y-3">

                {adicionais.map((adicional) => {

                  const active = selecionados.find(
                    (item) => item.id === adicional.id
                  );

                  return (

                    <button
                      key={adicional.id}
                      onClick={() =>
                        toggleAdicional(adicional)
                      }
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition ${
                        active
                          ? "border-green-500 bg-green-500/10"
                          : "border-zinc-700 bg-zinc-800"
                      }`}
                    >

                      <div className="text-left">

                        <p className="text-white font-medium">
                          {adicional.nome}
                        </p>

                        <p className="text-green-400 text-sm">
                          + R$ {Number(adicional.preco).toFixed(2)}
                        </p>

                      </div>

                      <div
                        className={`w-5 h-5 rounded border ${
                          active
                            ? "bg-green-500 border-green-500"
                            : "border-zinc-500"
                        }`}
                      />

                    </button>

                  );

                })}

              </div>

            )}

          </div>

          {/* OBSERVAÇÃO */}
          <div className="mt-6">

            <h3 className="text-white font-semibold mb-2">
              Observações
            </h3>

            <textarea
              value={observacao}
              onChange={(e) =>
                setObservacao(e.target.value)
              }
              placeholder="Ex: sem cebola, pouco molho..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-4 text-white outline-none resize-none h-28"
            />

          </div>

          {/* TOTAL */}
          <div className="mt-8 flex items-center justify-between">

            <div>

              <p className="text-zinc-400 text-sm">
                Total
              </p>

              <p className="text-3xl font-bold text-green-400">
                R$ {total.toFixed(2)}
              </p>

            </div>

            <button
              onClick={handleAdd}
              className="bg-green-500 hover:bg-green-600 transition px-8 py-4 rounded-2xl text-white font-semibold"
            >
              Adicionar
            </button>

          </div>

        </div>

      </div>

    </div>

  );

}