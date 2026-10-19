/** Tela mostrada no lugar do cardápio quando o plano do restaurante está vencido. */
export default function CardapioIndisponivel({
  nome,
  logo,
  cor,
  whatsapp,
}: {
  nome: string;
  logo: string;
  cor: string;
  whatsapp: string;
}) {
  let telefone = whatsapp.replace(/\D/g, "");
  if (telefone && !telefone.startsWith("55")) telefone = `55${telefone}`;

  return (
    <main className="min-h-screen bg-zinc-50 flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        {logo ? (
          <img
            src={logo}
            alt={nome}
            className="mx-auto w-24 h-24 rounded-full object-cover shadow-md bg-white border"
          />
        ) : (
          <div
            className="mx-auto w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-black"
            style={{ backgroundColor: cor }}
          >
            {(nome || "?").charAt(0).toUpperCase()}
          </div>
        )}

        {nome && <h1 className="mt-5 text-2xl font-black text-zinc-900">{nome}</h1>}

        <p className="mt-3 text-zinc-600 leading-relaxed">
          Nosso cardápio online está temporariamente indisponível.
          {telefone ? " Faça seu pedido pelo WhatsApp." : " Volte em breve."}
        </p>

        {telefone && (
          <a
            href={`https://wa.me/${telefone}?text=${encodeURIComponent("Olá! Quero fazer um pedido.")}`}
            className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-green-600 px-6 font-bold text-white shadow-lg"
          >
            Pedir pelo WhatsApp
          </a>
        )}
      </div>
    </main>
  );
}
