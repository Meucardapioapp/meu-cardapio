"use client";

import { useRestaurant } from "@/contexts/RestaurantContext";

export default function SplashScreen() {
  const { corPrincipal } = useRestaurant();

  return (
    <main
      className="
        fixed
        inset-0
        z-[999999]
        flex
        items-center
        justify-center
      "
      style={{
        backgroundColor: corPrincipal,
      }}
    >
      <div
        className="
          flex
          flex-col
          items-center
          gap-8
        "
      >
        {/* BOLINHAS */}

        <div className="flex gap-3">
          <span
            className="
              w-4
              h-4
              rounded-full
              bg-white
              animate-bounce
            "
          />

          <span
            className="
              w-4
              h-4
              rounded-full
              bg-white
              animate-bounce
            "
            style={{
              animationDelay: "120ms",
            }}
          />

          <span
            className="
              w-4
              h-4
              rounded-full
              bg-white
              animate-bounce
            "
            style={{
              animationDelay: "240ms",
            }}
          />
        </div>
      </div>
    </main>
  );
}