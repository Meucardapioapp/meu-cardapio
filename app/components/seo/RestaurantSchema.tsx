export default function RestaurantSchema({
  restaurante,
  aparencia,
}: {
  restaurante: any;
  aparencia: any;
}) {
  const logo = aparencia?.logo_url || "";

  const schema = {
    "@context": "https://schema.org",

    "@type": "Restaurant",

    name: restaurante.nome_restaurante,

    description:
      restaurante.descricao ||
      `Cardápio online da ${restaurante.nome_restaurante}.`,

    url: `https://meucardapioapp.com/${restaurante.slug}`,

    hasMenu: `https://meucardapioapp.com/${restaurante.slug}`,

    telephone: restaurante.whatsapp || restaurante.telefone,

    servesCuisine: restaurante.categoria,

    priceRange: "$",

    image: {
      "@type": "ImageObject",
      url: logo,
    },

    logo: {
      "@type": "ImageObject",
      url: logo,
    },

    contactPoint: {
      "@type": "ContactPoint",
      telephone: restaurante.whatsapp || restaurante.telefone,
      contactType: "customer service",
      areaServed: "BR",
      availableLanguage: "Portuguese",
    },

    address: {
      "@type": "PostalAddress",

      streetAddress: restaurante.endereco,

      addressLocality: restaurante.cidade,

      addressRegion: restaurante.estado,

      postalCode: restaurante.cep,

      addressCountry: "BR",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        // Escapa "<" para um nome com "</script>" não virar código.
        __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
      }}
    />
  );
}