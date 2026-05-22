export default function Benefits() {
  return (
    <section className="max-w-7xl mx-auto px-5 py-10">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <h3 className="text-xl font-bold mb-2">
            Delivery Rápido
          </h3>

          <p className="text-zinc-400">
            Entrega rápida e segura
            para seus clientes.
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <h3 className="text-xl font-bold mb-2">
            Pagamento Fácil
          </h3>

          <p className="text-zinc-400">
            Pix, cartão e dinheiro.
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <h3 className="text-xl font-bold mb-2">
            Pedido em Tempo Real
          </h3>

          <p className="text-zinc-400">
            Atualização automática
            estilo iFood.
          </p>
        </div>

      </div>

    </section>
  )
}