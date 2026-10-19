import Link from "next/link";

/** Moldura simples das páginas de Termos e Privacidade. */
export default function PaginaLegal({
  titulo,
  atualizadoEm,
  children,
}: {
  titulo: string;
  atualizadoEm: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#F8F6F4] px-4 py-10">
      <article className="mx-auto max-w-3xl rounded-3xl bg-white p-6 sm:p-10 shadow-sm border text-zinc-800 leading-relaxed [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-black [&_h2]:text-zinc-900 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mt-1">
        <Link href="/" className="text-sm font-semibold text-[#6D1F2F]">← MeuCardápioApp</Link>
        <h1 className="mt-4 text-3xl font-black text-zinc-900">{titulo}</h1>
        <p className="text-sm text-zinc-500">Última atualização: {atualizadoEm}</p>
        {children}
        <p className="mt-10 text-sm text-zinc-500">
          Dúvidas: fale com o suporte pelo WhatsApp{" "}
          <a className="underline" href="https://wa.me/5592992338863">(92) 99233-8863</a>.
        </p>
      </article>
    </main>
  );
}
