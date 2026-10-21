import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Painel da plataforma | MeuCardápioApp",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
