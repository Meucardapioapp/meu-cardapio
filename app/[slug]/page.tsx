import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import CardapioClient from "./CardapioClient";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { slug } = await params;

  const { data: restaurante } = await supabase
    .from("restaurantes")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!restaurante) {
    return {
      title: "Cardápio",
      description: "Cardápio Online",
    };
  }

  const { data: aparencia } = await supabase
    .from("aparencia")
    .select("*")
    .eq("restaurante_id", restaurante.id)
    .single();

  const titulo = `${restaurante.nome_restaurante} | Cardápio Online`;

  const descricao = `Faça seu pedido no cardápio online da ${restaurante.nome_restaurante}.`;

  const logo = aparencia?.logo_url || undefined;

  return {
    title: titulo,

    description: descricao,

    alternates: {
      canonical: `https://meucardapioapp.com/${slug}`,
    },

    openGraph: {
      title: titulo,
      description: descricao,
      url: `https://meucardapioapp.com/${slug}`,
      siteName: "MeuCardápioApp",
      locale: "pt_BR",
      type: "website",
      images: logo
        ? [
            {
              url: logo,
              width: 512,
              height: 512,
              alt: restaurante.nome_restaurante,
            },
          ]
        : [],
    },

    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: descricao,
      images: logo ? [logo] : [],
    },

    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function Page() {
  return <CardapioClient />;
}