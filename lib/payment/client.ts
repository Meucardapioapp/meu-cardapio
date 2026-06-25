const PAGARME_API_URL = "https://api.pagar.me/core/v5";

export async function pagarmeRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const secretKey = process.env.PAGARME_SECRET_KEY;

  if (!secretKey) {
    throw new Error("PAGARME_SECRET_KEY não encontrada.");
  }

  const response = await fetch(`${PAGARME_API_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization:
        "Basic " + Buffer.from(`${secretKey}:`).toString("base64"),
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Erro Pagar.me:", data);
    throw new Error(data.message || "Erro ao comunicar com a Pagar.me");
  }

  return data as T;
}