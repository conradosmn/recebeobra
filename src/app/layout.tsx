import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recebimento Provisório - Anexo III",
  description: "Registro fotográfico de recebimento provisório de obra — TCE-PI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
