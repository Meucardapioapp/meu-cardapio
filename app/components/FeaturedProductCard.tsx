"use client";

import type { ProdutoFormatado } from "../types";
import { PrecoProduto } from "./ProductCard";

type Props = {
  product: ProdutoFormatado;
  onClick: () => void;
  corPrincipal: string;
};

/** Cartão grande, usado nos destaques (rolagem para o lado). */
export default function FeaturedProductCard({ product, onClick, corPrincipal }: Props) {
  const antigo = Number(product.precoAntigo) || 0;
  const desconto = antigo > Number(product.preco) && Number(product.preco) > 0 ? Math.round(((antigo - product.preco) / antigo) * 100) : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-[152px] shrink-0 snap-start overflow-hidden rounded-2xl border border-zinc-200 bg-white text-left shadow-sm transition active:scale-[0.98] md:w-[220px]"
    >
      <div className="relative h-[112px] w-full bg-zinc-100 md:h-[160px]">
        {product.imagem ? (
          <img loading="lazy" decoding="async" src={product.imagem} alt={product.nome} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full" style={{ backgroundColor: `${corPrincipal}12` }} />
        )}
        {desconto > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white">-{desconto}%</span>
        )}
      </div>
      <div className="flex min-h-[78px] flex-col p-2.5">
        <p className="line-clamp-2 text-[13px] font-semibold leading-4 text-zinc-900 md:text-[15px] md:leading-5">{product.nome}</p>
        <div className="mt-auto pt-1.5">
          <PrecoProduto product={product} cor={corPrincipal} />
        </div>
      </div>
    </button>
  );
}
