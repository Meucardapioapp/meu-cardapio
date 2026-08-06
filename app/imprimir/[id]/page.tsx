import { supabaseAdmin } from "@/lib/supabase-admin";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Impressao({ params }: Props) {
  const { id } = await params;

  const { data: pedido, error } = await supabaseAdmin
    .from("pedidos")
    .select("*")
    .eq("id", Number(id))
    .single();

  if (error || !pedido) {
    return (
      <main style={{ padding: 30 }}>
        <h1>Pedido não encontrado.</h1>
      </main>
    );
  }

  const { data: restaurante } = await supabaseAdmin
    .from("restaurantes")
    .select("nome, logo")
    .eq("id", pedido.restaurante_id)
    .single();

  const itens = Array.isArray(pedido.itens)
    ? pedido.itens
    : JSON.parse(pedido.itens || "[]");

    function nomePagamento() {
  switch (pedido.payment_method) {
    case "pix":
      return "Pix";

    case "credit_card":
      return "Cartão de Crédito";

    case "cash":
      return "Dinheiro";

    case "apple_pay":
      return "Apple Pay";

    case "google_pay":
      return "Google Pay";

    default:
      return pedido.payment_method || "Não informado";
  }
}


  return (
<main
  style={{
    width: "100%",
    maxWidth: "64mm", // deixa uma folga para impressoras térmicas
    margin: "0 auto",
    padding: "3mm",
    boxSizing: "border-box",
    fontFamily: "monospace",
    color: "#000",
    fontSize: 13,
  }}
>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.onload = () => {
              window.print();
            };
          `,
        }}
      />

<style
  dangerouslySetInnerHTML={{
    __html: `
*{
  box-sizing:border-box;
}

html,
body{
  margin:0;
  padding:0;
  width:100%;
  font-family:monospace;
}

@page{
  size:auto;
  margin:2mm;
}

@media print{

  html,
  body{
    width:100%;
    margin:0;
    padding:0;
  }

  main{
    width:100% !important;
    max-width:64mm !important;
    margin:0 auto !important;
    padding:3mm !important;
  }

  img{
    max-width:100%;
    height:auto;
  }

  hr{
    margin:6px 0;
  }
}
    `,
  }}
/>

      <div
        style={{
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        {restaurante?.logo ? (
          <img
            src={restaurante.logo}
            alt={restaurante.nome}
            style={{
              width: 60,
              margin: "0 auto 10px",
              display: "block",
            }}
          />
        ) : (
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: "bold",
            }}
          >
            {restaurante?.nome}
          </h2>
        )}

        <div style={{ fontSize: 12 }}>
          {new Date(pedido.created_at).toLocaleString("pt-BR")}
        </div>
      </div>

      <hr />

      <h2
        style={{
          textAlign: "center",
          margin: "10px 0",
        }}
      >
        PEDIDO #{pedido.id}
      </h2>

      <div style={{ marginBottom: 15 }}>
        <strong>CLIENTE</strong>

        <br />

        {pedido.cliente}

        <br />

        {pedido.telefone}
      </div>

      <hr />

      <h3>ITENS</h3>

      {itens.map((item: any, index: number) => (
        <div
          key={index}
          style={{
            marginBottom: 14,
          }}
>




<div
  style={{
    display: "flex",
    alignItems: "flex-start",
    fontWeight: "bold",
    fontSize: 16,
  }}
>
  <span
    style={{
      flex: 1,
      minWidth: 0,
      paddingRight: 6,
      whiteSpace: "normal",
      wordBreak: "break-word",
      overflowWrap: "break-word",
    }}
  >
    {(item.quantity || 1)}x {item.nome}
  </span>

  <span
    style={{
      width: 60,
      textAlign: "right",
      flexShrink: 0,
    }}
  >
    R$ {(Number(item.preco) * (item.quantity || 1)).toFixed(2)}
  </span>
</div>








          <br />

{item.obrigatoriosSelecionados?.map((o: any, i: number) => (
<div
  key={i}
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 6,
    marginBottom: 2,
  }}
>
  <span
  style={{
    flex: 1,
    paddingRight: 6,
    whiteSpace: "normal",
    wordBreak: "break-word",
    overflowWrap: "break-word",
  }}
>
  • {o.grupo}: {o.nome}
</span>

    {o.preco > 0 && (
<span
  style={{
    width: 60,
    textAlign: "right",
    flexShrink: 0,
  }}
>
  R$ {Number(o.preco).toFixed(2)}
</span>
    )}
  </div>
))}

{item.adicionaisSelecionados?.map((a: any, i: number) => (
<div
  key={i}
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 6,
    marginBottom: 2,
  }}
>
    <span
  style={{
    flex: 1,
    paddingRight: 6,
    whiteSpace: "normal",
    wordBreak: "break-word",
    overflowWrap: "break-word",
  }}
>
  + {a.nome}
</span>

<span
  style={{
    width: 60,
    textAlign: "right",
    flexShrink: 0,
  }}
>
  R$ {Number(a.preco || 0).toFixed(2)}
</span>
  </div>
))}

          {item.observacao && (
            <div>
              Obs: {item.observacao}
            </div>
          )}
        </div>
      ))}

      <hr />

<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 14,
    fontWeight: "bold",
    margin: "14px 0",
  }}
>
  <span>Valor Total</span>

<span
  style={{
    width: 60,
    textAlign: "right",
    flexShrink: 0,
  }}
>
  R$ {Number(pedido.total_pago ?? pedido.total).toFixed(2)}
</span>
</div>

      <hr />

      <div
        style={{
          marginTop: 12,
        }}
      >
        <strong>Pagamento</strong>

        <br />

        {nomePagamento()}
      </div>

      <hr />

      <div
        style={{
          marginTop: 12,
        }}
      >
        <strong>Entrega</strong>

        <br />
        <br />

<div
  style={{
    whiteSpace: "normal",
    wordBreak: "break-word",
    overflowWrap: "break-word",
  }}
>
  {pedido.rua}, {pedido.numero}
</div>

{pedido.complemento && (
  <>
    <br />
    Complemento: {pedido.complemento}
  </>
)}

{pedido.referencia && (
  <>
    <br />
    Referência: {pedido.referencia}
  </>
)}

<br />

{pedido.bairro}
      </div>

      {pedido.observacoes && (
        <>
          <hr />

          <div>
            <strong>Observações</strong>

            <br />

            {pedido.observacoes}
          </div>
        </>
      )}

      <hr />

      <div
        style={{
          marginTop: 20,
          textAlign: "center",
          fontSize: 11,
        }}
      >
        Emitido por MeuCardápioApp
      </div>
    </main>
  );
}