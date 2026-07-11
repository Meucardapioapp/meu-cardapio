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
    };
  }

  const { data: aparencia } = await supabase
    .from("aparencia")
    .select("*")
    .eq("restaurante_id", restaurante.id)
    .single();

  return {

    title:
      `${restaurante.nome} | Cardápio Online`,

    description:
      restaurante.descricao ||
      `Faça seu pedido no cardápio online da ${restaurante.nome}.`,

    alternates: {
      canonical: `/${slug}`,
    },

    openGraph: {

      title:
        `${restaurante.nome} | Cardápio Online`,

      description:
        restaurante.descricao ||
        `Faça seu pedido online.`,

      url:
        `https://meucardapioapp.com/${slug}`,

      siteName:
        "MeuCardápioApp",

      locale:
        "pt_BR",

      type:
        "website",

      images:
        aparencia?.logo_url
          ? [
              {
                url: aparencia.logo_url,
              },
            ]
          : [],
    },

    twitter: {

      card:
        "summary_large_image",

      title:
        `${restaurante.nome}`,

      description:
        restaurante.descricao ||
        "",

      images:
        aparencia?.logo_url
          ? [aparencia.logo_url]
          : [],
    },
  };
}

export default function Page() {
  return <CardapioClient />;
}