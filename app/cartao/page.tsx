"use client";

import { initMercadoPago, CardPayment } from "@mercadopago/sdk-react";

console.log(
  "PUBLIC KEY:",
  process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
)

initMercadoPago(
  "APP_USR-5d7cdd9b-818a-4645-b257-9a45c9f26141"
)

export default function CartaoPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">

        <h1 className="text-3xl font-bold mb-6">
          Pagamento com cartão
        </h1>

        <CardPayment
          initialization={{
            amount: 10,
          }}
          onSubmit={async (formData) => {
            console.log(formData);
          }}
        />

      </div>
    </main>
  );
}