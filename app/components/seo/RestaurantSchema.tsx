export default function RestaurantSchema({
  restaurante,
  aparencia,
}: {
  restaurante: any;
  aparencia: any;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Restaurant",

    name: restaurante.nome_restaurante,

    image: aparencia?.logo_url,

    url: `https://meucardapioapp.com/${restaurante.slug}`,

    telephone: restaurante.telefone,

    description:
      restaurante.descricao ||
      `Cardápio online da ${restaurante.nome_restaurante}.`,

    servesCuisine:
      restaurante.categoria,

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
        __html: JSON.stringify(schema),
      }}
    />
  );
}