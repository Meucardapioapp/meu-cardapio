import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      restauranteId,
      nome,
      telefone,
      cpf,
      tipoPedido,
      endereco,
      bairro,
      rua,
      numero,
      complemento,
      referencia,
      observacoes,
      itens,
      subtotal,
      taxaEntrega,
      taxaOperacional,
      payment_method,

      // NOVO:
      // o frontend vai mandar true quando o cliente marcar
      // "Usar meu desconto de fidelidade"
      usarDescontoFidelidade,
    } = body;

    console.log("================================");
    console.log("CRIANDO PEDIDO");
    console.log("================================");

    console.log("RESTAURANTE:", restauranteId);
    console.log("CLIENTE:", telefone);
    console.log("USAR DESCONTO:", usarDescontoFidelidade);

    console.log("ITENS RECEBIDOS:");
    console.dir(itens, { depth: null });

    // ==========================================
    // VALORES BASE
    // ==========================================

    const subtotalNumero = Number(subtotal) || 0;
    const taxaEntregaNumero = Number(taxaEntrega) || 0;
    const taxaOperacionalNumero = Number(taxaOperacional) || 0;

    // O desconto NÃO será calculado pelo valor enviado
    // pelo navegador.
    //
    // O backend vai consultar o banco para descobrir
    // quanto o restaurante realmente configurou.

    let descontoFidelidade = 0;

    // ==========================================
    // NÚMERO DO PEDIDO
    // ==========================================

    const {
      data: ultimoPedido,
      error: erroUltimo,
    } = await supabaseAdmin
      .from("pedidos")
      .select("numero_pedido")
      .eq("restaurante_id", restauranteId)
      .not("numero_pedido", "is", null)
      .order("numero_pedido", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (erroUltimo) {
      throw erroUltimo;
    }

    const numeroPedido =
      (ultimoPedido?.numero_pedido ?? 0) + 1;

    // ==========================================
    // PROCURAR CLIENTE
    // ==========================================

    let { data: cliente } = await supabaseAdmin
      .from("clientes")
      .select("*")
      .eq("telefone", telefone)
      .eq("restaurante_id", restauranteId)
      .maybeSingle();

    // ==========================================
    // CRIAR CLIENTE SE NÃO EXISTIR
    // ==========================================

    if (!cliente) {
      const {
        data: novoCliente,
        error: erroCliente,
      } = await supabaseAdmin
        .from("clientes")
        .insert({
          restaurante_id: restauranteId,
          nome,
          telefone,
          email: null,
          cpf,
          total_pedidos: 0,
          total_gasto: 0,
          ultimo_acesso: new Date(),
        })
        .select()
        .single();

      if (erroCliente) {
        throw erroCliente;
      }

      cliente = novoCliente;
    } else {
      // ==========================================
      // ATUALIZAR CLIENTE
      // ==========================================

      const {
        data: clienteAtualizado,
        error: erroAtualizar,
      } = await supabaseAdmin
        .from("clientes")
        .update({
          nome,
          telefone,
          cpf,
          ultimo_acesso: new Date(),
        })
        .eq("id", cliente.id)
        .select()
        .single();

      if (erroAtualizar) {
        throw erroAtualizar;
      }

      cliente = clienteAtualizado;
    }

    // ==========================================
    // FIDELIDADE
    // ==========================================

    if (usarDescontoFidelidade === true) {
      console.log("================================");
      console.log("VERIFICANDO DESCONTO FIDELIDADE");
      console.log("CLIENTE:", cliente.id);
      console.log("RESTAURANTE:", restauranteId);
      console.log("================================");

      // Configuração do restaurante
      const {
        data: configuracaoFidelidade,
        error: erroConfiguracao,
      } = await supabaseAdmin
        .from("fidelidade")
        .select(
          "id, ativo, pedidos_necessarios, valor_desconto"
        )
        .eq("restaurante_id", restauranteId)
        .maybeSingle();

      if (erroConfiguracao) {
        console.error(
          "ERRO AO BUSCAR CONFIGURAÇÃO DE FIDELIDADE:",
          erroConfiguracao
        );
      }

      // Fidelidade específica deste cliente
      const {
        data: fidelidadeCliente,
        error: erroFidelidadeCliente,
      } = await supabaseAdmin
        .from("cliente_fidelidade")
        .select("*")
        .eq("cliente_id", cliente.id)
        .eq("restaurante_id", restauranteId)
        .maybeSingle();

      if (erroFidelidadeCliente) {
        console.error(
          "ERRO AO BUSCAR FIDELIDADE DO CLIENTE:",
          erroFidelidadeCliente
        );
      }

      console.log(
        "CONFIGURAÇÃO FIDELIDADE:",
        configuracaoFidelidade
      );

      console.log(
        "FIDELIDADE CLIENTE:",
        fidelidadeCliente
      );

      // ==========================================
      // VALIDAR SE PODE USAR
      // ==========================================

      if (
        configuracaoFidelidade &&
        configuracaoFidelidade.ativo === true &&
        fidelidadeCliente &&
        fidelidadeCliente.desconto_disponivel === true
      ) {
        const valorConfigurado = Number(
          configuracaoFidelidade.valor_desconto
        ) || 0;

        if (valorConfigurado > 0) {
          // O desconto é aplicado sobre:
          // produtos + taxa de entrega.
          //
          // A taxa operacional de R$0,99 permanece separada.

          const valorAntesDoDesconto =
            subtotalNumero + taxaEntregaNumero;

          // Nunca deixa o desconto gerar total negativo.
          descontoFidelidade = Math.min(
            valorConfigurado,
            Math.max(valorAntesDoDesconto, 0)
          );

          console.log(
            "DESCONTO FIDELIDADE APLICADO:",
            descontoFidelidade
          );
        }
      } else {
        console.log(
          "CLIENTE NÃO POSSUI DESCONTO DISPONÍVEL."
        );
      }
    }

    // ==========================================
    // CALCULAR TOTAL REAL NO SERVIDOR
    // ==========================================

    const totalCalculado =
      Math.max(
        subtotalNumero +
          taxaEntregaNumero -
          descontoFidelidade,
        0
      ) + taxaOperacionalNumero;

    // Arredondamento para evitar problemas de centavos
    const totalFinal =
      Math.round(totalCalculado * 100) / 100;

    console.log("================================");
    console.log("CÁLCULO FINAL");
    console.log("SUBTOTAL:", subtotalNumero);
    console.log("TAXA ENTREGA:", taxaEntregaNumero);
    console.log(
      "DESCONTO FIDELIDADE:",
      descontoFidelidade
    );
    console.log(
      "TAXA OPERACIONAL:",
      taxaOperacionalNumero
    );
    console.log("TOTAL FINAL:", totalFinal);
    console.log("================================");

    // ==========================================
    // CRIAR PEDIDO
    // ==========================================

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("pedidos")
      .insert({
        restaurante_id: restauranteId,

        cliente_id: cliente.id,

        numero_pedido: numeroPedido,

        cliente: nome,

        nome,

        telefone,

        cpf,

        tipo_pedido: tipoPedido,

        endereco,

        bairro,

        rua,

        numero,

        complemento,

        referencia,

        observacoes,

        itens,

        subtotal: subtotalNumero,

        taxa_entrega: taxaEntregaNumero,

        taxa_operacional: taxaOperacionalNumero,

        // TOTAL JÁ COM DESCONTO
        total: totalFinal,

        // IMPORTANTE:
        // O valor real que será pago também precisa
        // ser o valor com desconto.
        total_pago: totalFinal,

        payment_method,

        payment_status:
          payment_method === "pix"
            ? "pending"
            : "paid",

        status: "pendente",

        confirmado:
          payment_method === "pix"
            ? false
            : true,

        // NOVO
        desconto_fidelidade:
          descontoFidelidade,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // ==========================================
    // ATUALIZAR CLIENTE
    // ==========================================

    await supabaseAdmin
      .from("clientes")
      .update({
        total_pedidos:
          (cliente.total_pedidos ?? 0) + 1,

        total_gasto:
          (cliente.total_gasto ?? 0) +
          Number(totalFinal),

        ultimo_pedido: new Date(),

        ultimo_acesso: new Date(),
      })
      .eq("id", cliente.id);

    // ==========================================
    // ENDEREÇO DO CLIENTE
    // ==========================================

    const {
      data: enderecoExistente,
    } = await supabaseAdmin
      .from("enderecos_cliente")
      .select("id")
      .eq("cliente_id", cliente.id)
      .eq("principal", true)
      .maybeSingle();

    if (!enderecoExistente) {
      await supabaseAdmin
        .from("enderecos_cliente")
        .insert({
          cliente_id: cliente.id,

          apelido: "Casa",

          cep: endereco?.cep ?? null,

          rua,

          numero,

          bairro,

          cidade:
            endereco?.cidade ?? null,

          estado:
            endereco?.estado ?? null,

          complemento,

          referencia,

          principal: true,
        });
    } else {
      await supabaseAdmin
        .from("enderecos_cliente")
        .update({
          cep:
            endereco?.cep ?? null,

          rua,

          numero,

          bairro,

          cidade:
            endereco?.cidade ?? null,

          estado:
            endereco?.estado ?? null,

          complemento,

          referencia,
        })
        .eq(
          "id",
          enderecoExistente.id
        );
    }

    // ==========================================
    // LOG FINAL
    // ==========================================

    console.log("================================");
    console.log("PEDIDO CRIADO COM SUCESSO");
    console.log("PEDIDO:", data.id);
    console.log(
      "DESCONTO FIDELIDADE:",
      descontoFidelidade
    );
    console.log("TOTAL:", totalFinal);
    console.log("================================");

    return NextResponse.json({
      success: true,

      pedido: data,

      cliente: {
        id: cliente.id,
        token_acesso:
          cliente.token_acesso,
      },

      // Devolvemos para o frontend
      // saber o que realmente foi aplicado.
      descontoFidelidade,

      totalFinal,
    });

  } catch (error: any) {
    console.error(
      "ERRO AO CRIAR PEDIDO:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Erro interno do servidor",
      },
      {
        status: 500,
      }
    );
  }
}