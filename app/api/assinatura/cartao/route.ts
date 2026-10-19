import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { erroInterno, getDonoAutenticado, naoAutenticado } from "@/lib/server/auth";
import { cancelarAssinaturaPagarme, getLinhaAssinatura, sincronizarFaturaCartao } from "@/lib/server/assinatura";
import { getPlanoPagarmeId } from "@/lib/server/cobranca";
import { PagarmeError, pagarme, telefoneParaPagarme } from "@/lib/server/pagarme";
import { limitar } from "@/lib/server/rate-limit";
import { validarCpfOuCnpj } from "@/lib/validacoes";
import type { PlanoId } from "@/lib/planos";
import { paraUF } from "@/lib/uf";

/**
 * Assina o plano no cartão (cobrança automática todo mês).
 * O cartão é transformado em token no navegador; o número nunca passa por aqui.
 */
export async function POST(req: NextRequest) {
  try {
    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();

    if (!await limitar(req, "assinatura-cartao", 5, 600)) {
      return NextResponse.json(
        { success: false, error: "Muitas tentativas. Aguarde alguns minutos." },
        { status: 429 }
      );
    }

    const { plano, cardToken, documento, nome, cartaoFinal, cartaoBandeira, endereco } = await req.json();
    // Só existe o plano mensal (o anual foi retirado).
    void plano;
    const planoId: PlanoId = "mensal";
    const doc = String(documento ?? "").replace(/\D/g, "");

    if (!cardToken) {
      return NextResponse.json({ success: false, error: "Cartão não informado." }, { status: 400 });
    }

    if (!validarCpfOuCnpj(doc)) {
      return NextResponse.json({ success: false, error: "CPF ou CNPJ inválido." }, { status: 400 });
    }

    // Endereço de cobrança do cartão: a Pagar.me exige e ele não vai no token.
    const cobranca = enderecoDeCobranca(endereco);
    if (!cobranca) {
      return NextResponse.json(
        { success: false, error: "Preencha o endereço de cobrança do cartão (CEP, rua, número, cidade e estado)." },
        { status: 400 }
      );
    }

    const dados = () => ({
      name: String(nome || dono.restaurante.nome_responsavel || dono.restaurante.nome_restaurante || "").slice(0, 64),
      email: dono.email || dono.restaurante.email,
      document: doc,
      type: doc.length === 11 ? "individual" : "company",
      address: cobranca,
      ...(dono.restaurante.whatsapp ? { phones: telefoneParaPagarme(dono.restaurante.whatsapp) } : {}),
    });

    const atual = await getLinhaAssinatura(dono.restaurante.id);
    const temRecorrencia =
      Boolean(atual.pagarme_subscription_id) &&
      atual.metodo === "cartao" &&
      (atual.status === "ativa" || atual.status === "inadimplente");

    // Já tem cobrança automática: só troca o cartão (não cobra de novo).
    if (temRecorrencia) {
      try {
        const clienteId = await garantirCliente(atual.pagarme_customer_id, dados());
        const cartao = await cadastrarCartao(clienteId, cardToken, cobranca);
        await pagarme(`/subscriptions/${atual.pagarme_subscription_id}/card`, {
          method: "PATCH",
          body: { card_id: cartao.id },
        });
      } catch (e) {
        if (e instanceof PagarmeError) {
          return NextResponse.json({ success: false, error: mensagemCartao(e) }, { status: 400 });
        }
        throw e;
      }

      await supabaseAdmin
        .from("assinaturas")
        .update({
          cartao_final: String(cartaoFinal ?? "").slice(-4) || null,
          cartao_bandeira: String(cartaoBandeira ?? "").slice(0, 20) || null,
          updated_at: new Date().toISOString(),
        })
        .eq("restaurante_id", dono.restaurante.id);

      return NextResponse.json({ success: true, cartaoTrocado: true });
    }

    // Assinatura antiga (cancelada ou recusada): garante que está encerrada
    // na Pagar.me antes de criar a nova, para nunca cobrar em dobro.
    if (atual.pagarme_subscription_id) {
      try {
        await cancelarAssinaturaPagarme(atual.pagarme_subscription_id);
      } catch (e) {
        console.error("[assinatura/cartao] cancelar anterior", e);
        return NextResponse.json(
          { success: false, error: "Não foi possível encerrar a assinatura anterior. Fale com o suporte." },
          { status: 502 }
        );
      }
    }

    const planId = await getPlanoPagarmeId(planoId);

    let assinatura: any;

    try {
      // 1. Cliente na Pagar.me (reaproveita o que já existe)
      const clienteId = await garantirCliente(atual.pagarme_customer_id, dados());
      // 2. Cartão cadastrado no cliente, com o endereço de cobrança
      const cartao = await cadastrarCartao(clienteId, cardToken, cobranca);
      // 3. Assinatura mensal nesse cartão (a 1ª cobrança sai na hora)
      assinatura = await pagarme<any>("/subscriptions", {
        method: "POST",
        idempotencyKey: `assinatura-${dono.restaurante.id}-${cardToken}`,
        body: {
          plan_id: planId,
          payment_method: "credit_card",
          customer_id: clienteId,
          card_id: cartao.id,
          installments: 1,
          metadata: { restaurante_id: dono.restaurante.id, plano: planoId },
        },
      });
    } catch (e) {
      if (e instanceof PagarmeError) {
        return NextResponse.json(
          { success: false, error: mensagemCartao(e) },
          { status: 400 }
        );
      }
      throw e;
    }

    await supabaseAdmin
      .from("assinaturas")
      .update({
        plano: planoId,
        metodo: "cartao",
        pagarme_subscription_id: assinatura.id,
        pagarme_customer_id: assinatura?.customer?.id ?? null,
        cartao_final: String(cartaoFinal ?? "").slice(-4) || null,
        cartao_bandeira: String(cartaoBandeira ?? "").slice(0, 20) || null,
        updated_at: new Date().toISOString(),
      })
      .eq("restaurante_id", dono.restaurante.id);

    // Primeira cobrança: libera na hora se foi paga (o webhook também faz isso).
    // Se o banco recusou, cancela a assinatura e avisa o dono.
    let paga = false;
    let recusada = false;
    for (let tentativa = 0; tentativa < 3 && !paga && !recusada; tentativa++) {
      if (tentativa > 0) await new Promise((r) => setTimeout(r, 1500));
      try {
        const faturas = await pagarme<any>(`/invoices?subscription_id=${assinatura.id}`);
        for (const fatura of faturas?.data ?? []) {
          if (fatura?.status === "paid") {
            await sincronizarFaturaCartao(fatura.id);
            paga = true;
          } else if (fatura?.status === "failed" || fatura?.status === "canceled") {
            recusada = true;
          }
        }
      } catch (e) {
        console.error("[assinatura/cartao] faturas", e);
      }
    }

    if (recusada && !paga) {
      try {
        await cancelarAssinaturaPagarme(assinatura.id);
      } catch (e) {
        console.error("[assinatura/cartao] cancelar recusada", e);
      }
      await supabaseAdmin
        .from("assinaturas")
        .update({ pagarme_subscription_id: null, metodo: atual.metodo, cartao_final: null, cartao_bandeira: null })
        .eq("restaurante_id", dono.restaurante.id);
      return NextResponse.json(
        { success: false, error: "O banco recusou a cobrança. Confira o limite do cartão ou use outro cartão / Pix." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, paga });
  } catch (error) {
    return erroInterno("assinatura/cartao", error);
  }
}

// ---------------------------------------------------------------------

type Cobranca = { line_1: string; line_2?: string; zip_code: string; city: string; state: string; country: "BR" };

function enderecoDeCobranca(e: any): Cobranca | null {
  const cep = String(e?.cep ?? "").replace(/\D/g, "");
  const rua = String(e?.rua ?? "").trim().slice(0, 100);
  const numero = String(e?.numero ?? "").trim().slice(0, 15);
  const bairro = String(e?.bairro ?? "").trim().slice(0, 60);
  const cidade = String(e?.cidade ?? "").trim().slice(0, 60);
  const uf = paraUF(e?.uf);
  if (cep.length !== 8 || !rua || !numero || !cidade || !uf) return null;
  return {
    // Formato da Pagar.me: "número, rua, bairro"
    line_1: [numero, rua, bairro].filter(Boolean).join(", ").slice(0, 256),
    ...(e?.complemento ? { line_2: String(e.complemento).trim().slice(0, 128) } : {}),
    zip_code: cep,
    city: cidade,
    state: uf,
    country: "BR",
  };
}

async function garantirCliente(existente: string | null, dados: Record<string, unknown>) {
  if (existente) {
    try {
      await pagarme(`/customers/${existente}`, { method: "PUT", body: dados });
      return existente;
    } catch (e) {
      console.error("[assinatura/cartao] atualizar cliente", e);
    }
  }
  const cliente = await pagarme<any>("/customers", { method: "POST", body: dados });
  return cliente.id as string;
}

async function cadastrarCartao(clienteId: string, cardToken: string, cobranca: Cobranca) {
  return pagarme<any>(`/customers/${clienteId}/cards`, {
    method: "POST",
    body: { token: cardToken, billing_address: cobranca },
  });
}

/** Mensagem clara para o dono, sem detalhes técnicos. */
function mensagemCartao(e: PagarmeError) {
  const texto = JSON.stringify(e.detalhes ?? "").toLowerCase();
  if (texto.includes("billing") || texto.includes("address") || texto.includes("zip")) {
    return "Confira o endereço de cobrança do cartão (CEP, rua, número, cidade e estado).";
  }
  if (texto.includes("document")) return "Confira o CPF ou CNPJ.";
  return "Cartão recusado. Confira os dados ou use outro cartão.";
}
