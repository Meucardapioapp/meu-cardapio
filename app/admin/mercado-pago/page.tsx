"use client";

import { useEffect, useState } from "react";

export default function MercadoPagoPage() {
  const [restauranteId, setRestauranteId] =
    useState("");

  useEffect(() => {
    const id =
      localStorage.getItem(
        "restaurante_id"
      ) || "";

    console.log(
      "ID RESTAURANTE:",
      id
    );

    setRestauranteId(id);
  }, []);

  return (
    <div>
      <h1 className="text-4xl font-black">
        Mercado Pago
      </h1>

      <p className="mt-4 text-zinc-500">
        Conecte sua conta Mercado Pago
      </p>

      <p className="mt-4 text-red-500 font-bold">
        ID: {restauranteId}
      </p>

      <p className="mt-4 text-blue-500 break-all">
        URL:
        {` /api/mercadopago/connect?restaurante_id=${restauranteId}`}
      </p>

      <a
        href={`/api/mercadopago/connect?restaurante_id=${restauranteId}`}
        className="
          inline-flex
          mt-8
          rounded-2xl
          bg-[#009EE3]
          px-6
          py-4
          font-bold
          text-white
        "
      >
        Conectar Mercado Pago
      </a>
    </div>
  );
}