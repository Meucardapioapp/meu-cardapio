"use client";

import { Search, Package, User, Home } from "lucide-react";
import { useState } from "react";
import dynamic from "next/dynamic";

// "Minha conta" só baixa quando o cliente abre (o cardápio carrega mais leve).
const CustomerArea = dynamic(() => import("./CustomerArea"), { ssr: false });
const MeusPedidos = dynamic(() => import("./MeusPedidos"), { ssr: false });

type Props = {
  corPrincipal: string;
  /** Abre a busca do cardápio. */
  onBuscar?: () => void;
  /** Volta ao topo do cardápio. */
  onInicio?: () => void;
  /** "Pedir de novo" dentro de Meus pedidos. */
  onPedirDeNovo?: (pedido: any) => void;
};

export default function BottomNavigation({ corPrincipal, onBuscar, onInicio, onPedirDeNovo }: Props) {
  const [aberto, setAberto] = useState<null | "conta" | "pedidos">(null);

  const itens = [
    { id: "inicio", rotulo: "Início", Icone: Home, acao: () => (onInicio ? onInicio() : window.scrollTo({ top: 0, behavior: "smooth" })) },
    { id: "buscar", rotulo: "Buscar", Icone: Search, acao: () => onBuscar?.() },
    { id: "pedidos", rotulo: "Pedidos", Icone: Package, acao: () => setAberto("pedidos") },
    { id: "conta", rotulo: "Conta", Icone: User, acao: () => setAberto("conta") },
  ];

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-[998] border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
        aria-label="Navegação do cardápio"
      >
        <div className="mx-auto flex h-[62px] max-w-xl items-center justify-around">
          {itens.map(({ id, rotulo, Icone, acao }) => (
            <button
              key={id}
              type="button"
              onClick={acao}
              className="flex h-[52px] w-[72px] flex-col items-center justify-center gap-0.5 rounded-2xl text-zinc-500 transition active:scale-95"
            >
              <Icone size={21} strokeWidth={2.2} color={(aberto ? id === aberto : id === "inicio") ? corPrincipal : "#71717A"} />
              <span className="text-[11px] font-semibold" style={{ color: (aberto ? id === aberto : id === "inicio") ? corPrincipal : undefined }}>
                {rotulo}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {aberto === "pedidos" && (
        <MeusPedidos
          open
          corPrincipal={corPrincipal}
          onClose={() => setAberto(null)}
          onPedirDeNovo={
            onPedirDeNovo
              ? (p: any) => {
                  setAberto(null);
                  onPedirDeNovo(p);
                }
              : undefined
          }
        />
      )}

      {aberto === "conta" && (
        <CustomerArea open semPedidos onVerPedidos={() => setAberto("pedidos")} onClose={() => setAberto(null)} />
      )}
    </>
  );
}
