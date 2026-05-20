export default function Hero() {
  return (
    <div className="bg-zinc-900 rounded-3xl p-6 md:p-10 mb-10 border border-zinc-800">
      <div className="grid md:grid-cols-2 gap-8 items-center">

        <div>
          <span className="bg-green-500 text-black px-4 py-2 rounded-full text-sm font-bold">
            ENTREGA GRÁTIS
          </span>

          <h2 className="text-5xl font-bold mt-6 mb-4">
            Peça agora mesmo
          </h2>

          <p className="text-zinc-400 mb-8">
            Delivery rápido, cardápio premium e experiência completa para seu cliente.
          </p>

          <button className="bg-green-500 hover:bg-green-600 transition px-8 py-4 rounded-2xl font-bold text-black">
            Ver Promoções
          </button>
        </div>

        <img
          src="https://images.unsplash.com/photo-1513104890138-7c749659a591"
          className="w-full h-72 object-cover rounded-3xl"
        />
      </div>
    </div>
  )
}