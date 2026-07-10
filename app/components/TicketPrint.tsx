type Props = {
  pedido: any;
};

export default function TicketPrint({ pedido }: Props) {
  return (
    <div className="w-[300px] bg-white text-black p-3 text-[12px]">

      <h1 className="text-center font-bold">
        {pedido.restaurante_nome}
      </h1>

      <hr />

      <p>Pedido #{pedido.id}</p>

      <p>{new Date(pedido.created_at).toLocaleString()}</p>

      <hr />

      <p><strong>Cliente:</strong></p>

      <p>{pedido.nome}</p>

      <p>{pedido.telefone}</p>

      <hr />

      {pedido.itens.map((item:any)=>(
        <div key={item.uniqueId}>

          <strong>
            {item.quantity}x {item.nome}
          </strong>

          {/* adicionais */}

          {/* obrigatórios */}

          {/* observação */}

        </div>
      ))}

      <hr />

      <p>Subtotal: R$ {pedido.subtotal}</p>

      <p>Entrega: R$ {pedido.taxa_entrega}</p>

      <h2>
        Total R$ {pedido.total}
      </h2>

    </div>
  );
}