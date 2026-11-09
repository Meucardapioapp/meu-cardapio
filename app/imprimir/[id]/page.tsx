"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/utils/apiFetch";
import { agruparAdicionais } from "@/lib/adicionais";

const NOMES_PAGAMENTO: Record<string, string> = {
  pix: "Pix (pago online)",
  cash: "Dinheiro",
  card_delivery: "Cartão na entrega",
  credit_card: "Cartão de crédito",
  pix_chave: "Pix na chave do restaurante",
};

const dinheiro = (v: unknown) =>
  `R$ ${Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Junta as escolhas pelo grupo, na ordem em que aparecem: [Frutas] Uva, Manga… */
function porGrupo(lista: any[]) {
  const grupos: { grupo: string; itens: { nome: string; preco: number; qtd: number }[] }[] = [];
  for (const o of lista ?? []) {
    const nomeGrupo = String(o?.grupo ?? "").trim() || "Escolha";
    let g = grupos.find((x) => x.grupo === nomeGrupo);
    if (!g) grupos.push((g = { grupo: nomeGrupo, itens: [] }));
    const nome = String(o?.nome ?? "");
    const preco = Number(o?.preco || 0);
    const igual = g.itens.find((i) => i.nome === nome && i.preco === preco);
    if (igual) igual.qtd++;
    else g.itens.push({ nome, preco, qtd: 1 });
  }
  return grupos;
}

/**
 * Comanda no padrão dos apps de delivery (iFood / 99Food): título do grupo
 * uma vez só, entre colchetes, e cada escolha na linha de baixo com a
 * quantidade e o valor. Letras menores para não gastar bobina.
 */
export default function Impressao() {
  const { id } = useParams<{ id: string }>();
  const [pedido, setPedido] = useState<any>(null);
  const [restaurante, setRestaurante] = useState<{ nome: string | null } | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      const resposta = await apiFetch(`/api/painel/pedido/${id}`);
      const dados = await resposta.json();

      if (!dados.success) {
        setErro(dados.error || "Pedido não encontrado.");
        return;
      }

      setPedido(dados.pedido);
      setRestaurante(dados.restaurante);
    }

    carregar();
  }, [id]);

  useEffect(() => {
    if (pedido) {
      const t = setTimeout(() => window.print(), 300);
      return () => clearTimeout(t);
    }
  }, [pedido]);

  if (erro) {
    return (
      <main style={{ padding: 30 }}>
        <h1>{erro}</h1>
      </main>
    );
  }

  if (!pedido) {
    return <main style={{ padding: 30, fontFamily: "monospace" }}>Carregando…</main>;
  }

  const itens = Array.isArray(pedido.itens) ? pedido.itens : [];
  const retirada = pedido.tipo_pedido === "retirada";
  const data = new Date(pedido.created_at);

  return (
    <main className="comanda">
      <style>{`
        *{box-sizing:border-box}
        html,body{margin:0;padding:0;width:100%;background:#fff}
        @page{size:auto;margin:2mm}
        .comanda{width:100%;max-width:64mm;margin:0 auto;padding:2mm;font-family:"Courier New",Courier,monospace;color:#000;font-size:12px;line-height:1.25;font-weight:bold}
        .comanda *{font-weight:bold !important;color:#000 !important}
        .c{text-align:center}
        .b{font-weight:bold}
        .sep{border:none;border-top:2px dashed #000;margin:6px 0}
        .sep-fina{border:none;border-top:1px dashed #000;margin:5px 0}
        .linha{display:flex;justify-content:space-between;gap:6px}
        .linha>span:first-child{flex:1;min-width:0;overflow-wrap:anywhere}
        .linha>span:nth-child(2){flex-shrink:0;text-align:right;white-space:nowrap}
        .rot{font-size:11px;font-weight:bold;text-transform:uppercase}
        .grupo{padding-left:6px;margin-top:2px}
        .opcao{padding-left:14px}
        .tipo{display:inline-block;border:2px solid #000;padding:1px 8px;font-weight:bold;margin-top:3px}
      `}</style>

      <div className="c b" style={{ fontSize: 14 }}>{restaurante?.nome}</div>
      <div className="c" style={{ fontSize: 11 }}>
        {data.toLocaleDateString("pt-BR")} {data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
      </div>

      <hr className="sep" />

      <div className="c b" style={{ fontSize: 18 }}>PEDIDO #{pedido.numero_pedido ?? pedido.id}</div>
      <div className="c">
        <span className="tipo">{pedido.mesa ? `MESA ${pedido.mesa}` : retirada ? "RETIRADA NO LOCAL" : "ENTREGA"}</span>
      </div>

      <hr className="sep" />

      <div className="b">{pedido.nome || pedido.cliente}</div>
      {pedido.telefone && <div>{pedido.telefone}</div>}

      <hr className="sep" />

      {itens.map((item: any, index: number) => {
        const qtd = Number(item.quantity || 1);
        const adicionais = agruparAdicionais(item.adicionaisSelecionados);
        return (
          <div key={index}>
            {index > 0 && <hr className="sep-fina" />}

            <div className="linha b" style={{ fontSize: 13 }}>
              <span>
                {qtd}x {item.nome}
              </span>
              <span>{dinheiro(Number(item.preco) * qtd)}</span>
            </div>

            {porGrupo(item.obrigatoriosSelecionados).map((g) => (
              <div key={g.grupo}>
                <div className="grupo">[{g.grupo}]</div>
                {g.itens.map((o, i) => (
                  <div key={i} className="linha opcao">
                    <span>
                      {o.qtd}x {o.nome}
                    </span>
                    {o.preco > 0 && <span>{dinheiro(o.preco * o.qtd)}</span>}
                  </div>
                ))}
              </div>
            ))}

            {adicionais.length > 0 && (
              <div>
                <div className="grupo">[Adicionais]</div>
                {adicionais.map((a, i) => (
                  <div key={i} className="linha opcao">
                    <span>
                      {a.qtd}x {a.nome}
                    </span>
                    {a.preco > 0 && <span>{dinheiro(a.preco * a.qtd)}</span>}
                  </div>
                ))}
              </div>
            )}

            {item.observacao && (
              <div className="grupo b">OBS: {item.observacao}</div>
            )}
          </div>
        );
      })}

      <hr className="sep" />

      <div className="linha">
        <span>Subtotal</span>
        <span>{dinheiro(pedido.subtotal)}</span>
      </div>
      {!retirada && (
        <div className="linha">
          <span>Taxa de entrega</span>
          <span>{dinheiro(pedido.taxa_entrega)}</span>
        </div>
      )}
      {Number(pedido.desconto_cupom) > 0 && (
        <div className="linha">
          <span>Cupom {pedido.cupom_codigo}</span>
          <span>- {dinheiro(pedido.desconto_cupom)}</span>
        </div>
      )}
      {Number(pedido.desconto_fidelidade) > 0 && (
        <div className="linha">
          <span>Cliente fiel</span>
          <span>- {dinheiro(pedido.desconto_fidelidade)}</span>
        </div>
      )}
      {pedido.premio_fidelidade && (
        <div className="linha b">
          <span>BRINDE: {pedido.premio_fidelidade}</span>
          <span>{dinheiro(0)}</span>
        </div>
      )}
      <div className="linha b" style={{ fontSize: 14, marginTop: 3 }}>
        <span>TOTAL</span>
        <span>{dinheiro(pedido.total_pago ?? pedido.total)}</span>
      </div>

      <hr className="sep" />

      <div className="rot">Pagamento</div>
      <div>{NOMES_PAGAMENTO[pedido.payment_method] || pedido.payment_method}</div>
      {pedido.troco_para && (
        <div className="b">
          Troco para {dinheiro(pedido.troco_para)} (levar {dinheiro(Number(pedido.troco_para) - Number(pedido.total))})
        </div>
      )}

      {!retirada && (
        <>
          <hr className="sep" />
          <div className="rot">Endereço</div>
          <div>
            {pedido.rua}, {pedido.numero}
            {pedido.complemento ? ` - ${pedido.complemento}` : ""}
          </div>
          <div>
            {pedido.bairro}
            {Number(pedido.distancia_km) > 0 ? ` (${String(Number(pedido.distancia_km)).replace(".", ",")} km)` : ""}
          </div>
          {pedido.referencia && <div>Ref.: {pedido.referencia}</div>}
        </>
      )}

      {pedido.observacoes && (
        <>
          <hr className="sep" />
          <div className="rot">Observações do pedido</div>
          <div className="b">{pedido.observacoes}</div>
        </>
      )}

      <hr className="sep" />
      <div className="c" style={{ fontSize: 10 }}>MeuCardápioApp</div>
    </main>
  );
}
