import type { Metadata } from "next";
import EntradaEquipe from "./EntradaEquipe";

export const metadata: Metadata = {
  title: "Equipe — MeuCardápio",
  robots: { index: false, follow: false },
};

export default function EquipePage() {
  return <EntradaEquipe />;
}
