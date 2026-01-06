import "./globals.css";
import AuthGuard from "@/components/AuthGuard";
import { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Consejero del Obrero",
  description: "Biblioteca digital de la obra de Jose Enrique Perez Leon",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Consejero",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
      </head>
      <body>
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}