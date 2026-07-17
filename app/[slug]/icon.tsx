import { ImageResponse } from "next/og";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default async function Icon({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: restaurante } = await supabaseAdmin
    .from("restaurantes")
    .select("id")
    .eq("slug", slug)
    .single();

  let logo = "";

  if (restaurante) {
    const { data: aparencia } = await supabaseAdmin
      .from("aparencia")
      .select("logo_url")
      .eq("restaurante_id", restaurante.id)
      .single();

    logo = aparencia?.logo_url || "";
  }

  if (!logo) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#6D1F2F",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 120,
            fontWeight: 700,
          }}
        >
          M
        </div>
      ),
      {
        ...size,
      }
    );
  }

  return new ImageResponse(
    (
      <img
        src={logo}
        alt="Logo"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    ),
    {
      ...size,
    }
  );
}