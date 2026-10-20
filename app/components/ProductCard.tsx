"use client";

import { Plus } from "lucide-react";
import type { ProdutoFormatado } from "../types";
import { precoAPartirDe, reais } from "@/lib/dinheiro";

type Props = {
  product: ProdutoFormatado;
  corPrincipal: string;
  /** Abre o produto. */
  onAdd: () => void;
  /** Botão "+": adiciona direto quando não há nada para escolher. */
  onMais?: () => void;
  /** Quantas unidades deste produto já estão no carrinho. */
  noCarrinho?: number;
};

function verProduto(product: ProdutoFormatado) {
  if (typeof window !== "undefined" && typeof (window as any).fbq === "function") {
    (window as any).fbq("track", "ViewContent", {
      content_name: product.nome,
      content_ids: [String(product.id)],
      content_type: "product",
      value: product.preco,
      currency: "BRL",
    });
  }
}

export function PrecoProduto({ product, cor, grande = false }: { product: ProdutoFormatado; cor: string; grande?: boolean }) {
  const { valor, variavel } = precoAPartirDe(product);
  const antigo = Number(product.precoAntigo) || 0;
  const promo = antigo > Number(product.preco) && Number(product.preco) > 0;
  if (!(valor > 0)) return null;
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      {variavel && <span className="text-[11px] font-medium text-zinc-500">a partir de</span>}
      <span className={`${grande ? "text-[17px]" : "text-[15px]"} font-bold leading-none`} style={{ color: promo ? "#059669" : cor }}>
        {reais(valor)}
      </span>
      {promo && <span className="text-[12px] text-zinc-400 line-through">{reais(antigo)}</span>}
    </div>
  );
}

export default function ProductCard({ product, corPrincipal, onAdd, onMais, noCarrinho = 0 }: Props) {
  const descricao = String(product.descricao ?? "").trim();
  const antigo = Number(product.precoAntigo) || 0;
  const desconto = antigo > Number(product.preco) && Number(product.preco) > 0 ? Math.round(((antigo - product.preco) / antigo) * 100) : 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        verProduto(product);
        onAdd();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") onAdd();
      }}
      className="flex cursor-pointer items-stretch gap-3 border-b border-zinc-100 bg-white px-4 py-4 text-left transition active:bg-zinc-50 md:rounded-2xl md:border md:border-zinc-200 md:px-5"
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="text-[15px] font-semibold leading-snug text-zinc-900 md:text-[17px]">{product.nome}</h3>
        {product.rotuloPromocao && (
          <span className="mt-1 w-fit rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">{product.rotuloPromocao}</span>
        )}
        {descricao && descricao !== "0" && (
          <p className="mt-1 line-clamp-2 text-[13px] leading-[18px] text-zinc-500 md:text-sm">{descricao}</p>
        )}
        <div className="mt-auto flex items-center gap-2 pt-2">
          <PrecoProduto product={product} cor={corPrincipal} />
          {desconto > 0 && (
            <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700">-{desconto}%</span>
          )}
        </div>
      </div>

      <div className="relative shrink-0">
        {product.imagem ? (
          <img
            loading="lazy"
            decoding="async"
            src={product.imagem}
            alt={product.nome}
            className="h-[96px] w-[96px] rounded-2xl bg-zinc-100 object-cover md:h-[128px] md:w-[128px]"
          />
        ) : (
          <div
            className="flex h-[96px] w-[96px] items-center justify-center rounded-2xl text-2xl font-black md:h-[128px] md:w-[128px]"
            style={{ backgroundColor: `${corPrincipal}12`, color: `${corPrincipal}66` }}
          >
            {String(product.nome || "?").trim().charAt(0).toUpperCase()}
          </div>
        )}
        <button
          type="button"
          aria-label={`Adicionar ${product.nome}`}
          onClick={(e) => {
            e.stopPropagation();
            verProduto(product);
            (onMais ?? onAdd)();
          }}
          className="absolute -bottom-2 -right-2 flex h-9 min-w-9 items-center justify-center rounded-full border-2 border-white px-2 text-sm font-bold text-white shadow-md active:scale-95"
          style={{ backgroundColor: corPrincipal }}
        >
          {noCarrinho > 0 ? noCarrinho : <Plus size={18} strokeWidth={3} />}
        </button>
      </div>
    </div>
  );
}
