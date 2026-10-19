import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { esquemaEndereco, primeiroErro } from "@/lib/esquemas";
import { tokenDoCliente } from "@/lib/server/cliente-token";
import { limitar } from "@/lib/server/rate-limit";

export async function GET(req: Request) {
  try {
    if (!(await limitar(req, "cliente-enderecos", 60, 60))) {
      return NextResponse.json({ success: false, error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);

    const token = tokenDoCliente(req);

    if (!token) {
      return NextResponse.json({
        success: false,
        error: "Token não informado.",
      });
    }

    const { data: cliente, error: clienteError } = await supabaseAdmin
      .from("clientes")
      .select("id")
      .eq("token_acesso", token)
      .single();

    if (clienteError || !cliente) {
      return NextResponse.json({
        success: false,
        error: "Cliente não encontrado.",
      });
    }

    const { data: enderecos, error } = await supabaseAdmin
      .from("enderecos_cliente")
      .select("*")
      .eq("cliente_id", cliente.id)
      .order("principal", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({
        success: false,
        error: "Erro ao salvar. Tente novamente.",
      });
    }

    return NextResponse.json({
      success: true,
      enderecos,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: "Erro ao salvar. Tente novamente.",
    });
  }
}

export async function POST(req: Request) {
  try {
    if (!(await limitar(req, "cliente-enderecos", 60, 60))) {
      return NextResponse.json({ success: false, error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });
    }

    const validacao = esquemaEndereco.safeParse(await req.json());

    if (!validacao.success) {
      return NextResponse.json({ success: false, error: primeiroErro(validacao.error) }, { status: 400 });
    }

    const body = validacao.data;

    const {
      token,
      apelido,
      cep,
      rua,
      numero,
      bairro,
      cidade,
      estado,
      complemento,
      referencia,
      principal,
    } = body;

    if (!token) {
      return NextResponse.json({
        success: false,
        error: "Token não informado.",
      });
    }

    const { data: cliente } = await supabaseAdmin
      .from("clientes")
      .select("id")
      .eq("token_acesso", token)
      .single();

    if (!cliente) {
      return NextResponse.json({
        success: false,
        error: "Cliente não encontrado.",
      });
    }

    if (principal) {
      await supabaseAdmin
        .from("enderecos_cliente")
        .update({ principal: false })
        .eq("cliente_id", cliente.id);
    }

    const { data, error } = await supabaseAdmin
      .from("enderecos_cliente")
      .insert({
        cliente_id: cliente.id,
        apelido,
        cep,
        rua,
        numero,
        bairro,
        cidade,
        estado,
        complemento,
        referencia,
        principal,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        error: "Erro ao salvar. Tente novamente.",
      });
    }

    return NextResponse.json({
      success: true,
      endereco: data,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: "Erro ao salvar. Tente novamente.",
    });
  }

}

export async function PUT(req: Request) {
  try {
    if (!(await limitar(req, "cliente-enderecos", 60, 60))) {
      return NextResponse.json({ success: false, error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });
    }

    const validacao = esquemaEndereco.safeParse(await req.json());

    if (!validacao.success) {
      return NextResponse.json({ success: false, error: primeiroErro(validacao.error) }, { status: 400 });
    }

    const body = validacao.data;

    const {
      token,
      id,
      apelido,
      cep,
      rua,
      numero,
      bairro,
      cidade,
      estado,
      complemento,
      referencia,
      principal,
    } = body;

    if (!token || !id) {
      return NextResponse.json({
        success: false,
        error: "Dados inválidos.",
      });
    }

    const { data: cliente } = await supabaseAdmin
      .from("clientes")
      .select("id")
      .eq("token_acesso", token)
      .single();

    if (!cliente) {
      return NextResponse.json({
        success: false,
        error: "Cliente não encontrado.",
      });
    }

    if (principal) {
      await supabaseAdmin
        .from("enderecos_cliente")
        .update({ principal: false })
        .eq("cliente_id", cliente.id);
    }

    const { data, error } = await supabaseAdmin
      .from("enderecos_cliente")
      .update({
        apelido,
        cep,
        rua,
        numero,
        bairro,
        cidade,
        estado,
        complemento,
        referencia,
        principal,
      })
      .eq("id", id)
      .eq("cliente_id", cliente.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        error: "Erro ao salvar. Tente novamente.",
      });
    }

    return NextResponse.json({
      success: true,
      endereco: data,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: "Erro ao salvar. Tente novamente.",
    });
  }
}

export async function DELETE(req: Request) {
  try {
    if (!(await limitar(req, "cliente-enderecos", 60, 60))) {
      return NextResponse.json({ success: false, error: "Muitas tentativas. Aguarde um pouco." }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);

    const token = tokenDoCliente(req);
    const id = searchParams.get("id");

    if (!token || !id) {
      return NextResponse.json({
        success: false,
        error: "Dados inválidos.",
      });
    }

    const { data: cliente } = await supabaseAdmin
      .from("clientes")
      .select("id")
      .eq("token_acesso", token)
      .single();

    if (!cliente) {
      return NextResponse.json({
        success: false,
        error: "Cliente não encontrado.",
      });
    }

    const { error } = await supabaseAdmin
      .from("enderecos_cliente")
      .delete()
      .eq("id", id)
      .eq("cliente_id", cliente.id);

    if (error) {
      return NextResponse.json({
        success: false,
        error: "Erro ao salvar. Tente novamente.",
      });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: "Erro ao salvar. Tente novamente.",
    });
  }
}

