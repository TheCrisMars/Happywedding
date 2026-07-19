import type { Metadata } from "next";
import { Cinzel, Pinyon_Script, Montserrat, Share_Tech_Mono } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  display: "swap",
});

const pinyon = Pinyon_Script({
  weight: "400",
  variable: "--font-pinyon",
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

const shareTechMono = Share_Tech_Mono({
  weight: "400",
  variable: "--font-share-tech-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nuestra Boda - José Andrés & Daviushka",
  description: "Estás invitado a nuestra boda eclesiástica el 07 de Agosto de 2026. ¡Acompáñanos en este gran día!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${cinzel.variable} ${pinyon.variable} ${montserrat.variable} ${shareTechMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAF6F0] text-[#2C261D]">
        {children}
      </body>
    </html>
  );
}

