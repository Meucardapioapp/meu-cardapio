import "server-only";

const PAGARME_API_URL = "https://api.pagar.me/core/v5";

export class PagarmeError extends Error {
  status: number;
  detalhes: unknown;

  constructor(message: string, status: number, detalhes: unknown) {
    super(message);
    this.status = status;
    this.detalhes = detalhes;
  }
}

function authorization() {
  const secretKey = process.env.PAGARME_SECRET_KEY;

  if (!secretKey) {
    throw new Error("PAGARME_SECRET_KEY não configurada.");
  }

  return "Basic " + Buffer.from(`${secretKey}:`).toString("base64");
}

export async function pagarme<T = any>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
    body?: unknown;
    idempotencyKey?: string;
  } = {}
): Promise<T> {
  const response = await fetch(`${PAGARME_API_URL}${endpoint}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: authorization(),
      "Content-Type": "application/json",
      ...(options.idempotencyKey
        ? { "Idempotency-Key": options.idempotencyKey }
        : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const text = await response.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    // Não loga dados pessoais: só a mensagem e os campos com erro (sem os valores).
    const camposComErro = data?.errors && typeof data.errors === "object" ? Object.keys(data.errors).join(",") : "";
    const mensagemErro = typeof data?.message === "string" ? data.message.slice(0, 200) : "";
    // Endpoint sem IDs (ex.: /customers/cus_123 → /customers/:id)
    const rota = endpoint.split("?")[0].replace(/\/[a-z]{2,4}_[A-Za-z0-9]+/g, "/:id");
    console.error("[pagarme]", rota, response.status, mensagemErro, camposComErro);

    throw new PagarmeError(
      data?.message || "Erro ao comunicar com a Pagar.me",
      response.status,
      data
    );
  }

  return data as T;
}

/** ID do recebedor da plataforma (quem fica com o 1% do Pix). */
export function recebedorPlataforma() {
  const id = process.env.PAGARME_PLATFORM_RECIPIENT_ID;

  if (!id) {
    throw new Error("PAGARME_PLATFORM_RECIPIENT_ID não configurada.");
  }

  return id;
}

export function telefoneParaPagarme(telefone: string) {
  const digitos = String(telefone || "").replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");

  return {
    mobile_phone: {
      country_code: "55",
      area_code: digitos.substring(0, 2),
      number: digitos.substring(2),
    },
  };
}

export function centavos(valor: number) {
  return Math.round(Number(valor || 0) * 100);
}

/**
 * Comissão da plataforma sobre pagamentos online do restaurante.
 * Só o 1% (a taxa fixa de R$ 0,99 foi removida).
 */
export const COMISSAO_PIX_PERCENTUAL = 0.01;
