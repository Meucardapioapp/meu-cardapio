import { ReactNode } from "react";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { restaurantePodeReceberPedidos } from "@/lib/server/assinatura";
import CardapioIndisponivel from "../components/CardapioIndisponivel";
import PixelComConsentimento from "../components/PixelComConsentimento";

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

  // =====================================================
  // BUSCAR RESTAURANTE + META PIXEL
  // =====================================================

  const { data: restaurante } =
    await supabaseAdmin
      .from("restaurantes")
      .select("id, meta_pixel_id, nome_restaurante, whatsapp")
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
        .limit(1)
        .maybeSingle();

    if (aparencia) {
      logo = aparencia.logo_url || "";

      corPrincipal =
        aparencia.cor_primaria ||
        "#6D1F2F";
    }
  }

  // Plano vencido (ou teste grátis acabou): cardápio fica fora do ar
  // até o pagamento ser confirmado.
  if (restaurante && !(await restaurantePodeReceberPedidos(String(restaurante.id)))) {
    return (
      <CardapioIndisponivel
        nome={restaurante.nome_restaurante || ""}
        logo={logo}
        cor={corPrincipal}
        whatsapp={String(restaurante.whatsapp || "")}
      />
    );
  }

  // Só números: impede que um valor malicioso vire código no cardápio.
  const pixelId = String(restaurante?.meta_pixel_id || "").replace(/\D/g, "").slice(0, 20);

  return (
    <RestaurantProvider
      initialLogo={logo}
      initialCorPrincipal={corPrincipal}
    >
      {/* =====================================================
          META PIXEL DO RESTAURANTE
          ===================================================== */}

      {/* Pixel do Meta: só carrega depois que o cliente aceita os cookies de marketing. */}
      {pixelId && <PixelComConsentimento pixelId={pixelId} />}

      {children}
    </RestaurantProvider>
  );
}