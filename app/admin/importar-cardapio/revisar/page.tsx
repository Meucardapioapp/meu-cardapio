"use client";

import { useEffect, useState } from "react";

export default function RevisarImportacaoPage() {
  const [dados, setDados] = useState<any>(null);

  useEffect(() => {
    const json = localStorage.getItem("importacao-cardapio");

    if (json) {
      setDados(JSON.parse(json));
    }
  }, []);

  if (!dados) {
    return (
      <div className="p-10">
        Carregando...
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">

      <h1 className="text-3xl font-bold">
        Revisar Importação
      </h1>

      <div className="grid grid-cols-4 gap-4">

        <div className="border rounded-xl p-5">
          <h2 className="text-sm text-gray-500">Produtos</h2>
          <p className="text-3xl font-bold">
            {dados.produtos?.length || 0}
          </p>
        </div>

        <div className="border rounded-xl p-5">
          <h2 className="text-sm text-gray-500">Categorias</h2>
          <p className="text-3xl font-bold">
            {dados.categorias?.length || 0}
          </p>
        </div>

        <div className="border rounded-xl p-5">
          <h2 className="text-sm text-gray-500">Imagens</h2>
          <p className="text-3xl font-bold">
            {dados.imagens?.length || 0}
          </p>
        </div>

        <div className="border rounded-xl p-5">
          <h2 className="text-sm text-gray-500">Adicionais</h2>
          <p className="text-3xl font-bold">
            {dados.adicionais?.length || 0}
          </p>
        </div>

      </div>

      <table className="w-full border">

        <thead>

          <tr className="bg-gray-100">

            <th className="p-3 text-left">
              Produto
            </th>

            <th className="p-3 text-left">
              Categoria
            </th>

            <th className="p-3 text-left">
              Preço
            </th>

          </tr>

        </thead>

        <tbody>

          {dados.produtos?.map((produto: any) => (

            <tr key={produto.id} className="border-t">

              <td className="p-3">
                {produto.nome}
              </td>

              <td className="p-3">
                {produto.categoria}
              </td>

              <td className="p-3">
                {produto.preco}
              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}