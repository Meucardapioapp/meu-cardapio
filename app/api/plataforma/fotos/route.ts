import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { acessoNegado, erroInterno, isDonoDaPlataforma } from "@/lib/server/auth";

/**
 * Deixa leves as fotos que já estavam no sistema (só o dono da plataforma).
 * O navegador do dono baixa cada foto, diminui e manda de volta aqui; este
 * servidor guarda a versão leve e troca o endereço no cardápio.
 * A foto original continua guardada (nada é apagado).
 */

type Alvo = { tabela: "produtos" | "aparencia"; campo: "imagem" | "logo_url" | "banner_url" };
const ALVOS: Alvo[] = [
  { tabela: "produtos", campo: "imagem" },
  { tabela: "aparencia", campo: "logo_url" },
  { tabela: "aparencia", campo: "banner_url" },
];
const MARCA = "/otm-";
const PUBLICO = "/storage/v1/object/public/";

function partesDaUrl(url: string) {
  const base = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  if (!base || !url.startsWith(base + PUBLICO)) return null;
  const resto = url.slice((base + PUBLICO).length).split("?")[0];
  const [bucket, ...caminho] = resto.split("/");
  if (!bucket || !caminho.length) return null;
  return { bucket, pasta: caminho.slice(0, -1).join("/") };
}

/** Lista as fotos que ainda não foram otimizadas. */
export async function GET(req: NextRequest) {
  try {
    if (!(await isDonoDaPlataforma(req))) return acessoNegado();

    const lista: { tabela: string; campo: string; chave: string; url: string }[] = [];
    for (const alvo of ALVOS) {
      const chaveCol = alvo.tabela === "produtos" ? "id" : "restaurante_id";
      for (let de = 0; de < 20000; de += 1000) {
        const { data, error } = await supabaseAdmin
          .from(alvo.tabela)
          .select(`${chaveCol}, ${alvo.campo}`)
          .not(alvo.campo, "is", null)
          .order(chaveCol)
          .range(de, de + 999);
        if (error) throw error;
        for (const linha of (data ?? []) as any[]) {
          const url = String(linha[alvo.campo] || "");
          if (!url || url.includes(MARCA) || !partesDaUrl(url)) continue;
          lista.push({ tabela: alvo.tabela, campo: alvo.campo, chave: String(linha[chaveCol]), url });
        }
        if ((data ?? []).length < 1000) break;
      }
    }

    return NextResponse.json({ success: true, fotos: lista });
  } catch (error) {
    return erroInterno("plataforma/fotos GET", error);
  }
}

/** Recebe a versão leve de uma foto e troca no cardápio. */
export async function POST(req: NextRequest) {
  try {
    if (!(await isDonoDaPlataforma(req))) return acessoNegado();

    const form = await req.formData();
    const tabela = String(form.get("tabela") || "");
    const campo = String(form.get("campo") || "");
    const chave = String(form.get("chave") || "");
    const urlAntiga = String(form.get("url") || "");
    const arquivo = form.get("arquivo");

    const alvo = ALVOS.find((a) => a.tabela === tabela && a.campo === campo);
    if (!alvo || !chave || !(arquivo instanceof Blob)) {
      return NextResponse.json({ success: false, error: "Dados inválidos." }, { status: 400 });
    }
    if (!/^image\/(webp|jpeg)$/.test(arquivo.type) || arquivo.size > 3 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "Arquivo inválido." }, { status: 400 });
    }

    const partes = partesDaUrl(urlAntiga);
    if (!partes) return NextResponse.json({ success: false, error: "Foto fora do Storage." }, { status: 400 });

    const chaveCol = alvo.tabela === "produtos" ? "id" : "restaurante_id";
    const { data: linha } = await supabaseAdmin.from(alvo.tabela).select(alvo.campo).eq(chaveCol, chave).maybeSingle();
    // Só troca se ninguém mudou a foto nesse meio tempo.
    if (!linha || String((linha as any)[alvo.campo] || "") !== urlAntiga) {
      return NextResponse.json({ success: true, pulada: true });
    }

    const ext = arquivo.type === "image/webp" ? "webp" : "jpg";
    const caminho = `${partes.pasta ? partes.pasta + "/" : ""}otm-${crypto.randomUUID()}.${ext}`;
    const { error: erroUpload } = await supabaseAdmin.storage.from(partes.bucket).upload(caminho, arquivo, {
      contentType: arquivo.type,
      cacheControl: "31536000",
      upsert: false,
    });
    if (erroUpload) throw erroUpload;

    const novaUrl = supabaseAdmin.storage.from(partes.bucket).getPublicUrl(caminho).data.publicUrl;
    const { error: erroUpdate } = await supabaseAdmin
      .from(alvo.tabela)
      .update({ [alvo.campo]: novaUrl })
      .eq(chaveCol, chave)
      .eq(alvo.campo, urlAntiga);
    if (erroUpdate) throw erroUpdate;

    return NextResponse.json({ success: true, url: novaUrl });
  } catch (error) {
    return erroInterno("plataforma/fotos POST", error);
  }
}
