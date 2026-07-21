import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      restauranteId,
      cpfCnpj,
      banco,
      agencia,
      conta,
      tipoConta,
    } = body;

    // =====================================================
    // SEPARAR AGÊNCIA E DÍGITO
    // =====================================================

    const agenciaPartes = agencia.split("-");

    const agenciaNumero =
      agenciaPartes[0] || "";

    const agenciaDv =
      agenciaPartes[1] || "0";

    // =====================================================
    // SEPARAR CONTA E DÍGITO
    // =====================================================

    const contaPartes = conta.split("-");

    const contaNumero =
      contaPartes[0] || "";

    const contaDv =
      contaPartes[1] || "0";

    // =====================================================
    // DOCUMENTO
    // =====================================================

    const documentoLimpo =
      cpfCnpj.replace(/\D/g, "");

    const tipoPessoa =
      documentoLimpo.length === 11
        ? "individual"
        : "company";

    // =====================================================
    // VALIDAR RESTAURANTE
    // =====================================================

    if (!restauranteId) {
      return NextResponse.json(
        {
          success: false,
          error: "Restaurante não informado",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // BUSCAR RESTAURANTE NO SUPABASE
    // =====================================================

    const {
      data: restaurante,
      error: restauranteError,
    } = await supabaseAdmin
      .from("restaurantes")
      .select("*")
      .eq("id", restauranteId)
      .single();

    if (
      restauranteError ||
      !restaurante
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Restaurante não encontrado",
        },
        {
          status: 404,
        }
      );
    }

    if (!process.env.PAGARME_SECRET_KEY) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Chave da Pagar.me não configurada",
        },
        {
          status: 500,
        }
      );
    }

    const authorization =
      "Basic " +
      Buffer.from(
        process.env.PAGARME_SECRET_KEY + ":"
      ).toString("base64");

    // =====================================================
    // VARIÁVEIS QUE SERÃO UTILIZADAS DEPOIS
    // =====================================================

    let recipientId =
      restaurante.pagarme_recipient_id || "";

    let recipientStatus =
      restaurante.pagarme_status || "";

    // =====================================================
    // CASO 1:
    // RESTAURANTE JÁ POSSUI RECIPIENT
    //
    // NÃO CRIA OUTRO.
    // SOMENTE ATUALIZA A CONTA BANCÁRIA.
    // =====================================================

    if (recipientId) {
      console.log(
        "RECIPIENT JÁ EXISTE:",
        recipientId
      );

      console.log(
        "ATUALIZANDO CONTA BANCÁRIA..."
      );

      const responseAtualizarConta =
        await fetch(
          `https://api.pagar.me/core/v5/recipients/${recipientId}/default-bank-account`,
          {
            method: "PATCH",

            headers: {
              Authorization:
                authorization,

              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              bank_account: {
                holder_name:
                  restaurante.nome_responsavel,

                holder_type:
                  tipoPessoa,

                holder_document:
                  documentoLimpo,

                bank:
                  banco,

                branch_number:
                  agenciaNumero,

                branch_check_digit:
                  agenciaDv,

                account_number:
                  contaNumero,

                account_check_digit:
                  contaDv,

                type:
                  tipoConta === "poupanca"
                    ? "savings"
                    : "checking",
              },
            }),
          }
        );

      const resultadoAtualizacao =
        await responseAtualizarConta.json();

      console.log(
        "RESPOSTA ATUALIZAÇÃO CONTA:",
        resultadoAtualizacao
      );

      if (!responseAtualizarConta.ok) {
        return NextResponse.json(
          {
            success: false,

            error:
              resultadoAtualizacao?.message ||
              "Erro ao atualizar conta bancária",

            details:
              resultadoAtualizacao,
          },
          {
            status:
              responseAtualizarConta.status,
          }
        );
      }

      // IMPORTANTE:
      // recipientId NÃO É ALTERADO.
      //
      // O restaurante continua usando
      // exatamente o mesmo recipient.
    }

    // =====================================================
    // CASO 2:
    // RESTAURANTE AINDA NÃO POSSUI RECIPIENT
    //
    // SOMENTE NESSE CASO CRIA UM NOVO.
    // =====================================================

    else {
      console.log(
        "RESTAURANTE SEM RECIPIENT."
      );

      console.log(
        "CRIANDO NOVO RECIPIENT..."
      );

      const responseCriarRecipient =
        await fetch(
          "https://api.pagar.me/core/v5/recipients",
          {
            method: "POST",

            headers: {
              Authorization:
                authorization,

              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name:
                restaurante.nome_responsavel,

              email:
                restaurante.email,

              document:
                documentoLimpo,

              type:
                tipoPessoa,

              default_bank_account: {
                holder_name:
                  restaurante.nome_responsavel,

                holder_type:
                  tipoPessoa,

                holder_document:
                  documentoLimpo,

                bank:
                  banco,

                branch_number:
                  agenciaNumero,

                branch_check_digit:
                  agenciaDv,

                account_number:
                  contaNumero,

                account_check_digit:
                  contaDv,

                type:
                  tipoConta === "poupanca"
                    ? "savings"
                    : "checking",
              },
            }),
          }
        );

      const novoRecipient =
        await responseCriarRecipient.json();

      console.log(
        "NOVO RECIPIENT:",
        novoRecipient
      );

      if (!responseCriarRecipient.ok) {
        return NextResponse.json(
          {
            success: false,

            error:
              novoRecipient?.message ||
              "Erro ao criar recipient",

            details:
              novoRecipient,
          },
          {
            status:
              responseCriarRecipient.status,
          }
        );
      }

      // SOMENTE AQUI O ID MUDA,
      // POIS O RESTAURANTE NÃO POSSUÍA RECIPIENT.

      recipientId =
        novoRecipient.id;

      recipientStatus =
        novoRecipient.status || "";
    }

    // =====================================================
    // CONFIGURAR TRANSFERÊNCIAS
    // =====================================================

    const responseTransferSettings =
      await fetch(
        `https://api.pagar.me/core/v5/recipients/${recipientId}/transfer-settings`,
        {
          method: "PATCH",

          headers: {
            Authorization:
              authorization,

            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            transfer_enabled: true,
            transfer_interval: "daily",
            transfer_day: 0,
          }),
        }
      );

    const transferSettings =
      await responseTransferSettings.json();

    console.log(
      "TRANSFER SETTINGS:",
      transferSettings
    );

    if (!responseTransferSettings.ok) {
      console.error(
        "Erro ao configurar transferência:",
        transferSettings
      );
    }

    // =====================================================
    // SALVAR DADOS NO SUPABASE
    // =====================================================

    const {
      error: updateError,
    } = await supabaseAdmin
      .from("restaurantes")
      .update({
        cpf_cnpj:
          cpfCnpj,

        banco:
          banco,

        agencia:
          agencia,

        conta:
          conta,

        tipo_conta:
          tipoConta,

        // IMPORTANTE:
        //
        // Se já existia recipient,
        // este ID continua exatamente igual.

        pagarme_recipient_id:
          recipientId,

        pagarme_status:
          recipientStatus,

        digito_agencia:
          agenciaDv,

        digito_conta:
          contaDv,
      })
      .eq(
        "id",
        restauranteId
      );

    if (updateError) {
      console.error(
        "ERRO AO ATUALIZAR SUPABASE:",
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Erro ao salvar dados bancários",
        },
        {
          status: 500,
        }
      );
    }

    // =====================================================
    // SUCESSO
    // =====================================================

    return NextResponse.json({
      success: true,

      recipientId,

      recipientNovo:
        !restaurante.pagarme_recipient_id,
    });

  } catch (error: any) {
    console.error(
      "ERRO CRIAR/ATUALIZAR RECEBEDOR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message,
      },
      {
        status: 500,
      }
    );
  }
}