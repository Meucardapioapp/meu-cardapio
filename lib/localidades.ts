import dados from "./localidades.json";

/**
 * Estados e cidades do Brasil (lista oficial do IBGE guardada no projeto).
 * Antes o cadastro buscava no site do IBGE a cada acesso; quando o IBGE
 * recusava o servidor, a lista de cidades ficava vazia e não dava para
 * criar a conta.
 */

type Estado = { id: number; sigla: string; nome: string; regiao: { id: number; sigla: string; nome: string } };

const ESTADOS = (dados.estados as unknown as Estado[]).slice().sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
const CIDADES = dados.cidades as unknown as Record<string, [number, string][]>;

const semAcento = (v: string) =>
  v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export function listarEstados() {
  return ESTADOS;
}

/** Cidades da UF no mesmo formato da API do IBGE ({ id, nome }). */
export function listarCidades(uf: string, busca?: string | null, limite = 10) {
  const lista = CIDADES[String(uf || "").toUpperCase()] ?? [];
  const cidades = lista.map(([id, nome]) => ({ id, nome }));

  if (!busca) return cidades;

  const termo = semAcento(busca.slice(0, 60));
  if (!termo) return cidades;

  // Primeiro as que começam com o texto, depois as que contêm.
  const comeca = cidades.filter((c) => semAcento(c.nome).startsWith(termo));
  const contem = cidades.filter((c) => !semAcento(c.nome).startsWith(termo) && semAcento(c.nome).includes(termo));
  return [...comeca, ...contem].slice(0, limite);
}
