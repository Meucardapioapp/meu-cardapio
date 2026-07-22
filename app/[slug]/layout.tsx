import { ReactNode } from "react";
import Script from "next/script";

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

  // =====================================================
  // BUSCAR RESTAURANTE + META PIXEL
  // =====================================================

  const { data: restaurante } =
    await supabaseAdmin
      .from("restaurantes")
      .select("id, meta_pixel_id")
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

  const pixelId =
    restaurante?.meta_pixel_id || "";

  return (
    <RestaurantProvider
      initialLogo={logo}
      initialCorPrincipal={corPrincipal}
    >
      {/* =====================================================
          META PIXEL DO RESTAURANTE
          ===================================================== */}

      {pixelId && (
        <>
          <Script
            id={`meta-pixel-${pixelId}`}
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {
                  if(f.fbq)return;
                  n=f.fbq=function(){
                    n.callMethod?
                    n.callMethod.apply(n,arguments):
                    n.queue.push(arguments)
                  };

                  if(!f._fbq)f._fbq=n;

                  n.push=n;
                  n.loaded=!0;
                  n.version='2.0';
                  n.queue=[];

                  t=b.createElement(e);
                  t.async=!0;
                  t.src=v;

                  s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)
                }
                (
                  window,
                  document,
                  'script',
                  'https://connect.facebook.net/en_US/fbevents.js'
                );

                fbq('init', '${pixelId}');
                fbq('track', 'PageView');
              `,
            }}
          />
        </>
      )}

      {children}
    </RestaurantProvider>
  );
}