import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const token = searchParams.get("token");

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
        error: error.message,
      });
    }

    return NextResponse.json({
      success: true,
      enderecos,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

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
        error: error.message,
      });
    }

    return NextResponse.json({
      success: true,
      endereco: data,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
    });
  }

}

export async function PUT(req: Request) {
  try {
    const body = await req.json();

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
        error: error.message,
      });
    }

    return NextResponse.json({
      success: true,
      endereco: data,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
    });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const token = searchParams.get("token");
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
        error: error.message,
      });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
    });
  }
}

