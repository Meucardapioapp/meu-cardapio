import { MetadataRoute } from "next";
import { supabaseAdmin } from "@/lib/supabase-admin";

export default async function manifest({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<MetadataRoute.Manifest> {
  const { slug } = await params;

  const { data: restaurante } = await supabaseAdmin
    .from("restaurantes")
    .select("id")
    .eq("slug", slug)
    .single();

  let nome = "MeuCardápioApp";
  let cor = "#6D1F2F";

  if (restaurante) {
    const { data: aparencia } = await supabaseAdmin
      .from("aparencia")
      .select("nome_restaurante, cor_primaria, logo_url")
      .eq("restaurante_id", restaurante.id)
      .single();

    if (aparencia) {
      nome = aparencia.nome_restaurante || nome;
      cor = aparencia.cor_primaria || cor;
    }
  }

  return {
    name: nome,
    short_name: nome,
    start_url: `/${slug}`,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: cor,
    icons: [
      {
        src: `/${slug}/icon`,
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}