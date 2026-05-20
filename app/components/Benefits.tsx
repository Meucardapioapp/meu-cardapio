export default function Benefits() {
  return (
    <div className="grid md:grid-cols-3 gap-6 mt-12">

      <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
        <h3 className="text-xl font-bold mb-2">
          🚀 Entrega Rápida
        </h3>

        <p className="text-zinc-400">
          Entregas em até 30 minutos.
        </p>
      </div>

      <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
        <h3 className="text-xl font-bold mb-2">
          💳 Pagamento Online
        </h3>

        <p className="text-zinc-400">
          PIX, cartão e dinheiro.
        </p>
      </div>

      <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
        <h3 className="text-xl font-bold mb-2">
          ⭐ Sistema Premium
        </h3>

        <p className="text-zinc-400">
          Estrutura pronta para virar SaaS.
        </p>
      </div>

    </div>
  )
}