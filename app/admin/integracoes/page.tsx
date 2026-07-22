"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function IntegracoesPage() {
  const [pixelId, setPixelId] = useState("");
  const [restauranteId, setRestauranteId] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarPixel();
  }, []);

async function carregarPixel() {
  try {
    setCarregando(true);

    const id =
      localStorage.getItem("restaurante_id") || "";

    if (!id) {
      console.error("Restaurante não encontrado no localStorage.");
      return;
    }

    setRestauranteId(id);

    const { data: restaurante, error } = await supabase
      .from("restaurantes")
      .select("id, meta_pixel_id")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Erro ao buscar restaurante:", error);
      return;
    }

    if (restaurante) {
      setPixelId(restaurante.meta_pixel_id || "");
    }
  } catch (error) {
    console.error("Erro ao carregar Pixel:", error);
  } finally {
    setCarregando(false);
  }
}


  async function salvarPixel() {
    try {
      if (!restauranteId) {
        alert("Restaurante não encontrado.");
        return;
      }

      const pixelLimpo = pixelId.replace(/\D/g, "");

      if (pixelId && !pixelLimpo) {
        alert("Digite um ID de Pixel válido.");
        return;
      }

      setSalvando(true);

      const { error } = await supabase
        .from("restaurantes")
        .update({
          meta_pixel_id: pixelLimpo || null,
        })
        .eq("id", restauranteId);

      if (error) {
        console.error("Erro ao salvar Pixel:", error);
        alert("Erro ao salvar o Meta Pixel.");
        return;
      }

      setPixelId(pixelLimpo);

      alert("Meta Pixel salvo com sucesso!");
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao salvar o Meta Pixel.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F6F4] p-6 md:p-10">
      <div className="mx-auto max-w-4xl">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Integrações
          </h1>

          <p className="mt-2 text-gray-500">
            Conecte ferramentas externas ao seu cardápio.
          </p>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">

          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Meta Pixel
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Adicione o ID do seu Meta Pixel para acompanhar ações
              realizadas pelos clientes no seu cardápio e medir os
              resultados das campanhas do Facebook e Instagram.
            </p>
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              ID do Pixel
            </label>

            <input
              type="text"
              inputMode="numeric"
              value={pixelId}
              onChange={(e) =>
                setPixelId(e.target.value.replace(/\D/g, ""))
              }
              disabled={carregando}
              placeholder="Ex: 123456789012345"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-[#6D1F2F] focus:ring-1 focus:ring-[#6D1F2F]"
            />

            <p className="mt-2 text-xs text-gray-500">
              Você encontra esse número no Gerenciador de Eventos da Meta.
            </p>
          </div>

          <button
            type="button"
            onClick={salvarPixel}
            disabled={salvando || carregando}
            className="rounded-xl bg-[#6D1F2F] px-6 py-3 font-semibold text-white transition hover:bg-[#531723] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {carregando
              ? "Carregando..."
              : salvando
              ? "Salvando..."
              : "Salvar integração"}
          </button>

        </div>

      </div>
    </div>
  );
}