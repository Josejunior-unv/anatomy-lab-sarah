import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { Casca } from "@/components/Casca";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Anatomy Lab — Sarah", template: "%s · Anatomy Lab" },
  description: "Laboratório digital de neuroanatomia e anatomia óssea da Sarah: modelos 3D, flashcards, simulados e desempenho.",
};

export const viewport: Viewport = { themeColor: "#f5f4fa", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${manrope.variable} antialiased`}>
      <body>
        <Casca>{children}</Casca>
      </body>
    </html>
  );
}
