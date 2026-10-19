"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/utils/apiFetch";

const NOMES_PAGAMENTO: Record<string, string> = {
  pix: "Pix (pago online)",
  cash: "Dinheiro",
  card_delivery: "Cartão na entrega",
  credit_card: "Cartão de crédito",
  pix_chave: "Pix na chave do restaurante",
};

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
  const linha = { display: "flex", justifyContent: "space-between", gap: 6 } as const;
  const quebra = { flex: 1, wordBreak: "break-word", overflowWrap: "break-word" } as const;
  const valor = { width: 64, textAlign: "right", flexShrink: 0 } as const;

  return (
    <main
      style={{
        width: "100%",
        maxWidth: "64mm",
        margin: "0 auto",
        padding: "3mm",
        boxSizing: "border-box",
        fontFamily: "monospace",
        color: "#000",
        fontSize: 13,
      }}
    >
      <style>{`
        *{box-sizing:border-box}
        html,body{margin:0;padding:0;width:100%;font-family:monospace;background:#fff}
        @page{size:auto;margin:2mm}
        hr{border:none;border-top:1px dashed #000;margin:8px 0}
      `}</style>

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 18, fontWeight: "bold" }}>{restaurante?.nome}</div>
        <div style={{ fontSize: 12 }}>
          {new Date(pedido.created_at).toLocaleString("pt-BR")}
        </div>
      </div>

      <hr />

      <div style={{ textAlign: "center", fontSize: 20, fontWeight: "bold" }}>
        PEDIDO #{pedido.numero_pedido ?? pedido.id}
      </div>
      <div style={{ textAlign: "center", fontWeight: "bold", marginTop: 4 }}>
        {pedido.mesa ? `MESA ${pedido.mesa}` : retirada ? "RETIRADA NO LOCAL" : "ENTREGA"}
      </div>

      <hr />

      <strong>CLIENTE</strong>
      <div>{pedido.nome || pedido.cliente}</div>
      <div>{pedido.telefone}</div>

      <hr />

      <strong>ITENS</strong>

      {itens.map((item: any, index: number) => (
        <div key={index} style={{ marginTop: 8 }}>
          <div style={{ ...linha, fontWeight: "bold", fontSize: 15 }}>
            <span style={quebra}>
              {item.quantity || 1}x {item.nome}
            </span>
            <span style={valor}>
              R$ {(Number(item.preco) * (item.quantity || 1)).toFixed(2)}
            </span>
          </div>

          {item.obrigatoriosSelecionados?.map((o: any, i: number) => (
            <div key={`o${i}`} style={linha}>
              <span style={quebra}>• {o.grupo}: {o.nome}</span>
              {Number(o.preco) > 0 && <span style={valor}>R$ {Number(o.preco).toFixed(2)}</span>}
            </div>
          ))}

          {item.adicionaisSelecionados?.map((a: any, i: number) => (
            <div key={`a${i}`} style={linha}>
              <span style={quebra}>+ {a.nome}</span>
              <span style={valor}>R$ {Number(a.preco || 0).toFixed(2)}</span>
            </div>
          ))}

          {item.observacao && <div>Obs: {item.observacao}</div>}
        </div>
      ))}

      <hr />

      <div style={linha}>
        <span>Subtotal</span>
        <span>R$ {Number(pedido.subtotal || 0).toFixed(2)}</span>
      </div>
      {!retirada && (
        <div style={linha}>
          <span>Entrega</span>
          <span>R$ {Number(pedido.taxa_entrega || 0).toFixed(2)}</span>
        </div>
      )}
      {Number(pedido.desconto_cupom) > 0 && (
        <div style={linha}>
          <span>Cupom {pedido.cupom_codigo}</span>
          <span>- R$ {Number(pedido.desconto_cupom).toFixed(2)}</span>
        </div>
      )}
      {Number(pedido.desconto_fidelidade) > 0 && (
        <div style={linha}>
          <span>Cliente fiel</span>
          <span>- R$ {Number(pedido.desconto_fidelidade).toFixed(2)}</span>
        </div>
      )}
      {pedido.premio_fidelidade && (
        <div style={{ ...linha, fontWeight: "bold" }}>
          <span>BRINDE CLIENTE FIEL: {pedido.premio_fidelidade}</span>
          <span>R$ 0,00</span>
        </div>
      )}
      <div style={{ ...linha, fontWeight: "bold", fontSize: 16, marginTop: 4 }}>
        <span>TOTAL</span>
        <span>R$ {Number(pedido.total_pago ?? pedido.total).toFixed(2)}</span>
      </div>

      <hr />

      <strong>PAGAMENTO</strong>
      <div>{NOMES_PAGAMENTO[pedido.payment_method] || pedido.payment_method}</div>
      {pedido.troco_para && (
        <div style={{ fontWeight: "bold" }}>
          Troco para R$ {Number(pedido.troco_para).toFixed(2)} (levar R${" "}
          {(Number(pedido.troco_para) - Number(pedido.total)).toFixed(2)})
        </div>
      )}

      {!retirada && (
        <>
          <hr />
          <strong>ENTREGA</strong>
          <div style={quebra}>
            {pedido.rua}, {pedido.numero}
          </div>
          {pedido.complemento && <div>Compl.: {pedido.complemento}</div>}
          <div>
            {pedido.bairro}
            {Number(pedido.distancia_km) > 0 ? ` (${String(Number(pedido.distancia_km)).replace(".", ",")} km)` : ""}
          </div>
          {pedido.referencia && <div>Ref.: {pedido.referencia}</div>}
        </>
      )}

      {pedido.observacoes && (
        <>
          <hr />
          <strong>OBSERVAÇÕES</strong>
          <div>{pedido.observacoes}</div>
        </>
      )}

      <hr />
      <div style={{ textAlign: "center", fontSize: 11 }}>MeuCardápioApp</div>
    </main>
  );
}
