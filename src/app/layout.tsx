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
  // Esto ayuda a que el icono se vea bien al compartir el link
  openGraph: {
    title: "Consejero del Obrero",
    description: "Biblioteca Digital",
    images: [{ url: "/icon.png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#fcfaf7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Evita que la app se mueva raro al escribir
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        {/* Etiquetas extra para que el iPhone lo reconozca como App de inmediato */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="icon" href="/icon.png" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body className="antialiased bg-[#fcfaf7]">
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}