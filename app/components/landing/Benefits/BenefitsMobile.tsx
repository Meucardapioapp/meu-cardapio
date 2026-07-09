"use client";

import {
  Pizza,
  Beef,
  Soup,
  Sandwich,
  CakeSlice,
  CookingPot,
  Drumstick,
  Store,
} from "lucide-react";

const nichos = [
  { icon: Beef, label: "Hamburguerias" },
  { icon: Pizza, label: "Pizzarias" },
  { icon: Soup, label: "Açaíterias", active: true },
  { icon: Sandwich, label: "Sushi" },
  { icon: CakeSlice, label: "Doces / Bolos" },
  { icon: CookingPot, label: "Marmitarias" },
  { icon: Drumstick, label: "Churrascarias" },
  { icon: Store, label: "E muito mais" },
];

export default function BenefitsMobile() {
  return (
    <section className="bg-[#F8F6F4] px-5 pt-0 py-12">
      <div className="rounded-[28px] border border-[#ECE7E3] bg-white p-6 shadow-sm">
        <h2 className="text-center text-3xl font-black leading-tight">
          Cardápio{" "}
          <span className="text-[#6D1F2F]">
            ideal
          </span>{" "}
          para:
        </h2>

        <div className="mt-8 grid grid-cols-4 gap-3">
          {nichos.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className={`rounded-2xl border p-3 text-center transition ${
                  item.active
                    ? "border-[#6D1F2F] bg-[#FFF7F7]"
                    : "border-[#ECE7E3] bg-white"
                }`}
              >
                <div
                  className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
                    item.active
                      ? "bg-[#6D1F2F] text-white"
                      : "bg-[#F7F3F1] text-[#6D1F2F]"
                  }`}
                >
                  <Icon size={22} />
                </div>

                <p className="mt-3 text-[11px] font-semibold leading-tight">
                  {item.label}
                </p>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500">
          E qualquer outro tipo de empresa de delivery!
        </p>
      </div>
    </section>
  );
}