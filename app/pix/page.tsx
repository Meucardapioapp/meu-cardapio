"use client";

import { useSearchParams } from "next/navigation";

export default function PixPage() {
  const searchParams = useSearchParams();

  const qrCode =
    searchParams.get("qr");

  const qrCodeBase64 =
    searchParams.get("img");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">

      <h1 className="text-2xl font-bold mb-6">
        Pagamento PIX
      </h1>

      {qrCodeBase64 && (
        <img
          src={`data:image/png;base64,${qrCodeBase64}`}
          alt="QR Code PIX"
          className="w-72 h-72 mb-6"
        />
      )}

      <textarea
        readOnly
        value={qrCode || ""}
        className="w-full max-w-xl border rounded-lg p-3 text-sm"
      />

      <button
        className="mt-4 bg-green-600 text-white px-6 py-3 rounded-lg"
        onClick={() => {
          navigator.clipboard.writeText(
            qrCode || ""
          );

          alert(
            "PIX copiado!"
          );
        }}
      >
        Copiar código PIX
      </button>

    </div>
  );
}