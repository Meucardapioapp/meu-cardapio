"use client";

import { Search, Package, User } from "lucide-react";
import { useState } from "react";
import CustomerArea from "./CustomerArea";

type Props = {
  corPrincipal: string;
};

export default function BottomNavigation({
  corPrincipal,
}: Props) {
  const [openCustomer, setOpenCustomer] = useState(false);

  return (
    <>
      <div
        className="
          fixed
          bottom-0
          left-0
          right-0
          z-[998]

          bg-white/95
          backdrop-blur-xl

          border-t
          border-zinc-200

          shadow-[0_-12px_32px_rgba(0,0,0,0.08)]

          pb-[env(safe-area-inset-bottom)]
        "
      >
        <div
          className="
            h-[80px]
            flex
            items-center
            justify-around
          "
        >
          {/* Buscar */}

          <button
            className="
              w-[72px]
              h-[54px]

              rounded-2xl

              flex
              flex-col
              items-center
              justify-center
              gap-1

              transition-all
              duration-200

              active:scale-95
            "
            style={{
              backgroundColor: `${corPrincipal}15`,
            }}
          >
            <Search
              size={23}
              strokeWidth={2.4}
              color={corPrincipal}
            />

            <span
              className="
                text-[12px]
                font-semibold
              "
              style={{
                color: corPrincipal,
              }}
            >
              Buscar
            </span>
          </button>

          {/* Pedidos */}

          <button
            className="
              w-[72px]
              h-[54px]

              rounded-2xl

              flex
              flex-col
              items-center
              justify-center
              gap-1

              transition-all
              duration-200

              hover:bg-zinc-50
              active:scale-95
            "
          >
            <Package
              size={22}
              strokeWidth={2.3}
              color="#71717A"
            />

            <span
              className="
                text-[12px]
                font-medium
                text-zinc-500
              "
            >
              Pedidos
            </span>
          </button>

          {/* Conta */}

          <button
            onClick={() => setOpenCustomer(true)}
            className="
              w-[72px]
              h-[54px]

              rounded-2xl

              flex
              flex-col
              items-center
              justify-center
              gap-1

              transition-all
              duration-200

              hover:bg-zinc-50
              active:scale-95
            "
          >
            <User
              size={22}
              strokeWidth={2.3}
              color="#71717A"
            />

            <span
              className="
                text-[12px]
                font-medium
                text-zinc-500
              "
            >
              Conta
            </span>
          </button>
        </div>
      </div>

      <CustomerArea
        open={openCustomer}
        onClose={() => setOpenCustomer(false)}
      />
    </>
  );
}