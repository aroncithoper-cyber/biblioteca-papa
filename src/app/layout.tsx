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
  icons: {
    icon: "/icon-512.png",
    apple: "/icon-512.png",
  },
  openGraph: {
    title: "Consejero del Obrero",
    description: "Biblioteca Digital",
    images: [{ url: "/icon-512.png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#fcfaf7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Bloqueamos el zoom del navegador para que la App se sienta nativa
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased bg-[#fcfaf7]">
        <AuthGuard>{children}</AuthGuard>

        {/* Registro del Service Worker optimizado */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').then(reg => {
                    console.log('✅ Modo Offline Activado');
                  }).catch(err => {
                    console.log('❌ Error en SW:', err);
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