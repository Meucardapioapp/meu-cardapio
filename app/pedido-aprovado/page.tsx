"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function Conteudo() {
  const searchParams = useSearchParams();

  const pedidoId =
    searchParams.get("id");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-3xl shadow-lg p-8 max-w-lg w-full text-center">

        <div className="text-6xl mb-4">
          ✅
        </div>

        <h1 className="text-3xl font-bold mb-4">
          Pagamento aprovado!
        </h1>

        <p className="text-gray-600 mb-6">
          Seu pedido foi recebido com sucesso.
        </p>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <p className="font-semibold">
            Pedido #{pedidoId}
          </p>

          <p className="text-sm text-gray-600 mt-2">
            O restaurante já recebeu seu pedido e iniciará o preparo em breve.
          </p>
        </div>

        <button
          onClick={() => {
            window.location.href =
              `/pedido/${pedidoId}`;
          }}
          className="w-full bg-green-600 text-white py-4 rounded-xl font-bold"
        >
          Acompanhar pedido
        </button>
      </div>
    </div>
  );
}

export default function PedidoAprovadoPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <Conteudo />
    </Suspense>
  );
}