import { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://meucardapioapp.com";

  const { data: restaurantes } = await supabase
    .from("restaurantes")
    .select("slug, created_at");

  const paginasFixas: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/cadastro`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  const paginasRestaurantes: MetadataRoute.Sitemap =
    (restaurantes ?? [])
      .filter((restaurante) => restaurante.slug)
      .map((restaurante) => ({
        url: `${baseUrl}/${restaurante.slug}`,
        lastModified: restaurante.created_at
          ? new Date(restaurante.created_at)
          : new Date(),
        changeFrequency: "daily" as const,
        priority: 0.9,
      }));

  return [...paginasFixas, ...paginasRestaurantes];
}