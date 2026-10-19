/** Nome do estado (ou sigla) → sigla de 2 letras. */
const ESTADOS: Record<string, string> = {
  acre: "AC", alagoas: "AL", amapa: "AP", amazonas: "AM", bahia: "BA", ceara: "CE",
  "distrito federal": "DF", "espirito santo": "ES", goias: "GO", maranhao: "MA",
  "mato grosso": "MT", "mato grosso do sul": "MS", "minas gerais": "MG", para: "PA",
  paraiba: "PB", parana: "PR", pernambuco: "PE", piaui: "PI", "rio de janeiro": "RJ",
  "rio grande do norte": "RN", "rio grande do sul": "RS", rondonia: "RO", roraima: "RR",
  "santa catarina": "SC", "sao paulo": "SP", sergipe: "SE", tocantins: "TO",
};
const SIGLAS = new Set(Object.values(ESTADOS));

export function paraUF(valor: unknown): string {
  const t = String(valor ?? "").trim();
  if (SIGLAS.has(t.toUpperCase())) return t.toUpperCase();
  const chave = t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  return ESTADOS[chave] ?? "";
}
