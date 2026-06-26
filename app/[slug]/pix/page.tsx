"use client";

import { Suspense, useEffect } from "react";
import {
  useSearchParams,
  useParams,
} from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";

function PixContent() {
  const searchParams = useSearchParams();
  const params = useParams();

  const slug = params.slug as string;

  const qrCode = searchParams.get("qr");
  const pedidoId = searchParams.get("id");

  if (!qrCode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        QR Code não encontrado.
      </div>
    );
  }

  const codigoPix = decodeURIComponent(qrCode);

  useEffect(() => {
    if (!pedidoId) return;

    const intervalo = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/pedido-status?id=${pedidoId}`
        );

        const data = await response.json();

        console.log(
          "STATUS PEDIDO:",
          data.payment_status
        );

        if (
          data.payment_status ===
          "approved"
        ) {
          clearInterval(intervalo);

          window.location.href =
            `/${slug}/pedido-aprovado`;
        }
      } catch (error) {
        console.error(error);
      }
    }, 3000);

    return () => clearInterval(intervalo);
  }, [pedidoId, slug]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">

      <h1 className="text-3xl font-bold mb-6">
        Pagamento PIX
      </h1>

      <QRCodeCanvas
        value={codigoPix}
        size={280}
      />

      <textarea
        readOnly
        value={codigoPix}
        className="w-full max-w-xl border rounded-lg p-3 mt-6"
      />

      <button
        onClick={() => {
          navigator.clipboard.writeText(codigoPix);
          alert("PIX copiado!");
        }}
        className="mt-6 bg-green-600 text-white px-6 py-3 rounded-lg"
      >
        Copiar PIX
      </button>

    </div>
  );
}

export default function PixPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <PixContent />
    </Suspense>
  );
}