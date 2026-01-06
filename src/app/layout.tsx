import "./globals.css";
import AuthGuard from "@/components/AuthGuard";
import { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  // Título que aparece en la pestaña del navegador y en Google
  title: "Consejero del Obrero | Legado Digital",
  
  // Descripción que aparece debajo del título en Google
  description: "Biblioteca oficial de la obra de Jose Enrique Perez Leon. Estudios, libros y enseñanzas para la edificación del obrero.",
  
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

  // --- ESTO ES LO QUE LEE WHATSAPP ---
  openGraph: {
    title: "Consejero del Obrero | Legado Digital",
    description: "Accede a la colección digital de estudios y libros de Jose Enrique Perez Leon.",
    siteName: "Consejero del Obrero",
    images: [
      {
        url: "/icon-512.png", // WhatsApp usará tu logo de alta calidad como portada
        width: 512,
        height: 512,
        alt: "Logo Consejero",
      },
    ],
    locale: "es_MX",
    type: "website",
  },
  
  // Configuración extra para Twitter/X
  twitter: {
    card: "summary",
    title: "Consejero del Obrero",
    description: "Biblioteca oficial de Jose Enrique Perez Leon.",
    images: ["/icon-512.png"],
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