import Link from "next/link";
import { Check } from "lucide-react";
import { PLANOS, formatarReais } from "@/lib/planos";

const INCLUIDO = [
  "Cardápio digital com link próprio e sua marca",
  "Pedidos ilimitados, sem taxa por pedido",
  "Alerta sonoro e impressão de pedidos",
  "Dinheiro, cartão na maquininha e Pix na sua chave",
  "Pix online automático (opcional)",
  "Fidelidade e cadastro de clientes",
  "Entrega por bairro e retirada no local",
  "Suporte pelo WhatsApp",
];

export default function Precos() {
  return (
    <section id="precos" className="scroll-mt-24 bg-white py-16 lg:py-24">
      <div className="mx-auto max-w-5xl px-5">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-[#6D1F2F]">Preços</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-[#111] lg:text-5xl">
            Um plano, tudo incluído
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-zinc-600 lg:text-lg">
            Teste grátis por 15 dias, sem cartão de crédito. Sem taxa por pedido e sem fidelidade.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-md">
          <div className="relative rounded-3xl border-2 border-[#6D1F2F] p-6 shadow-xl lg:p-8">
            <span className="absolute -top-3 left-6 rounded-full bg-[#6D1F2F] px-3 py-1 text-xs font-bold text-white">
              Plano único
            </span>
            <p className="text-lg font-bold text-zinc-900">{PLANOS.mensal.nome}</p>
            <p className="mt-3">
              <span className="text-4xl font-black text-zinc-900">{formatarReais(PLANOS.mensal.preco)}</span>
              <span className="text-zinc-500">/mês</span>
            </p>
            <p className="mt-1 text-sm text-zinc-500">{PLANOS.mensal.descricao} · cancele quando quiser</p>

            <ul className="mt-6 space-y-2.5 text-sm text-zinc-700">
              {INCLUIDO.map((item) => (
                <li key={item} className="flex gap-2">
                  <Check size={18} className="mt-0.5 shrink-0 text-green-600" />
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href="/cadastro"
              className="mt-8 flex h-14 items-center justify-center rounded-2xl bg-[#6D1F2F] font-bold text-white transition hover:bg-[#531723]"
            >
              Testar grátis por 15 dias
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Pix online automático: 2,5% por Pix recebido. Dinheiro e cartão na
          entrega não têm taxa.
        </p>
      </div>
    </section>
  );
}
