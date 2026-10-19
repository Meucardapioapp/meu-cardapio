import { pixChaveAtivo } from "@/lib/server/pixChave";
import { NextRequest, NextResponse, after } from "next/server";
import { avisarNovoPedido } from "@/lib/server/notificacoes";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  PedidoInvalidoError,
  calcularItens,
  calcularTaxaEntrega,
  pedidoMinimo,
  proximoNumeroPedido,
} from "@/lib/server/pedido";
import { contabilizarPedido, getProgramaFidelidade, getSelosCliente } from "@/lib/server/fidelidade";
import { CupomInvalidoError, aplicarCupom } from "@/lib/server/cupom";
import { getOperacao } from "@/lib/server/operacao";
import { agoraNoFuso, lojaAbertaAgora } from "@/lib/horario";
import { restaurantePodeReceberPedidos } from "@/lib/server/assinatura";
import { getRecebedorId } from "@/lib/server/recebedor";
import { limitar, limitarChave } from "@/lib/server/rate-limit";
import { mensagemDeErroBanco } from "@/lib/server/erros";
import { lancarPedidoDoQr } from "@/lib/server/salao";

const METODOS = ["pix", "cash", "card_delivery", "pix_chave"] as const;
type Metodo = (typeof METODOS)[number];

const texto = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);
const soDigitos = (v: unknown) => String(v ?? "").replace(/\D/g, "");

function erro(mensagem: string, status = 400, code?: string) {
  return NextResponse.json({ success: false, error: mensagem, code }, { status });
}

export async function POST(req: NextRequest) {
  try {
    if (!await limitar(req, "pedido-criar", 20, 60)) {
      return erro("Muitas tentativas. Aguarde um minuto.", 429);
    }

    const body = await req.json();

    const restauranteId = texto(body.restauranteId, 64);
    const nome = texto(body.nome, 120);
    const telefone = texto(body.telefone, 30);
    const tipoPedido: "entrega" | "retirada" =
      body.tipoPedido === "retirada" || body.tipoPedido === "mesa" ? "retirada" : "entrega";
    // Pedido feito pelo QR Code da mesa: grava como "retirada" (sem taxa nem
    // endereço) + número da mesa, assim funciona com qualquer versão do painel.
    const mesa =
      body.tipoPedido === "mesa" ? texto(body.mesa, 10).replace(/[^0-9A-Za-z-]/g, "") : "";
    if (body.tipoPedido === "mesa" && !mesa) return erro("Mesa não informada.");
    const metodo = body.payment_method as Metodo;

    if (!restauranteId) return erro("Restaurante não informado.");
    if (!nome) return erro("Informe seu nome.");
    if (soDigitos(telefone).length < 10) return erro("Informe um telefone válido com DDD.");
    if (!METODOS.includes(metodo)) return erro("Forma de pagamento inválida.");

    // Contra pedidos falsos em massa: no máximo 8 pedidos por telefone a cada 30 min.
    if (!(await limitarChave("pedido-criar-tel", `${restauranteId}:${soDigitos(telefone)}`, 8, 1800))) {
      return erro("Muitos pedidos seguidos com este telefone. Aguarde alguns minutos ou chame o restaurante.", 429);
    }

    const { data: restaurante } = await supabaseAdmin
      .from("restaurantes")
      .select("id, uf")
      .eq("id", restauranteId)
      .maybeSingle();

    if (!restaurante) return erro("Restaurante não encontrado.", 404);

    // ---------- plano do restaurante ----------
    if (!(await restaurantePodeReceberPedidos(restauranteId))) {
      return erro(
        "Este restaurante não está recebendo pedidos online no momento. Chame no WhatsApp.",
        403,
        "PEDIDOS_PAUSADOS"
      );
    }

    // ---------- pausa e horário de funcionamento ----------
    const operacao = await getOperacao(restauranteId);
    if (operacao.pausado) {
      return erro(
        "O restaurante pausou os pedidos por alguns minutos. Tente de novo em instantes ou chame no WhatsApp.",
        403,
        "PEDIDOS_PAUSADOS"
      );
    }

    {
      const { data: aparencia } = await supabaseAdmin
        .from("aparencia")
        .select("*")
        .eq("restaurante_id", restauranteId)
        .limit(1)
        .maybeSingle();

      // Tolerância de 15 min para diferença de relógio do celular.
      const agora = new Date();
      const aberto = [0, -15, 15].some((min) =>
        lojaAbertaAgora(aparencia, agoraNoFuso(restaurante.uf, new Date(agora.getTime() + min * 60000)))
      );
      if (!aberto) {
        return erro("O restaurante está fechado agora. Confira o horário de funcionamento.", 403, "LOJA_FECHADA");
      }
    }

    // ---------- forma de pagamento permitida ----------
    if (metodo === "pix") {
      if (!(await getRecebedorId(restauranteId))) {
        return erro("Pix online indisponível neste restaurante.");
      }
    } else if (metodo === "pix_chave") {
      if (!(await pixChaveAtivo(restauranteId))) {
        return erro("Pix na chave do restaurante indisponível.");
      }
    } else {
      const { data: config } = await supabaseAdmin
        .from("configuracoes_pagamento")
        .select("dinheiro, cartao_entrega")
        .eq("restaurante_id", restauranteId)
        .maybeSingle();

      const aceitaDinheiro = config ? Boolean(config.dinheiro) : true;
      const aceitaCartao = config ? Boolean(config.cartao_entrega) : true;

      if (metodo === "cash" && !aceitaDinheiro) {
        return erro("Pagamento em dinheiro indisponível.");
      }

      if (metodo === "card_delivery" && !aceitaCartao) {
        return erro("Cartão na entrega indisponível.");
      }
    }

    // ---------- valores calculados no servidor ----------
    const bairro = texto(body.bairro, 120);

    if (tipoPedido === "entrega" && (!bairro || !texto(body.rua) || !texto(body.numero, 20))) {
      return erro("Informe o endereço completo.");
    }

    const { itens, subtotal } = await calcularItens(restauranteId, body.itens, { uf: restaurante.uf });
    const frete = mesa
      ? { valor: 0, km: null }
      : await calcularTaxaEntrega(restauranteId, tipoPedido, bairro, {
          rua: texto(body.rua),
          numero: texto(body.numero, 20),
          cep: texto(body.cep, 12),
        });
    const taxaEntrega = frete.valor;
    const minimo = await pedidoMinimo(restauranteId);

    if (!mesa && minimo > 0 && subtotal < minimo) {
      return erro(
        `O pedido mínimo é de R$ ${minimo.toFixed(2).replace(".", ",")}.`
      );
    }

    // ---------- cliente ----------
    const tokenRecebido = texto(body.clienteToken, 200);

    let { data: cliente } = await supabaseAdmin
      .from("clientes")
      .select("*")
      .eq("telefone", telefone)
      .eq("restaurante_id", restauranteId)
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    let clienteNovo = false;

    if (!cliente) {
      const { data: novo, error: erroCliente } = await supabaseAdmin
        .from("clientes")
        .insert({
          restaurante_id: restauranteId,
          nome,
          telefone,
          email: null,
          total_pedidos: 0,
          total_gasto: 0,
          ultimo_acesso: new Date(),
        })
        .select()
        .single();

      if (erroCliente) throw erroCliente;

      cliente = novo;
      clienteNovo = true;
    }

    // Só quem já tem o token deste cliente (mesmo aparelho) é tratado
    // como dono da conta. Quem só sabe o telefone não recebe o token.
    const donoDaConta =
      clienteNovo || (tokenRecebido !== "" && tokenRecebido === cliente.token_acesso);

    if (donoDaConta && !clienteNovo) {
      await supabaseAdmin
        .from("clientes")
        .update({ nome, ultimo_acesso: new Date() })
        .eq("id", cliente.id);
    }

    // ---------- cupom de desconto (sobre os produtos) ----------
    let descontoCupom = 0;
    let cupomAplicado: { id: string; codigo: string } | null = null;

    if (texto(body.cupom, 40)) {
      const { cupom, desconto } = await aplicarCupom({
        restauranteId,
        codigo: body.cupom,
        subtotal,
        clienteId: cliente.id,
      });
      descontoCupom = desconto;
      cupomAplicado = { id: cupom.id, codigo: cupom.codigo };
    }

    // ---------- prêmio do cliente fiel ----------
    let descontoFidelidade = 0;
    let premioFidelidade: string | null = null;
    let usouPremio = false;

    const querPremio = body.usarPremioFidelidade === true || body.usarDescontoFidelidade === true;

    if (querPremio && donoDaConta && !clienteNovo) {
      const programa = await getProgramaFidelidade(restauranteId);
      const { selos } = await getSelosCliente(cliente.id, restauranteId);

      if (programa && selos >= programa.pedidosNecessarios) {
        // Evita usar o mesmo prêmio em dois Pix abertos ao mesmo tempo.
        const { count: emAberto } = await supabaseAdmin
          .from("pedidos")
          .select("id", { count: "exact", head: true })
          .eq("cliente_id", cliente.id)
          .eq("usou_premio_fidelidade", true)
          .eq("contabilizado", false)
          .eq("payment_method", "pix")
          .eq("payment_status", "pending")
          .gte("created_at", new Date(Date.now() - 30 * 60 * 1000).toISOString());

        if ((emAberto ?? 0) === 0) {
          usouPremio = true;

          if (programa.tipoPremio === "produto") {
            premioFidelidade = programa.textoPremio;
          } else {
            descontoFidelidade = Math.min(
              programa.valorDesconto,
              Math.max(subtotal + taxaEntrega - descontoCupom, 0)
            );
            descontoFidelidade = Math.round(descontoFidelidade * 100) / 100;
          }
        }
      }
    }

    const total =
      Math.round(Math.max(subtotal + taxaEntrega - descontoCupom - descontoFidelidade, 0) * 100) / 100;

    if (metodo === "pix" && total < 1) {
      return erro("Para pedidos abaixo de R$ 1,00, escolha pagar na entrega.");
    }

    let trocoPara: number | null = null;

    if (metodo === "cash" && body.trocoPara != null && body.trocoPara !== "") {
      const valor = Number(String(body.trocoPara).replace(",", "."));
      if (Number.isFinite(valor) && valor > total) trocoPara = Math.round(valor * 100) / 100;
    }

    // ---------- grava o pedido ----------
    const numeroPedido = await proximoNumeroPedido(restauranteId);
    const rua = tipoPedido === "retirada" ? "" : texto(body.rua);
    const numero = tipoPedido === "retirada" ? "" : texto(body.numero, 20);

    const { data: pedido, error } = await supabaseAdmin
      .from("pedidos")
      .insert({
        restaurante_id: restauranteId,
        cliente_id: cliente.id,
        numero_pedido: numeroPedido,
        cliente: nome,
        nome,
        telefone,
        tipo_pedido: tipoPedido,
        endereco: mesa ? `Mesa ${mesa}` : tipoPedido === "retirada" ? "Retirada no local" : `${rua}, ${numero}`,
        bairro: tipoPedido === "retirada" ? "" : bairro,
        rua,
        numero,
        complemento: tipoPedido === "retirada" ? "" : texto(body.complemento),
        referencia: texto(body.referencia),
        observacoes: texto(body.observacoes, 500),
        itens,
        subtotal,
        taxa_entrega: taxaEntrega,
        taxa_operacional: 0,
        total,
        total_pago: total,
        payment_method: metodo,
        payment_status: "pending",
        status: "pendente",
        confirmado: metodo !== "pix",
        desconto_fidelidade: descontoFidelidade,
        troco_para: trocoPara,
        // Campos novos só vão quando usados (funciona mesmo antes do SQL 04).
        ...(mesa ? { mesa } : {}),
        ...(frete.km != null ? { distancia_km: frete.km } : {}),
        ...(usouPremio ? { usou_premio_fidelidade: true, premio_fidelidade: premioFidelidade } : {}),
        ...(cupomAplicado
          ? { cupom_id: cupomAplicado.id, cupom_codigo: cupomAplicado.codigo, desconto_cupom: descontoCupom }
          : {}),
      })
      .select("id, numero_pedido, codigo_acesso, total")
      .single();

    if (error) throw error;

    // Pix só conta (histórico, selo e cupom) quando for pago (webhook).
    if (metodo !== "pix") {
      await contabilizarPedido(pedido.id, true, { pedidoNovo: true });
      // QR Code da mesa: o pedido entra direto na comanda da mesa (área Restaurante).
      if (mesa) await lancarPedidoDoQr(pedido.id);
      // Notificação no celular do restaurante (Pix avisa quando for pago).
      after(() => avisarNovoPedido(pedido.id).catch(() => {}));
    }

    // Endereço salvo só para o dono da conta.
    if (donoDaConta && tipoPedido === "entrega") {
      const { data: principal } = await supabaseAdmin
        .from("enderecos_cliente")
        .select("id")
        .eq("cliente_id", cliente.id)
        .eq("principal", true)
        .maybeSingle();

      const dadosEndereco = {
        rua,
        numero,
        bairro,
        complemento: texto(body.complemento),
        referencia: texto(body.referencia),
      };

      if (principal) {
        await supabaseAdmin.from("enderecos_cliente").update(dadosEndereco).eq("id", principal.id);
      } else {
        await supabaseAdmin
          .from("enderecos_cliente")
          .insert({ ...dadosEndereco, cliente_id: cliente.id, apelido: "Casa", principal: true });
      }
    }

    return NextResponse.json({
      success: true,
      pedido,
      cliente: donoDaConta ? { token_acesso: cliente.token_acesso } : null,
      descontoFidelidade,
      descontoCupom,
      premioFidelidade,
      totalFinal: total,
    });
  } catch (error: any) {
    if (error instanceof PedidoInvalidoError) {
      return erro(error.message);
    }

    if (error instanceof CupomInvalidoError) {
      return erro(error.message, 400, "CUPOM_INVALIDO");
    }

    console.error("[pedido/criar]", error);

    const { status, mensagem } = mensagemDeErroBanco(
      error,
      "Não foi possível criar o pedido. Tente novamente."
    );

    return erro(mensagem, status);
  }
}
