export default function Loading() {
  return (
    <main className="min-h-screen bg-[#F8F6F4] flex flex-col items-center justify-center px-8">

      <div className="w-28 h-28 rounded-full bg-white shadow-xl flex items-center justify-center">
        <span className="text-4xl">🍔</span>
      </div>

      <h1 className="mt-8 text-3xl font-black text-[#6D1F2F]">
        Preparando seu cardápio
      </h1>

      <p className="mt-3 text-zinc-500 text-center max-w-xs">
        Estamos carregando os melhores produtos para você.
      </p>

      <div className="mt-10 w-72 h-2 bg-zinc-200 rounded-full overflow-hidden">
        <div className="loading-bar h-full rounded-full bg-[#6D1F2F]" />
      </div>

      <div className="mt-10 space-y-3 text-zinc-600 text-sm">

        <div className="flex items-center gap-2">
          <span>✓</span>
          <span>Produtos</span>
        </div>

        <div className="flex items-center gap-2">
          <span>✓</span>
          <span>Categorias</span>
        </div>

        <div className="flex items-center gap-2">
          <span>✓</span>
          <span>Promoções</span>
        </div>

      </div>

    </main>
  );
}