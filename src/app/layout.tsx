import "./globals.css";
import AuthGuard from "@/components/AuthGuard";
import { Metadata, Viewport } from "next";
import { PlayerProvider } from "@/lib/PlayerContext";
import GlobalPlayer from "@/components/GlobalPlayer";
import NotificationManager from "@/components/NotificationManager";

export const metadata: Metadata = {
  title: {
    default: "Consejero del Obrero",
    template: "%s | Consejero del Obrero",
  },
  description:
    "Archivo personal de estudios y escritos cristianos de J. Enrique Pérez León, compartidos para la edificación fraternal.",
  manifest: "/manifest.json",
  applicationName: "Consejero del Obrero",
  authors: [{ name: "J. Enrique Pérez León" }],
  keywords: [
    "estudios cristianos",
    "formación del obrero",
    "lectura cristiana",
    "biblioteca cristiana",
    "consejero del obrero",
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Consejero del Obrero",
  },
  icons: {
    icon: "/icon-512.png",
    apple: "/icon-512.png",
  },
  openGraph: {
    title: "Consejero del Obrero",
    description:
      "Archivo personal de estudios cristianos compartidos para la edificación de los hermanos.",
    siteName: "Consejero del Obrero",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "Consejero del Obrero",
      },
    ],
    locale: "es_MX",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Consejero del Obrero",
    description:
      "Archivo personal de estudios cristianos de J. Enrique Pérez León.",
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
        <NotificationManager />

        <PlayerProvider>
          <AuthGuard>
            {children}
            <GlobalPlayer />
          </AuthGuard>
        </PlayerProvider>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}