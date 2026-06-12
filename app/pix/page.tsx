"use client";

import {
  Suspense,
  useEffect,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

function PixContent() {
  const router = useRouter();

  const searchParams =
    useSearchParams();

  const pedidoId =
    searchParams.get("id");

  const qrCode =
    searchParams.get("qr");

  const qrCodeBase64 =
    searchParams.get("img");

  useEffect(() => {
    if (!pedidoId) return;

    const interval = setInterval(
      async () => {
        try {
          const response = await fetch(
            `/api/pedido-status?id=${pedidoId}`
          );

          const data =
  await response.json();

console.log(
  "STATUS RECEBIDO:",
  data.payment_status
);

console.log(
  "PEDIDO:",
  pedidoId
);

if (
  data.payment_status ===
  "approved"
) {
            clearInterval(
              interval
            );

            router.push(
              `/pedido-aprovado?id=${pedidoId}`
            );
          }
        } catch (error) {
          console.error(error);
        }
      },
      3000
    );

    return () =>
      clearInterval(interval);
  }, [pedidoId, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold mb-6">
        Pagamento PIX
      </h1>

      <p className="mb-4 text-center text-gray-600">
        Aguardando confirmação do pagamento...
      </p>

      {qrCodeBase64 ? (
        <img
          src={`data:image/png;base64,${decodeURIComponent(
            qrCodeBase64
          )}`}
          alt="QR Code PIX"
          className="w-72 h-72 mb-6"
        />
      ) : (
        <p>
          QR Code não encontrado.
        </p>
      )}

      <textarea
        readOnly
        value={
          qrCode
            ? decodeURIComponent(
                qrCode
              )
            : ""
        }
        className="w-full max-w-xl border rounded-lg p-3 text-sm"
      />

      <button
        className="mt-4 bg-green-600 text-white px-6 py-3 rounded-lg"
        onClick={() => {
          navigator.clipboard.writeText(
            qrCode
              ? decodeURIComponent(
                  qrCode
                )
              : ""
          );

          alert("PIX copiado!");
        }}
      >
        Copiar código PIX
      </button>
    </div>
  );
}

export default function PixPage() {
  return (
    <Suspense
      fallback={
        <div>
          Carregando...
        </div>
      }
    >
      <PixContent />
    </Suspense>
  );
}