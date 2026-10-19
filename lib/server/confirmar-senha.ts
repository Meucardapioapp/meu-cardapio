import "server-only";

import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { limitarChave } from "@/lib/server/rate-limit";
import type { DonoAutenticado } from "@/lib/server/auth";

export class SenhaInvalidaError extends Error {
  constructor(mensagem = "Senha incorreta.", public status = 403) {
    super(mensagem);
  }
}

/**
 * Pede a senha de novo antes de ações com dinheiro (trocar conta
 * bancária, sacar). Assim, quem roubar uma sessão aberta (celular
 * esquecido desbloqueado, computador compartilhado) não consegue
 * desviar o dinheiro sem saber a senha.
 *
 * Máximo de 5 tentativas a cada 15 minutos por conta.
 */
export async function confirmarSenhaDoDono(dono: DonoAutenticado, senha: unknown) {
  const texto = typeof senha === "string" ? senha : "";

  if (!texto) {
    throw new SenhaInvalidaError("Digite sua senha para confirmar.", 400);
  }

  if (!(await limitarChave("confirmar-senha", dono.userId, 5, 900))) {
    throw new SenhaInvalidaError("Muitas tentativas de senha. Aguarde 15 minutos.", 429);
  }

  // Confere o hash da senha no próprio banco (função do SQL 05).
  const { data, error } = await supabaseAdmin.rpc("conferir_senha_usuario", {
    p_user: dono.userId,
    p_senha: texto,
  });

  if (!error) {
    if (data === true) return;
    throw new SenhaInvalidaError();
  }

  // Reserva enquanto o SQL 05 não foi rodado: tenta entrar com a senha.
  console.error("[confirmar-senha] rpc", error.message);

  const email = dono.email || dono.restaurante.email;
  if (!email) throw new SenhaInvalidaError("Não foi possível confirmar a senha agora.", 503);

  const cliente = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { error: erroLogin } = await cliente.auth.signInWithPassword({ email, password: texto });

  if (erroLogin) throw new SenhaInvalidaError();

  // Encerra só a sessão criada aqui (a do navegador continua).
  await cliente.auth.signOut({ scope: "local" }).catch(() => {});
}
