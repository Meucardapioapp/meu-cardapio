"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useParams,
  useSearchParams,
} from "next/navigation";

import Link from "next/link";

import { motion } from "framer-motion";

import {
  ArrowLeft,
  Clock3,
  Copy,
  ShieldCheck,
  LoaderCircle,
  CircleCheckBig,
  Share2,
} from "lucide-react";

import { QRCodeCanvas } from "qrcode.react";

import { supabase } from "@/lib/supabase";

function PixContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const slug = params.slug as string;

  const qrCode = searchParams.get("qr");
  const pedidoId = searchParams.get("id");

  const codigoPix = useMemo(() => {
    if (!qrCode) return "";
    return decodeURIComponent(qrCode);
  }, [qrCode]);

  const [logo, setLogo] = useState("");

  const [banner, setBanner] = useState("");

  const [nomeRestaurante, setNomeRestaurante] =
    useState("");

  const [corPrincipal, setCorPrincipal] =
    useState("#6D1F2F");

  const [copiado, setCopiado] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [pagamentoAprovado, setPagamentoAprovado] =
    useState(false);

  const [segundos, setSegundos] =
    useState(60 * 60);

  async function carregarRestaurante() {
    try {
      const {
        data: restaurante,
      } = await supabase
        .from("restaurantes")
        .select("*")
        .eq("slug", slug)
        .single();

      if (!restaurante) return;

      const {
        data: aparencia,
      } = await supabase
        .from("aparencia")
        .select("*")
        .eq(
          "restaurante_id",
          restaurante.id
        )
        .single();

      setNomeRestaurante(
        aparencia?.nome_restaurante ||
          restaurante.nome ||
          ""
      );

      setLogo(
        aparencia?.logo_url || ""
      );

      setBanner(
        aparencia?.banner_url || ""
      );

      setCorPrincipal(
        aparencia?.cor_primaria ||
          "#6D1F2F"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarRestaurante();
  }, [slug]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSegundos((old) => {
        if (old <= 1) {
          clearInterval(timer);
          return 0;
        }

        return old - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!pedidoId) return;

    const intervalo = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/pedido-status?id=${pedidoId}`
        );

        const data =
          await response.json();

        if (
          data.payment_status ===
          "approved"
        ) {
          clearInterval(intervalo);

          setPagamentoAprovado(true);

          setTimeout(() => {
            window.location.href =
              `/${slug}/pedido-aprovado?id=${pedidoId}`;
          }, 1000);
        }
      } catch {}
    }, 3000);

    return () =>
      clearInterval(intervalo);
  }, [pedidoId, slug]);

  function copiarPix() {
    navigator.clipboard.writeText(
      codigoPix
    );

    setCopiado(true);

    setTimeout(() => {
      setCopiado(false);
    }, 2500);
  }

  function compartilhar() {
    if (
      navigator.share
    ) {
      navigator.share({
        title: "PIX",
        text: codigoPix,
      });

      return;
    }

    copiarPix();
  }

  const minutos = String(
    Math.floor(segundos / 60)
  ).padStart(2, "0");

  const segundosTexto = String(
    segundos % 60
  ).padStart(2, "0");

  if (!codigoPix) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg font-semibold">
        QR Code não encontrado.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <LoaderCircle
          className="animate-spin"
          size={40}
        />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F5F7]">
      <div
  className="relative pb-36"
        style={{
          background: `linear-gradient(
180deg,
${corPrincipal} 0%,
${corPrincipal}EE 100%
)`,
        }}
      >

        <div className="relative max-w-md mx-auto px-5 pt-6">
          <div className="flex items-center justify-between">
            <Link
              href={`/${slug}`}
              className="w-12 h-12 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-white"
            >
              <ArrowLeft size={22} />
            </Link>

            <div />

          </div>

        

          <motion.div
            initial={{
              opacity: 0,
              y: -20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mt-8 flex flex-col items-center"
          >
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-xl bg-white">
              {logo && (
                <img
                  src={logo}
                  className="w-full h-full object-cover"
                  alt=""
                />
              )}
            </div>

            <h1 className="mt-4 text-white text-4xl font-black text-center">
              {nomeRestaurante}
            </h1>

            <div className="mt-3 flex items-center gap-2 text-white/90">
              <ShieldCheck size={18} />

              <span className="font-medium">
                Pagamento Seguro
              </span>
            </div>

            
          </motion.div>
                    <motion.div
            initial={{
              opacity: 0,
              y: 40,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.2,
            }}
            className="-mb-20 mt-10"
          >
            <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden">

              <div className="px-8 pt-10 pb-10">

                <div className="flex items-center justify-center gap-2">

  <ShieldCheck
    size={18}
    color={corPrincipal}
  />

  <span
    className="font-bold"
    style={{
      color: corPrincipal,
    }}
  >
    Pagamento via PIX
  </span>

</div>

<div className="w-full h-px bg-zinc-200 my-6" />

                <h2 className="mt-4 text-center text-3xl font-black text-zinc-900">
                  Escaneie o QR Code
                </h2>

                <p className="mt-3 text-center text-zinc-500 leading-relaxed">
                  Utilize o aplicativo do seu banco para
                  realizar o pagamento de forma rápida e segura.
                </p>

                <motion.div
                  animate={{
                    scale: [1, 1.03, 1],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                  }}
                  className="mt-8 flex justify-center"
                >
                  <div 
                  className="
rounded-[28px]
bg-white
p-4
border-2
shadow-xl
"
style={{
  borderColor: corPrincipal,
}}
>
                    <QRCodeCanvas
                      value={codigoPix}
                      size={300}
                      bgColor="#FFFFFF"
                      fgColor="#000000"
                      includeMargin
                    />

                  </div>
                </motion.div>

                <div className="mt-8 flex flex-col items-center">

  <Clock3
    size={22}
    style={{
      color: corPrincipal,
    }}
  />

  <span className="mt-2 text-zinc-500 text-sm">
    Expira em
  </span>

  <span
    className="text-5xl font-black mt-2"
    style={{
      color: corPrincipal,
    }}
  >
    {minutos}:{segundosTexto}
  </span>

</div>

                <div className="mt-8 rounded-2xl bg-green-50 border border-green-200 p-5">

                  <div className="flex items-center gap-3">

                    <CircleCheckBig
                      className="text-green-600"
                      size={24}
                    />

                    <div>

                      <h3 className="font-bold text-green-700">
                        Aprovação automática
                      </h3>

                      <p className="text-sm text-green-700 mt-1">
                        Assim que o PIX for identificado,
                        seu pedido será confirmado automaticamente.
                      </p>

                    </div>

                  </div>

                </div>

                <div className="mt-8">

                  <label className="font-semibold text-zinc-700">
                    Código PIX
                  </label>

                  <div className="mt-3 flex gap-3">

  <input
  readOnly
  value={codigoPix}
  className="
    flex-1
    rounded-xl
    border
    border-zinc-200
    bg-zinc-50
    px-4
    h-14
    text-sm
    overflow-x-auto
  "
/>

                    <button
                      onClick={copiarPix}
                      className="
                        w-16
                        rounded-2xl
                        flex
                        items-center
                        justify-center
                        text-white
                        transition-all
                        hover:scale-105
                      "
                      style={{
                        backgroundColor: corPrincipal,
                      }}
                    >
                      <Copy size={22} />
                    </button>

                  </div>

                </div>

                <button
                  onClick={copiarPix}
                  className="
                    mt-8
                    w-full
                    rounded-2xl
                    py-4
                    font-bold
                    text-white
                    text-lg
                    transition-all
                    hover:scale-[1.02]
                    active:scale-95
                  "
                  style={{
                    backgroundColor: corPrincipal,
                  }}
                >
                  {copiado
                    ? "Código copiado!"
                    : "Copiar código PIX"}
                </button>

                <motion.div
                  animate={{
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                  }}
                  className="
                    mt-8
                    rounded-2xl
                    border
                    border-yellow-200
                    bg-yellow-50
                    p-5
                  "
                >

                  <div className="flex gap-3">

                    <LoaderCircle
                      className="animate-spin text-yellow-600"
                      size={24}
                    />

                    <div>

                      <h3 className="font-bold text-yellow-700">

                        {pagamentoAprovado
                          ? "Pagamento aprovado!"
                          : "Aguardando pagamento..."}

                      </h3>

                      <p className="text-sm text-yellow-700 mt-1">

                        {pagamentoAprovado
                          ? "Redirecionando..."
                          : "Estamos verificando automaticamente o seu pagamento."}

                      </p>

                    </div>

                  </div>

                </motion.div>
                                <div className="mt-8 space-y-4">


                  <button
                    onClick={compartilhar}
                    className="
                      w-full
                      rounded-2xl
                      py-4
                      font-bold
                      text-lg
                      text-white
                      transition-all
                      hover:scale-[1.02]
                      active:scale-95
                      flex
                      items-center
                      justify-center
                      gap-3
                    "
                    style={{
                      backgroundColor: corPrincipal,
                    }}
                  >
                    <Share2 size={22} />
                    Compartilhar PIX
                  </button>

                </div>

              </div>

            </div>

          </motion.div>

        </div>

      </div>

      <div className="py-10 flex flex-col items-center">

  <div className="flex items-center gap-2 text-zinc-500">
    <ShieldCheck size={18} />
    <span className="text-sm font-medium">
      Ambiente 100% seguro
    </span>
  </div>

  <p className="mt-3 text-sm text-zinc-500">
    Pagamento processado por
  </p>

  <p className="mt-1 text-lg font-black">
    pagar.me
  </p>

</div>

    </main>
  );
}

export default function PixPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoaderCircle
            className="animate-spin"
            size={40}
          />
        </div>
      }
    >
      <PixContent />
    </Suspense>
  );
}