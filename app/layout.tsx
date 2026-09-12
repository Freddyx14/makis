import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Makis OS — el equipo de marketing que vive en tu Google Workspace",
  description:
    "Pega la URL de tu negocio. Makis investiga, construye la campaña y te deja la carpeta montada en tu Drive. Tú solo gobiernas.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
