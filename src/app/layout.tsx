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
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="icon" href="/icon.png" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body className="antialiased bg-[#fcfaf7]">
        <AuthGuard>{children}</AuthGuard>

        {/* --- ACTIVADOR DE DESCARGA (SERVICE WORKER) --- */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('App lista para instalar');
                  }, function(err) {
                    console.log('Error en activador:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}