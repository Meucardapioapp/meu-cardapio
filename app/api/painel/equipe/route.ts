import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { erroInterno, esquecerMembro, getDonoAutenticado, naoAutenticado } from "@/lib/server/auth";
import { limitar } from "@/lib/server/rate-limit";
import { senhaValida } from "@/lib/senha";

/** Equipe do restaurante: só o dono gerencia. */

const MAX_MEMBROS = 10;

function gerarSenha(): string {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const minusc = "abcdefghijkmnpqrstuvwxyz";
  const simbolos = "!@#$%*";
  const pick = (s: string) => s[randomInt(s.length)];
  let senha = "";
  for (let i = 0; i < 3; i++) senha += pick(letras) + pick(minusc);
  senha += "-" + String(randomInt(1000, 9999)) + pick(simbolos);
  return senhaValida(senha) ? senha : gerarSenha();
}

const emailValido = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 120;

async function membroDoRestaurante(id: string, restauranteId: string) {
  const { data } = await supabaseAdmin
    .from("equipe")
    .select("id, auth_user_id")
    .eq("id", id)
    .eq("restaurante_id", restauranteId)
    .maybeSingle();
  return data;
}

export async function GET(req: NextRequest) {
  try {
    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();
    const { data, error } = await supabaseAdmin
      .from("equipe")
      .select("id, nome, email, ativo, created_at")
      .eq("restaurante_id", dono.restaurante.id)
      .order("created_at", { ascending: true });
    if (error) return NextResponse.json({ success: true, membros: [], indisponivel: true });
    return NextResponse.json({ success: true, membros: data ?? [] });
  } catch (error) {
    return erroInterno("painel/equipe GET", error);
  }
}

/** Cria o acesso do atendente e devolve a senha UMA vez. */
export async function POST(req: NextRequest) {
  try {
    if (!(await limitar(req, "painel-equipe", 10, 60))) {
      return NextResponse.json({ success: false, error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });
    }
    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();

    const body = await req.json().catch(() => ({}));
    const nome = String(body?.nome ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
    const email = String(body?.email ?? "").trim().toLowerCase();
    if (!nome) return NextResponse.json({ success: false, error: "Informe o nome." }, { status: 400 });
    if (!emailValido(email)) return NextResponse.json({ success: false, error: "E-mail inválido." }, { status: 400 });

    const { count } = await supabaseAdmin
      .from("equipe")
      .select("id", { count: "exact", head: true })
      .eq("restaurante_id", dono.restaurante.id);
    if ((count ?? 0) >= MAX_MEMBROS) {
      return NextResponse.json({ success: false, error: `Limite de ${MAX_MEMBROS} pessoas na equipe.` }, { status: 400 });
    }

    const senha = gerarSenha();
    const { data: criado, error: erroCriar } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { tipo: "atendente" },
    });

    if (erroCriar || !criado?.user) {
      const jaExiste = /already|registered|exists/i.test(erroCriar?.message ?? "");
      return NextResponse.json(
        {
          success: false,
          error: jaExiste
            ? "Este e-mail já tem conta no MeuCardápio. Use outro e-mail para o atendente."
            : "Não foi possível criar o acesso agora.",
        },
        { status: 400 }
      );
    }

    const { data: membro, error } = await supabaseAdmin
      .from("equipe")
      .insert({ restaurante_id: dono.restaurante.id, auth_user_id: criado.user.id, nome, email })
      .select("id, nome, email, ativo, created_at")
      .single();

    if (error) {
      await supabaseAdmin.auth.admin.deleteUser(criado.user.id).catch(() => {});
      throw error;
    }

    return NextResponse.json({ success: true, membro, senha });
  } catch (error) {
    return erroInterno("painel/equipe POST", error);
  }
}

/** Bloquear/liberar acesso ou gerar nova senha. */
export async function PATCH(req: NextRequest) {
  try {
    if (!(await limitar(req, "painel-equipe", 10, 60))) {
      return NextResponse.json({ success: false, error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });
    }
    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();
    const body = await req.json().catch(() => ({}));
    const membro = await membroDoRestaurante(String(body?.id ?? "").slice(0, 64), dono.restaurante.id);
    if (!membro) return NextResponse.json({ success: false, error: "Pessoa não encontrada." }, { status: 404 });

    if (body?.acao === "nova-senha") {
      const senha = gerarSenha();
      const { error } = await supabaseAdmin.auth.admin.updateUserById(membro.auth_user_id, { password: senha });
      if (error) throw error;
      return NextResponse.json({ success: true, senha });
    }

    if (typeof body?.ativo === "boolean") {
      const { error } = await supabaseAdmin.from("equipe").update({ ativo: body.ativo }).eq("id", membro.id);
      if (error) throw error;
      // Bloqueado: derruba as sessões abertas.
      if (!body.ativo) {
        await supabaseAdmin.auth.admin
          .updateUserById(membro.auth_user_id, { ban_duration: "876000h" })
          .catch(() => {});
      } else {
        await supabaseAdmin.auth.admin.updateUserById(membro.auth_user_id, { ban_duration: "none" }).catch(() => {});
      }
      esquecerMembro(membro.auth_user_id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Nada para alterar." }, { status: 400 });
  } catch (error) {
    return erroInterno("painel/equipe PATCH", error);
  }
}

/** Remove a pessoa da equipe e apaga o login dela. */
export async function DELETE(req: NextRequest) {
  try {
    const dono = await getDonoAutenticado(req);
    if (!dono) return naoAutenticado();
    const body = await req.json().catch(() => ({}));
    const membro = await membroDoRestaurante(String(body?.id ?? "").slice(0, 64), dono.restaurante.id);
    if (!membro) return NextResponse.json({ success: false, error: "Pessoa não encontrada." }, { status: 404 });

    const { error } = await supabaseAdmin.from("equipe").delete().eq("id", membro.id);
    if (error) throw error;
    await supabaseAdmin.auth.admin.deleteUser(membro.auth_user_id).catch(() => {});
    esquecerMembro(membro.auth_user_id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return erroInterno("painel/equipe DELETE", error);
  }
}
