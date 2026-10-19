import type { Metadata } from "next";
import AppGarcom from "./AppGarcom";

export const metadata: Metadata = {
  title: "Garçom — MeuCardápio",
  robots: { index: false, follow: false },
  manifest: "/equipe.webmanifest",
  appleWebApp: { capable: true, title: "Garçom", statusBarStyle: "default" },
};

export default function GarcomPage() {
  return <AppGarcom />;
}
