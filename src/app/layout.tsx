import "./globals.css";
import AuthGuard from "@/components/AuthGuard";
import { Metadata, Viewport } from "next";
import { PlayerProvider } from "@/lib/PlayerContext"; 
import GlobalPlayer from "@/components/GlobalPlayer"; 
import NotificationManager from "@/components/NotificationManager"; 

export const metadata: Metadata = {
  title: "Consejero del Obrero | Legado Digital",
  // CAMBIO 3: Metadatos sin "Oficial"
  description: "Acervo personal y legado espiritual de la obra de Jose Enrique Perez Leon. Estudios, libros y enseñanzas para la edificación del obrero.",
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
    title: "Consejero del Obrero | Legado Digital",
    description: "Accede a la colección digital de estudios y libros de Jose Enrique Perez Leon.",
    siteName: "Consejero del Obrero",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "Logo Consejero",
      },
    ],
    locale: "es_MX",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Consejero del Obrero",
    description: "Acervo personal de Jose Enrique Perez Leon.",
    images: ["/icon-512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#fcfaf7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased bg-[#fcfaf7]">
        {/* 🔔 Sistema de Notificaciones Inteligente */}
        <NotificationManager />

        {/* Envolvemos todo en el Proveedor del Reproductor */}
        <PlayerProvider>
          <AuthGuard>
            {children}
            <GlobalPlayer />
          </AuthGuard>
        </PlayerProvider>

        {/* Registro del Service Worker para Modo Offline */}
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