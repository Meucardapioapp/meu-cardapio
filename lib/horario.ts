/**
 * Horário de funcionamento (usado no cardápio, no painel e no servidor).
 * Os horários ficam na tabela `aparencia`: horario_seg_inicio, horario_seg_fim,
 * seg_ativo… Aceita horário que passa da meia-noite (ex.: 18:00 às 02:00).
 */
export const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"] as const;

export type Agora = { dia: number; minutos: number };

/** Fuso de cada estado (horário de Brasília = -3). */
const FUSO_POR_UF: Record<string, number> = {
  AC: -5,
  AM: -4,
  MT: -4,
  MS: -4,
  RO: -4,
  RR: -4,
};

/** Deslocamento do fuso do estado em horas (ex.: MT = -4). */
export function fusoDoEstado(uf?: string | null) {
  return FUSO_POR_UF[String(uf ?? "").toUpperCase()] ?? -3;
}

export function agoraNoFuso(uf?: string | null, data = new Date()): Agora {
  const deslocamento = FUSO_POR_UF[String(uf ?? "").toUpperCase()] ?? -3;
  const local = new Date(data.getTime() + deslocamento * 3600 * 1000);
  return { dia: local.getUTCDay(), minutos: local.getUTCHours() * 60 + local.getUTCMinutes() };
}

/** Hora do aparelho (cardápio no celular do cliente). */
export function agoraLocal(data = new Date()): Agora {
  return { dia: data.getDay(), minutos: data.getHours() * 60 + data.getMinutes() };
}

function paraMinutos(hora: unknown) {
  const [h, m] = String(hora ?? "").split(":").map(Number);
  if (!Number.isFinite(h)) return null;
  return h * 60 + (Number.isFinite(m) ? m : 0);
}

function janela(aparencia: Record<string, any>, dia: number) {
  const chave = DIAS[dia];
  if (aparencia[`${chave}_ativo`] === false) return null;
  const inicio = paraMinutos(aparencia[`horario_${chave}_inicio`]);
  const fim = paraMinutos(aparencia[`horario_${chave}_fim`]);
  if (inicio == null || fim == null) return null;
  return { inicio, fim };
}

/** A loja está aberta agora pelo horário cadastrado? */
export function lojaAbertaAgora(aparencia: Record<string, any> | null | undefined, agora: Agora) {
  if (!aparencia) return false;

  const hoje = janela(aparencia, agora.dia);
  if (hoje) {
    if (hoje.fim > hoje.inicio) {
      if (agora.minutos >= hoje.inicio && agora.minutos <= hoje.fim) return true;
    } else if (agora.minutos >= hoje.inicio) {
      return true; // abriu hoje e fecha depois da meia-noite
    }
  }

  // Ontem abriu e fecha de madrugada (ex.: sexta 18h às 02h, agora é sábado 01h).
  const ontem = janela(aparencia, (agora.dia + 6) % 7);
  if (ontem && ontem.fim < ontem.inicio && agora.minutos <= ontem.fim) return true;

  return false;
}
