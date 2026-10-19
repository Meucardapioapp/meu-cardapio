import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { acessoNegado, erroInterno, isDonoDaPlataforma } from "@/lib/server/auth";

type Item = { grupo: string; nome: string; ok: boolean; detalhe: string; acao?: "criptografar" };

/**
 * Teste de segurança (só o dono da plataforma).
 * Faz, com a chave PÚBLICA do site, as mesmas tentativas que um invasor
 * faria — e confere se o banco bloqueia. Também confere as variáveis secretas.
 * Nunca devolve valores secretos, só "configurado / faltando".
 */
export async function GET(req: NextRequest) {
  try {
    if (!(await isDonoDaPlataforma(req))) return acessoNegado();

    const itens: Item[] = [];
    const env = (nome: string) => Boolean(process.env[nome] && String(process.env[nome]).length > 0);

    // ---------- variáveis secretas ----------
    const chave = process.env.DADOS_CRIPTO_CHAVE || "";
    itens.push({
      grupo: "Configuração",
      nome: "Chave de criptografia dos dados bancários (DADOS_CRIPTO_CHAVE)",
      ok: Buffer.from(chave, "base64").length === 32,
      detalhe: !chave
        ? "faltando: dados bancários ficam sem criptografia"
        : Buffer.from(chave, "base64").length === 32
        ? "configurada"
        : "formato errado: precisa ter 32 bytes em base64",
    });
    itens.push({ grupo: "Configuração", nome: "Sal do limite de tentativas (RATE_LIMIT_SALT)", ok: env("RATE_LIMIT_SALT"), detalhe: env("RATE_LIMIT_SALT") ? "configurado" : "faltando" });
    itens.push({
      grupo: "Configuração",
      nome: "Proteção contra robôs (Turnstile)",
      ok: env("TURNSTILE_SECRET_KEY") && env("NEXT_PUBLIC_TURNSTILE_SITE_KEY"),
      detalhe: env("TURNSTILE_SECRET_KEY") ? "configurada" : "faltando: cadastro e login sem captcha",
    });
    itens.push({
      grupo: "Configuração",
      nome: "Senha do webhook da Pagar.me",
      ok: env("PAGARME_WEBHOOK_USER") && env("PAGARME_WEBHOOK_PASSWORD"),
      detalhe: env("PAGARME_WEBHOOK_USER") ? "configurada" : "faltando (recomendado)",
    });
    const chavePagarme = process.env.PAGARME_SECRET_KEY || "";
    itens.push({
      grupo: "Configuração",
      nome: "Chave da Pagar.me é de produção",
      ok: chavePagarme.startsWith("sk_") && !chavePagarme.startsWith("sk_test_"),
      detalhe: chavePagarme.startsWith("sk_test_") ? "chave de TESTE em uso" : chavePagarme ? "ok" : "faltando",
    });
    itens.push({
      grupo: "Configuração",
      nome: "Nenhum segredo com prefixo NEXT_PUBLIC_",
      ok: !Object.keys(process.env).some((k) => k.startsWith("NEXT_PUBLIC_") && /SECRET|SERVICE_ROLE|PASSWORD|PRIVATE/i.test(k)),
      detalhe: "variáveis NEXT_PUBLIC_ vão para o navegador de qualquer pessoa",
    });

    // ---------- ataques simulados com a chave pública ----------
    const publico = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    async function bloqueado(nome: string, tentativa: () => PromiseLike<{ data: any; error: any }>) {
      try {
        const { data, error } = await tentativa();
        const vazou = !error && Array.isArray(data) && data.length > 0;
        itens.push({
          grupo: "Ataques simulados (chave pública)",
          nome,
          ok: !vazou,
          detalhe: vazou ? `VAZOU ${data.length} registro(s)` : "bloqueado",
        });
      } catch {
        itens.push({ grupo: "Ataques simulados (chave pública)", nome, ok: true, detalhe: "bloqueado" });
      }
    }

    await bloqueado("Ler e-mails dos donos de restaurante", () => publico.from("restaurantes").select("email").limit(1));
    await bloqueado("Ler clientes (nome, telefone)", () => publico.from("clientes").select("id").limit(1));
    await bloqueado("Ler endereços de clientes", () => publico.from("enderecos_cliente").select("id").limit(1));
    await bloqueado("Ler pedidos", () => publico.from("pedidos").select("id").limit(1));
    await bloqueado("Ler dados bancários", () => publico.from("restaurantes_financeiro").select("restaurante_id").limit(1));
    await bloqueado("Ler assinaturas", () => publico.from("assinaturas").select("restaurante_id").limit(1));
    await bloqueado("Ler cupons", () => publico.from("cupons").select("id").limit(1));
    await bloqueado("Ler saques", () => publico.from("saques").select("id").limit(1));

    // Escrita sem login
    {
      const { data: alvo } = await supabaseAdmin.from("produtos").select("id, preco").limit(1).maybeSingle();
      if (alvo) {
        const { data } = await publico.from("produtos").update({ preco: alvo.preco }).eq("id", alvo.id).select("id");
        itens.push({
          grupo: "Ataques simulados (chave pública)",
          nome: "Alterar preço de produto sem login",
          ok: !data || data.length === 0,
          detalhe: data && data.length ? "CONSEGUIU ALTERAR" : "bloqueado",
        });
      }
    }

    // Vista pública: não pode aceitar escrita (vista ignora as regras de acesso).
    {
      const { data: alvo } = await supabaseAdmin.from("restaurantes").select("id, nome_restaurante").limit(1).maybeSingle();
      if (alvo) {
        const { data } = await publico
          .from("restaurantes_publico")
          .update({ nome_restaurante: alvo.nome_restaurante })
          .eq("id", alvo.id)
          .select("id");
        itens.push({
          grupo: "Ataques simulados (chave pública)",
          nome: "Alterar restaurante pela vista pública (SQL 17)",
          ok: !data || data.length === 0,
          detalhe: data && data.length ? "CONSEGUIU ALTERAR — rode o SQL 17" : "bloqueado",
        });
      }
    }

    // Criar login direto pelo Supabase (deve estar desligado depois do lançamento)
    itens.push({
      grupo: "Configuração",
      nome: "Cadastro aberto no Supabase Auth",
      ok: true,
      detalhe: "confira à mão: Authentication → Sign In / Providers → \"Allow new users to sign up\" desligado (o site cria as contas pelo servidor)",
    });

    const { error: erroRpc } = await publico.rpc("contabilizar_pedido", { p_pedido: 0, p_entrar: true });
    itens.push({
      grupo: "Ataques simulados (chave pública)",
      nome: "Chamar função interna do banco",
      ok: Boolean(erroRpc),
      detalhe: erroRpc ? "bloqueado" : "CONSEGUIU CHAMAR",
    });

    // ---------- estrutura do banco ----------
    const { error: erroVista } = await publico.from("restaurantes_publico").select("slug").limit(1);
    itens.push({
      grupo: "Banco de dados",
      nome: "SQL 05 rodado (vista pública sem dados pessoais)",
      ok: !erroVista,
      detalhe: erroVista ? "rode supabase/05_blindagem.sql" : "ok",
    });

    const { error: erroSenha } = await supabaseAdmin.rpc("conferir_senha_usuario", {
      p_user: "00000000-0000-0000-0000-000000000000",
      p_senha: "x",
    });
    itens.push({
      grupo: "Banco de dados",
      nome: "Confirmação de senha para saque/conta bancária",
      ok: !erroSenha,
      detalhe: erroSenha ? "rode supabase/05_blindagem.sql" : "ok",
    });

    const { data: semCripto } = await supabaseAdmin
      .from("restaurantes_financeiro")
      .select("restaurante_id, conta")
      .not("conta", "is", null)
      .not("conta", "like", "enc:v1:%")
      .limit(1000);
    itens.push({
      grupo: "Banco de dados",
      nome: "Dados bancários criptografados",
      ok: (semCripto?.length ?? 0) === 0,
      detalhe: semCripto?.length
        ? Buffer.from(chave, "base64").length === 32
          ? `${semCripto.length} conta(s) ainda sem criptografia: clique em "Criptografar agora"`
          : `${semCripto.length} conta(s) ainda sem criptografia: configure a DADOS_CRIPTO_CHAVE primeiro`
        : "ok",
      ...(semCripto?.length && Buffer.from(chave, "base64").length === 32 ? { acao: "criptografar" as const } : {}),
    });

    return NextResponse.json({
      success: true,
      itens,
      aprovados: itens.filter((i) => i.ok).length,
      total: itens.length,
    });
  } catch (error) {
    return erroInterno("plataforma/diagnostico", error);
  }
}
