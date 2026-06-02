"use client"

import {
  Crown,
  CreditCard,
  QrCode,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Sparkles,
} from "lucide-react"

export default function AssinaturaPage() {
  return (
    <main className="p-8 max-w-7xl mx-auto">

      {/* Header */}

      <div className="mb-10">

        <div
          className="
            inline-flex
            items-center
            gap-2
            px-4
            py-2
            rounded-full
            border
            border-[#7A2238]
            bg-[#1B0B11]
            text-[#F4D7DF]
            mb-4
          "
        >
          <Crown size={16} />
          Assinatura Premium
        </div>

        <h1
          className="
            text-6xl
            font-black
            text-white
            leading-none
            max-w-4xl
          "
        >
          Central de Assinatura
        </h1>

        <p
          className="
            text-zinc-400
            text-lg
            mt-4
            max-w-2xl
          "
        >
          Gerencie seu plano e mantenha seu cardápio online
          com todos os recursos premium desbloqueados.
        </p>

      </div>

      {/* STATUS */}

      <div
        className="
          rounded-[32px]
          border
          border-[#3D1622]
          bg-gradient-to-r
          from-[#1B0B11]
          to-[#14090D]
          p-8
          mb-10
        "
      >
        <p className="text-zinc-500 text-sm uppercase tracking-widest">
          Status do plano
        </p>

        <div className="flex items-center gap-3 mt-3">
          <div className="w-3 h-3 rounded-full bg-red-500" />

          <h2 className="text-4xl font-black text-red-400">
            Sem assinatura ativa
          </h2>
        </div>

        <p className="text-zinc-400 mt-3">
          Assine para desbloquear todos os recursos do MeuCardápio.
        </p>
      </div>

      {/* PLANOS */}

      <div className="grid lg:grid-cols-2 gap-8">

        {/* CARTÃO */}

        <div
          className="
            relative
            overflow-hidden
            rounded-[40px]
            border
            border-[#7A2238]
            bg-gradient-to-br
            from-[#7A2238]
            via-[#5B1A2A]
            to-[#2A0E15]
            p-10
            shadow-[0_0_60px_rgba(122,34,56,0.35)]
          "
        >
          <div
            className="
              absolute
              top-0
              right-0
              w-56
              h-56
              rounded-full
              bg-white/10
              blur-3xl
            "
          />

          <div className="relative z-10">

            <div
              className="
                inline-flex
                items-center
                gap-2
                bg-white
                text-black
                px-4
                py-2
                rounded-full
                font-bold
                mb-6
              "
            >
              <Sparkles size={16} />
              RECOMENDADO
            </div>

            <div className="flex items-center gap-3 mb-4">
              <CreditCard size={26} />
              <h2 className="text-3xl font-black">
                Cartão
              </h2>
            </div>

            <div className="flex items-end gap-2">
              <span className="text-7xl font-black">
                R$59,90
              </span>
            </div>

            <p className="text-xl opacity-90 mt-1">
              por mês
            </p>

          <div
  className="
    mt-8
    bg-white/10
    backdrop-blur-md
    rounded-2xl
    px-5
    py-4
  "
>
  Economia de R$10 por mês
</div>

<button
  onClick={async () => {
    const restauranteId =
      localStorage.getItem("restaurante_id")

    const res = await fetch(
      "/api/mercadopago/criar-assinatura",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restauranteId,
        }),
      }
    )

    const data = await res.json()

    if (data.url) {
      window.location.href = data.url
    }
  }}
  className="
    mt-8
    flex
    items-center
    justify-center
    w-full
    rounded-2xl
    py-5
    bg-white
    text-black
    font-black
    text-lg
    hover:scale-[1.02]
    transition
  "
>
  Assinar Agora
</button>

</div>
</div>

{/* PIX */}

        <div
          className="
            rounded-[40px]
            border
            border-zinc-800
            bg-[#121218]
            p-10
          "
        >
          <div className="flex items-center gap-3 mb-4">
            <QrCode size={26} />
            <h2 className="text-3xl font-black text-white">
              PIX
            </h2>
          </div>

          <span className="text-6xl font-black text-white">
            R$69,90
          </span>

          <p className="text-zinc-400 mt-2">
            por mês
          </p>

          <div
            className="
              mt-8
              bg-zinc-800/50
              rounded-2xl
              px-5
              py-4
              text-zinc-300
            "
          >
            Pagamento manual mensal
          </div>

          <button
            className="
              mt-8
              w-full
              rounded-2xl
              py-5
              bg-zinc-800
              text-white
              font-bold
              hover:bg-zinc-700
              transition
            "
          >
            Gerar PIX
          </button>

        </div>

      </div>

      {/* BENEFÍCIOS */}

      <div
        className="
          mt-10
          rounded-[32px]
          border
          border-zinc-800
          bg-[#121218]
          p-8
        "
      >
        <div className="flex items-center gap-3 mb-8">
          <ShieldCheck
            className="text-[#C85A7A]"
            size={28}
          />

          <h2 className="text-3xl font-black text-white">
            Tudo incluso
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-5">

          {[
            "Cardápio digital profissional",
            "Produtos ilimitados",
            "Categorias ilimitadas",
            "Pedidos WhatsApp",
            "Tema personalizado",
            "Banner personalizado",
            "Horários automáticos",
            "Relatórios financeiros",
            "Pagamento online",
            "Atualizações futuras",
            "Suporte prioritário",
            "Novos recursos premium",
          ].map((item) => (
            <div
              key={item}
              className="
                flex
                items-center
                gap-3
                p-4
                rounded-2xl
                bg-black/20
                border
                border-zinc-800
              "
            >
              <CheckCircle2
                size={20}
                className="text-green-400"
              />

              <span className="text-zinc-200">
                {item}
              </span>
            </div>
          ))}

        </div>
      </div>

      {/* RODAPÉ */}

      <div
        className="
          mt-10
          rounded-[32px]
          border
          border-[#3D1622]
          bg-gradient-to-r
          from-[#1B0B11]
          to-[#14090D]
          p-8
        "
      >
        <div className="flex items-center gap-3 mb-4">
          <Zap
            className="text-[#C85A7A]"
            size={24}
          />

          <h3 className="text-2xl font-black text-white">
            7 dias grátis
          </h3>
        </div>

        <div className="grid md:grid-cols-3 gap-4">

          <div className="text-zinc-300">
            ✓ Sem fidelidade
          </div>

          <div className="text-zinc-300">
            ✓ Cancelamento imediato
          </div>

          <div className="text-zinc-300">
            ✓ Suporte prioritário
          </div>

        </div>
      </div>

    </main>
  )
}