"use client";

import { useParams } from "next/navigation";

export default function EnderecoPage() {

  const params = useParams();

  const slug = params.slug as string;

  return (

    <main
      className="
        min-h-screen
        bg-[#F4F1EA]
        p-4
      "
    >

      <h1
        className="
          text-3xl
          font-black
          mb-6
        "
      >
        Endereço
      </h1>

      <div
        className="
          bg-white
          rounded-xl
          p-4
        "
      >
        Página em desenvolvimento
      </div>

      <button
        onClick={() => {
          window.location.href =
            `/${slug}/pagamento`;
        }}
        className="
          mt-6
          bg-green-600
          text-white
          px-6
          py-4
          rounded-xl
          font-bold
        "
      >
        Continuar
      </button>

    </main>

  );
}