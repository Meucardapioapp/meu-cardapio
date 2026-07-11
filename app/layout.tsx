import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { Toaster } from "sonner"
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://meucardapioapp.com"),

  title: {
    default: "MeuCardápioApp",
    template: "%s | MeuCardápioApp",
  },

  description:
    "Crie seu cardápio digital em menos de 5 minutos. Receba pedidos pelo WhatsApp, aceite Pix e cartão e venda mais sem depender de aplicativos de delivery.",

  keywords: [
    "cardápio digital",
    "cardápio online",
    "delivery",
    "restaurante",
    "pizzaria",
    "hamburgueria",
    "açaí",
    "menu digital",
    "MeuCardápioApp",
  ],

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "MeuCardápioApp",
    description:
      "Crie seu cardápio digital em menos de 5 minutos.",
    url: "https://meucardapioapp.com",
    siteName: "MeuCardápioApp",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MeuCardápioApp",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "MeuCardápioApp",
    description:
      "Crie seu cardápio digital em menos de 5 minutos.",
    images: ["/og-image.png"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },


};

export const viewport = {
  themeColor: "#6D1F2F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
  lang="pt-BR"
  className={cn(
    "h-full",
    "antialiased",
    geistSans.variable,
    geistMono.variable,
    "font-sans",
    inter.variable
  )}
>
      <body className="min-h-full flex flex-col">
  {children}

  <Toaster
    position="top-right"
    richColors
    closeButton
  />
</body>
    </html>
  );
}
