import type { Metadata } from "next";
import AppCozinha from "./AppCozinha";

export const metadata: Metadata = {
  title: "Cozinha — MeuCardápio",
  robots: { index: false, follow: false },
  manifest: "/equipe.webmanifest",
  appleWebApp: { capable: true, title: "Cozinha", statusBarStyle: "black" },
};

export default function CozinhaPage() {
  return <AppCozinha />;
}
