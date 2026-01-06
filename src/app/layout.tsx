import "./globals.css";
import AuthGuard from "@/components/AuthGuard";
import { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Consejero del Obrero",
  description: "Biblioteca digital de la obra de Jose Enrique Perez Leon",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Consejero",
  },
};

export const viewport: Viewport = {
  themeColor: "#fcfaf7", // Cambiado al color crema para que combine con el diseño
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/icon.png" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body className="antialiased bg-[#fcfaf7]">
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}