import { Metadata } from "next";
import { preload } from "react-dom";
import CardapioClient from "./CardapioClient";
import RestaurantSchema from "../components/seo/RestaurantSchema";
import { carregarCardapio } from "@/lib/server/cardapio";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { slug } = await params;

  const dados = await carregarCardapio(slug);
  const restaurante = dados?.restaurante;
  const aparencia = dados?.aparencia;

  if (!restaurante) {
    return {
      title: "Cardápio",
      description: "Cardápio Online",
    };
  }

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

   manifest: `/${slug}/manifest.webmanifest`,

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

  // Busca tudo no servidor: o cardápio chega pronto, sem tela de carregamento.
  const dados = await carregarCardapio(slug);
  const restaurante = dados?.restaurante;
  const aparencia = dados?.aparencia;

  // Começa a baixar o banner e a logo junto com a página.
  if (aparencia?.banner_url) preload(aparencia.banner_url, { as: "image", fetchPriority: "high" });
  if (aparencia?.logo_url) preload(aparencia.logo_url, { as: "image" });

  return (
    <>
      {restaurante && (
        <RestaurantSchema
          restaurante={restaurante}
          aparencia={aparencia}
        />
      )}

      <CardapioClient inicial={dados ?? undefined} />
    </>
  );
}