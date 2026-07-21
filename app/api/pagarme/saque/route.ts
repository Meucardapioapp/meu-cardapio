import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  try {
    const restauranteId =
      req.nextUrl.searchParams.get("restauranteId");

    if (!restauranteId) {
      return NextResponse.json(
        {
          success: false,
          error: "Restaurante não informado",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // 1. BUSCAR O RECEBEDOR DO RESTAURANTE
    // =====================================================

    const { data: restaurante, error: restauranteError } =
      await supabaseAdmin
        .from("restaurantes")
        .select("pagarme_recipient_id")
        .eq("id", restauranteId)
        .single();

    if (restauranteError || !restaurante?.pagarme_recipient_id) {
      console.error(
        "Erro ao buscar recebedor:",
        restauranteError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Recebedor do restaurante não encontrado",
        },
        { status: 404 }
      );
    }

    // =====================================================
    // 2. BUSCAR SAQUES SALVOS NO SUPABASE
    // =====================================================

    const { data: saques, error: saquesError } =
      await supabaseAdmin
        .from("saques")
        .select("*")
        .eq("restaurante_id", restauranteId)
        .order("created_at", {
          ascending: false,
        });

    if (saquesError) {
      console.error(
        "Erro ao buscar saques:",
        saquesError
      );

      return NextResponse.json(
        {
          success: false,
          error: saquesError,
        },
        {
          status: 500,
        }
      );
    }

    // =====================================================
    // 3. CONSULTAR AS TRANSFERÊNCIAS NA PAGAR.ME
    // =====================================================

    const response = await fetch(
      `https://api.pagar.me/core/v5/recipients/${restaurante.pagarme_recipient_id}/transfers`,
      {
        method: "GET",

        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              process.env.PAGARME_SECRET_KEY + ":"
            ).toString("base64"),

          "Content-Type": "application/json",

          "User-Agent": "MeuCardapioApp",
        },

        cache: "no-store",
      }
    );

    // =====================================================
    // 4. SE A PAGAR.ME RESPONDER, SINCRONIZAR STATUS
    // =====================================================

    if (response.ok) {
      const pagarmeResponse = await response.json();

      console.log(
        "TRANSFERÊNCIAS PAGAR.ME:",
        JSON.stringify(pagarmeResponse, null, 2)
      );

      const transferencias = Array.isArray(pagarmeResponse)
        ? pagarmeResponse
        : pagarmeResponse?.data || [];

      for (const saque of saques || []) {
        if (!saque.pagarme_withdrawal_id) {
          continue;
        }

        const transferencia = transferencias.find(
          (item: any) =>
            item.id === saque.pagarme_withdrawal_id
        );

        if (!transferencia) {
          continue;
        }

        const novoStatus =
          transferencia.status || saque.status;

        // Só atualiza se realmente mudou
        if (novoStatus !== saque.status) {
          console.log(
            `Atualizando saque ${saque.pagarme_withdrawal_id}:`,
            saque.status,
            "->",
            novoStatus
          );

          const { error: updateError } =
            await supabaseAdmin
              .from("saques")
              .update({
                status: novoStatus,
              })
              .eq("id", saque.id);

          if (updateError) {
            console.error(
              "Erro ao atualizar status do saque:",
              updateError
            );
          } else {
            // Atualiza também o objeto que será enviado
            // para o frontend imediatamente
            saque.status = novoStatus;
          }
        }
      }
    } else {
      const erroPagarme = await response.text();

      console.error(
        "Erro ao consultar transferências na Pagar.me:",
        response.status,
        erroPagarme
      );
    }

    // =====================================================
    // 5. DEVOLVER HISTÓRICO ATUALIZADO
    // =====================================================

    return NextResponse.json({
      success: true,
      saques: saques || [],
    });

  } catch (error: any) {
    console.error(
      "Erro na API de saques:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}