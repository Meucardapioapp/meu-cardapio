import { NextRequest, NextResponse } from "next/server";
import { erroInterno, getDonoAutenticado, naoAutenticado } from "@/lib/server/auth";
import { conferirPagamentos, getEstadoAssinatura } from "@/lib/server/assinatura";
import { getDadosFinanceiros } from "@/lib/server/recebedor";
import { enderecoDoRestaurante } from "@/lib/server/frete";
import { paraUF } from "@/lib/uf";

/** Situação do plano do restaurante logado. */
export async function GET(req: NextRequest) {
  try {
    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();

    // Confere na Pagar.me se há pagamento que o aviso automático ainda não trouxe.
    await conferirPagamentos(dono.restaurante.id).catch((e) => console.error("[assinatura] conferir", e));

    const [assinatura, financeiro, endereco] = await Promise.all([
      getEstadoAssinatura(dono.restaurante.id),
      getDadosFinanceiros(dono.restaurante.id).catch(() => null),
      enderecoDoRestaurante(dono.restaurante.id).catch(() => null),
    ]);

    return NextResponse.json({
      success: true,
      assinatura,
      documentoSugerido: financeiro?.cpf_cnpj ?? "",
      nomeSugerido: dono.restaurante.nome_responsavel ?? "",
      // Endereço do restaurante como sugestão para o endereço de cobrança do cartão
      enderecoSugerido: endereco
        ? {
            cep: String(endereco.cep ?? "").replace(/\D/g, ""),
            rua: endereco.rua ?? "",
            numero: endereco.numero ?? "",
            bairro: endereco.bairro ?? "",
            cidade: endereco.cidade ?? "",
            uf: paraUF(endereco.estado),
          }
        : null,
    });
  } catch (error) {
    return erroInterno("assinatura", error);
  }
}
