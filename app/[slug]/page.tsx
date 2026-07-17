import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import CardapioClient from "./CardapioClient";
import RestaurantSchema from "../components/seo/RestaurantSchema";

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

  const categoria =
    restaurante.categoria || "Restaurante";

  const cidade =
    restaurante.cidade || "";

  const estado =
    restaurante.estado || "";

  const titulo = `${restaurante.nome_restaurante} | ${categoria} em ${cidade} ${estado} | Delivery`;

  const descricao =
    restaurante.descricao ||
    `Peça no ${restaurante.nome_restaurante} em ${cidade}. Cardápio online com entrega, Pix e cartão.`;

  const logo = aparencia?.logo_url || undefined;

 return {
  title: titulo,

  description: descricao,

  icons: {
    icon: logo,
    apple: logo,
  },

  keywords: [
      restaurante.nome_restaurante,
      categoria,
      cidade,
      estado,
      "Delivery",
      "Cardápio Online",
      "Cardápio Digital",
      "Pedido Online",
      "Pix",
      "Restaurante",
    ],

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

export default async function Page({ params }: Props) {
  const { slug } = await params;

  const { data: restaurante } = await supabase
    .from("restaurantes")
    .select("*")
    .eq("slug", slug)
    .single();

  const { data: aparencia } = await supabase
    .from("aparencia")
    .select("*")
    .eq("restaurante_id", restaurante?.id)
    .single();

  return (
    <>
      {restaurante && (
        <RestaurantSchema
          restaurante={restaurante}
          aparencia={aparencia}
        />
      )}

      <CardapioClient />
    </>
  );
}