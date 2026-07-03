"use client";

import { Loader2 } from "lucide-react";
import { useRestaurant } from "@/contexts/RestaurantContext";

export default function Loading() {
  const {
    logo,
    corPrincipal,
  } = useRestaurant();

  return (
    <main
      className="
        min-h-screen
        bg-[#F4F1EA]
        flex
        items-center
        justify-center
        px-6
      "
    >
      <div
        className="
          w-full
          max-w-md
          flex
          flex-col
          items-center
        "
      >
        {/* LOGO */}

        <div
          className="
            w-32
            h-32
            rounded-full
            bg-white
            shadow-xl
            flex
            items-center
            justify-center
            overflow-hidden
            border-4
          "
          style={{
            borderColor: corPrincipal || "#6D1F2F",
          }}
        >
          {logo ? (
            <img
              src={logo}
              alt="Logo"
              className="
                w-full
                h-full
                object-cover
              "
            />
          ) : (
            <Loader2
              size={44}
              className="animate-spin"
              style={{
                color: corPrincipal || "#6D1F2F",
              }}
            />
          )}
        </div>

        {/* SPINNER */}

        <Loader2
          className="
            animate-spin
            mt-8
          "
          size={34}
          style={{
            color: corPrincipal || "#6D1F2F",
          }}
        />

        {/* TITULO */}

        <h1
          className="
            mt-8
            text-3xl
            font-black
            text-center
          "
        >
          Carregando informações
        </h1>

        {/* SUBTITULO */}

        <p
          className="
            mt-3
            text-zinc-500
            text-center
            leading-relaxed
          "
        >
          Aguarde apenas alguns segundos enquanto
          preparamos tudo para você.
        </p>

        {/* BARRA */}

        <div
          className="
            mt-10
            w-full
            h-2
            bg-zinc-200
            rounded-full
            overflow-hidden
          "
        >
          <div
            className="
              loading-bar
              h-full
              rounded-full
            "
            style={{
              backgroundColor:
                corPrincipal || "#6D1F2F",
            }}
          />
        </div>

        {/* STATUS */}

        <div
          className="
            mt-10
            w-full
            space-y-4
          "
        >
          {[
            "Carregando produtos",
            "Carregando categorias",
            "Preparando cardápio",
          ].map((texto) => (
            <div
              key={texto}
              className="
                flex
                items-center
                gap-3
              "
            >
              <div
                className="
                  w-6
                  h-6
                  rounded-full
                  flex
                  items-center
                  justify-center
                  text-white
                  text-xs
                  font-bold
                  animate-pulse
                "
                style={{
                  backgroundColor:
                    corPrincipal || "#6D1F2F",
                }}
              >
                ✓
              </div>

              <span
                className="
                  text-zinc-700
                  font-medium
                "
              >
                {texto}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}