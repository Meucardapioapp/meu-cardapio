import type { Metadata } from "next";
import AppEntregador from "./AppEntregador";

export const metadata: Metadata = {
  title: "Entregas — MeuCardápio",
  robots: { index: false, follow: false },
  manifest: "/entregador.webmanifest",
  appleWebApp: { capable: true, title: "Entregas", statusBarStyle: "default" },
};

export default function EntregadorPage() {
  return <AppEntregador />;
}
