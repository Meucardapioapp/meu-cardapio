import { ReactNode } from "react";

import { supabaseAdmin } from "@/lib/supabase-admin";

import {
  RestaurantProvider,
} from "@/contexts/RestaurantContext";

type Props = {
  children: ReactNode;
  params: Promise<{
    slug: string;
  }>;
};

export default async function Layout({
  children,
  params,
}: Props) {
  const { slug } = await params;

  const { data: restaurante } =
    await supabaseAdmin
      .from("restaurantes")
      .select("id")
      .eq("slug", slug)
      .single();

  let logo = "";
  let corPrincipal = "#6D1F2F";

  if (restaurante) {
    const { data: aparencia } =
      await supabaseAdmin
        .from("aparencia")
        .select("logo_url,cor_primaria")
        .eq(
          "restaurante_id",
          restaurante.id
        )
        .single();

    if (aparencia) {
      logo = aparencia.logo_url || "";
      corPrincipal =
        aparencia.cor_primaria ||
        "#6D1F2F";
    }
  }

  return (
    <RestaurantProvider
      initialLogo={logo}
      initialCorPrincipal={corPrincipal}
    >
      {children}
    </RestaurantProvider>
  );
}