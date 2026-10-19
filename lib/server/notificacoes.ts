import "server-only";

import webpush from "web-push";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Avisos automáticos. Cada canal só funciona quando as chaves dele estão
 * configuradas no servidor; sem elas, a função simplesmente não faz nada.
 *
 *  - Notificação no celular do restaurante (Web Push): VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
 *  - E-mails para o restaurante (Resend):           RESEND_API_KEY, EMAIL_REMETENTE
 *  - WhatsApp para o cliente (WhatsApp Cloud API):   WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID,
 *                                                    WHATSAPP_TEMPLATE_PEDIDO (opcional)
 */

export const SITE = "https://meucardapioapp.com";

// ---------------------------------------------------------------------
// Controle de "só uma vez"
// ---------------------------------------------------------------------

/** Registra o aviso; devolve false se ele já tinha sido enviado. */
export async function reservarAviso(restauranteId: string, tipo: string, referencia: string) {
  const { error } = await supabaseAdmin
    .from("avisos_enviados")
    .insert({ restaurante_id: restauranteId, tipo, referencia: referencia.slice(0, 200) });
  if (!error) return true;
  if (error.code === "23505") return false;
  // Tabela ainda não existe (SQL 08): não envia para não repetir.
  return false;
}

// ---------------------------------------------------------------------
// Notificação no celular (Web Push)
// ---------------------------------------------------------------------

export function pushConfigurado() {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

let vapidPronto = false;
function prepararVapid() {
  if (vapidPronto) return true;
  if (!pushConfigurado()) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:contatomeucardapio@gmail.com",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  vapidPronto = true;
  return true;
}

export async function enviarPushRestaurante(
  restauranteId: string,
  aviso: { titulo: string; corpo: string; url?: string; tag?: string }
) {
  try {
    if (!prepararVapid()) return;

    const { data, error } = await supabaseAdmin
      .from("push_inscricoes")
      .select("id, endpoint, p256dh, auth")
      .eq("restaurante_id", restauranteId)
      .limit(20);
    if (error || !data?.length) return;

    const carga = JSON.stringify({
      titulo: aviso.titulo,
      corpo: aviso.corpo,
      url: aviso.url || "/admin/pedidos",
      tag: aviso.tag,
    });

    await Promise.all(
      data.map(async (i: any) => {
        try {
          await webpush.sendNotification(
            { endpoint: i.endpoint, keys: { p256dh: i.p256dh, auth: i.auth } },
            carga,
            { TTL: 600, urgency: "high" }
          );
        } catch (e: any) {
          // Aparelho desinstalou ou bloqueou: remove a inscrição.
          if (e?.statusCode === 404 || e?.statusCode === 410) {
            await supabaseAdmin.from("push_inscricoes").delete().eq("id", i.id);
          } else {
            console.error("[push]", e?.statusCode ?? e?.message ?? e);
          }
        }
      })
    );
  } catch (e) {
    console.error("[push]", e);
  }
}

const reais = (v: unknown) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export async function avisarNovoPedido(pedidoId: string | number) {
  const { data: p } = await supabaseAdmin
    .from("pedidos")
    .select("id, restaurante_id, numero_pedido, nome, cliente, total, mesa, tipo_pedido")
    .eq("id", pedidoId)
    .maybeSingle();
  if (!p) return;
  const onde = p.mesa ? `Mesa ${p.mesa}` : p.tipo_pedido === "retirada" ? "Retirada" : "Entrega";
  await enviarPushRestaurante(String(p.restaurante_id), {
    titulo: `🔔 Novo pedido #${p.numero_pedido ?? p.id}`,
    corpo: `${p.nome || p.cliente || "Cliente"} · ${reais(p.total)} · ${onde}`,
    tag: `pedido-${p.id}`,
  });
}

// ---------------------------------------------------------------------
// E-mail (Resend)
// ---------------------------------------------------------------------

export function emailConfigurado() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_REMETENTE);
}

function escapar(t: string) {
  return t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function modeloEmail(titulo: string, paragrafos: string[], botao?: { texto: string; link: string }) {
  return `<!doctype html><html><body style="margin:0;background:#f4f2f4;font-family:Arial,Helvetica,sans-serif;color:#1f1c21">
<div style="max-width:520px;margin:0 auto;padding:24px 16px">
<p style="font-size:22px;font-weight:900;color:#6D1F2F;margin:0 0 16px">MeuCardápio</p>
<div style="background:#fff;border-radius:16px;padding:24px">
<h1 style="font-size:20px;margin:0 0 12px">${escapar(titulo)}</h1>
${paragrafos.map((p) => `<p style="font-size:15px;line-height:22px;margin:0 0 12px">${escapar(p)}</p>`).join("")}
${botao ? `<a href="${botao.link}" style="display:inline-block;margin-top:8px;background:#6D1F2F;color:#fff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:12px">${escapar(botao.texto)}</a>` : ""}
</div>
<p style="font-size:12px;color:#888;margin-top:16px">Dúvidas? Responda este e-mail ou chame no WhatsApp (92) 99233-8863.</p>
</div></body></html>`;
}

export async function enviarEmail(para: string | null | undefined, assunto: string, html: string) {
  if (!emailConfigurado() || !para) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: process.env.EMAIL_REMETENTE, to: [para], subject: assunto, html }),
    });
    if (!r.ok) console.error("[email]", r.status, (await r.text()).slice(0, 200));
    return r.ok;
  } catch (e) {
    console.error("[email]", e);
    return false;
  }
}

async function dadosDono(restauranteId: string) {
  const { data } = await supabaseAdmin
    .from("restaurantes")
    .select("email, nome_responsavel, nome_restaurante, slug")
    .eq("id", restauranteId)
    .maybeSingle();
  return data;
}

export async function emailBoasVindas(restauranteId: string) {
  const r = await dadosDono(restauranteId);
  if (!r?.email || !(await reservarAviso(restauranteId, "email", "boas-vindas"))) return;
  const nome = String(r.nome_responsavel || "").split(" ")[0] || "tudo bem";
  await enviarEmail(
    r.email,
    "Bem-vindo ao MeuCardápio! 🎉",
    modeloEmail(`Olá, ${nome}! Seu cardápio digital está criado.`, [
      "Você tem 15 dias grátis para testar tudo: receber pedidos, programa de fidelidade, cupons e relatórios.",
      "Para começar: cadastre seus produtos, configure as taxas de entrega e compartilhe o link do cardápio com seus clientes.",
      `Seu cardápio: ${SITE}/${r.slug}`,
    ], { texto: "Abrir meu painel", link: `${SITE}/admin` })
  );
}

export async function emailPagamentoConfirmado(restauranteId: string, referencia: string, acessoAte: Date) {
  const r = await dadosDono(restauranteId);
  if (!r?.email || !(await reservarAviso(restauranteId, "email-pago", referencia))) return;
  await enviarEmail(
    r.email,
    "Pagamento confirmado ✅",
    modeloEmail("Recebemos seu pagamento. Obrigado!", [
      `O plano do ${r.nome_restaurante || "seu restaurante"} está ativo até ${acessoAte.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}.`,
      "Seu cardápio continua no ar e recebendo pedidos normalmente.",
    ], { texto: "Ver meu plano", link: `${SITE}/admin/plano` })
  );
}

export async function avisoPlanoVencendo(restauranteId: string, acessoAte: string, dias: number) {
  if (!(await reservarAviso(restauranteId, "vencendo", `${acessoAte}:${dias}`))) return;
  const r = await dadosDono(restauranteId);
  const quando = dias <= 1 ? "amanhã" : `em ${dias} dias`;
  await Promise.all([
    enviarEmail(
      r?.email,
      `Seu plano vence ${quando}`,
      modeloEmail(`Seu plano vence ${quando}`, [
        "Para o seu cardápio não sair do ar, renove pelo painel. No Pix o acesso é liberado na hora.",
        "Com o cartão, a cobrança é automática todo mês e você não precisa se preocupar.",
      ], { texto: "Renovar agora", link: `${SITE}/admin/plano` })
    ),
    enviarPushRestaurante(restauranteId, {
      titulo: `⏰ Seu plano vence ${quando}`,
      corpo: "Renove para o cardápio não sair do ar.",
      url: "/admin/plano",
      tag: "plano",
    }),
  ]);
}

export async function avisoForaDoAr(restauranteId: string, acessoAte: string) {
  if (!(await reservarAviso(restauranteId, "fora-do-ar", acessoAte))) return;
  const r = await dadosDono(restauranteId);
  await Promise.all([
    enviarEmail(
      r?.email,
      "Seu cardápio está fora do ar",
      modeloEmail("Seu cardápio está fora do ar", [
        "O plano venceu e o cardápio parou de receber pedidos.",
        "Renove seu plano: pagando no Pix, o cardápio volta na hora, com todos os seus produtos e clientes.",
      ], { texto: "Renovar meu plano", link: `${SITE}/admin/plano` })
    ),
    enviarPushRestaurante(restauranteId, {
      titulo: "Seu cardápio está fora do ar",
      corpo: "Renove seu plano para voltar a receber pedidos.",
      url: "/admin/plano",
      tag: "plano",
    }),
  ]);
}

// ---------------------------------------------------------------------
// WhatsApp para o cliente (WhatsApp Cloud API, modelo aprovado pela Meta)
// ---------------------------------------------------------------------

export function whatsappConfigurado() {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

const TEXTO_STATUS: Record<string, (retirada: boolean, mesa: boolean) => string> = {
  aceito: () => "foi aceito e já está em preparo 👨‍🍳",
  entrega: (retirada, mesa) =>
    mesa ? "está pronto e indo para a sua mesa 🍽️" : retirada ? "está pronto para retirada ✅" : "saiu para entrega 🛵",
  concluido: () => "foi concluído. Obrigado pela preferência! ❤️",
  recusado: () => "não pôde ser aceito agora. Fale com o restaurante.",
};

export async function whatsappStatusPedido(pedidoId: string | number, status: string) {
  try {
    if (!whatsappConfigurado() || !TEXTO_STATUS[status]) return;

    const { data: p } = await supabaseAdmin
      .from("pedidos")
      .select("id, restaurante_id, numero_pedido, nome, cliente, telefone, tipo_pedido, mesa")
      .eq("id", pedidoId)
      .maybeSingle();
    if (!p) return;

    const { data: op } = await supabaseAdmin
      .from("restaurante_operacao")
      .select("whatsapp_cliente")
      .eq("restaurante_id", p.restaurante_id)
      .maybeSingle();
    if (!op?.whatsapp_cliente) return;

    let telefone = String(p.telefone || "").replace(/\D/g, "");
    if (telefone.length < 10) return;
    if (!telefone.startsWith("55")) telefone = `55${telefone}`;

    if (!(await reservarAviso(String(p.restaurante_id), "whatsapp", `${p.id}:${status}`))) return;

    const { data: r } = await supabaseAdmin
      .from("restaurantes")
      .select("nome_restaurante")
      .eq("id", p.restaurante_id)
      .maybeSingle();

    const nome = String(p.nome || p.cliente || "").split(" ")[0] || "cliente";
    const texto = TEXTO_STATUS[status](p.tipo_pedido === "retirada", Boolean(p.mesa));

    const resposta = await fetch(
      `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: telefone,
          type: "template",
          template: {
            name: process.env.WHATSAPP_TEMPLATE_PEDIDO || "status_pedido",
            language: { code: process.env.WHATSAPP_TEMPLATE_IDIOMA || "pt_BR" },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: nome.slice(0, 40) },
                  { type: "text", text: String(p.numero_pedido ?? p.id) },
                  { type: "text", text: String(r?.nome_restaurante || "o restaurante").slice(0, 60) },
                  { type: "text", text: texto },
                ],
              },
            ],
          },
        }),
      }
    );
    if (!resposta.ok) console.error("[whatsapp]", resposta.status, (await resposta.text()).slice(0, 300));
  } catch (e) {
    console.error("[whatsapp]", e);
  }
}
