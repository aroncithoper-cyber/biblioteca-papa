"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import InstallGuideModal from "@/components/InstallGuideModal";
import { getMessaging, getToken } from "firebase/messaging";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function LandingPage() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const handleEnableNotifications = async () => {
    if (!("Notification" in window)) return;

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      try {
        const messaging = getMessaging();
        const token = await getToken(messaging, {
          vapidKey:
            "BFlxGRnMNZ9xXK5WT7K0LzAt56PKDZ64kyPfb8OIOCWimsg4zupJdFcs3G2wnyRMOqxREywZBl1Rdzo5G6es03E",
        });

        if (token) {
          await addDoc(collection(db, "fcm_tokens"), {
            token,
            createdAt: serverTimestamp(),
          });
        }
      } catch {}
    }
  };

  return (
    <main className="min-h-screen bg-[#fcfaf7] font-serif selection:bg-amber-200">
      <Header />

      <InstallGuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
      />

      {/* BOTONES FLOTANTES DISCRETOS */}
      <div className="fixed bottom-6 z-[100] left-0 right-0 flex justify-center gap-3 px-4 pointer-events-none">
        {installPrompt && (
          <button
            onClick={handleInstallClick}
            className="pointer-events-auto px-5 py-2 bg-amber-600 text-white rounded-full text-[10px] uppercase tracking-[0.2em] shadow-md hover:bg-black transition"
          >
            Instalar
          </button>
        )}

        <button
          onClick={handleEnableNotifications}
          className="pointer-events-auto px-5 py-2 bg-white border border-gray-200 rounded-full text-[10px] uppercase tracking-[0.2em] shadow-sm hover:bg-black hover:text-white transition"
        >
            Avisos
        </button>
      </div>

      {/* HERO PRINCIPAL */}
      <section className="relative pt-28 pb-28 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-8">

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900 leading-tight tracking-tight">
            Consejero del Obrero
          </h1>

          <div className="h-1 w-20 bg-amber-600 mx-auto rounded-full"></div>

          <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
            Archivo personal de estudios y escritos cristianos
          </p>

          <p className="text-sm text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Este espacio reúne parte del trabajo realizado por 
            J. Enrique Pérez León a lo largo de los años,
            compartido con sencillez para la edificación fraternal.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link
              href="/biblioteca"
              className="w-full sm:w-auto px-8 py-3 bg-black text-white rounded-full text-[11px] uppercase tracking-widest hover:bg-amber-600 transition"
            >
              Biblioteca
            </Link>

            <Link
              href="/biografia"
              className="w-full sm:w-auto px-8 py-3 bg-white border border-gray-200 rounded-full text-[11px] uppercase tracking-widest hover:bg-gray-100 transition"
            >
              Autor
            </Link>
          </div>
        </div>
      </section>

      {/* SECCIÓN CONTEXTO */}
      <section className="py-20 bg-white border-t border-amber-50">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-6">

          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Una labor escrita con propósito
          </h2>

          <p className="text-gray-600 leading-loose max-w-3xl mx-auto">
            Los materiales aquí compartidos nacen del deseo de conservar
            apuntes y estudios que han servido en distintos momentos del
            ministerio. No constituyen publicación oficial, sino un archivo
            personal puesto a disposición de los hermanos.
          </p>

          <div className="pt-6">
            <Link
              href="/biblioteca"
              className="text-xs font-bold uppercase tracking-[0.3em] text-amber-700 hover:text-amber-900 transition"
            >
              Explorar escritos →
            </Link>
          </div>

        </div>
      </section>

      {/* FOOTER SOBRIO */}
      <footer className="bg-[#121212] text-white py-16 px-6 text-center">
        <img
          src="/icon-512.png"
          className="w-10 h-10 mx-auto mb-6 opacity-30 grayscale invert"
          alt="Logo"
        />

        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-4">
          Consejero del Obrero
        </p>

        <p className="text-[10px] text-gray-400 max-w-xl mx-auto leading-relaxed mb-4">
          Archivo personal destinado a la edificación fraternal.
        </p>

        <p className="text-[9px] text-gray-500">
          Este sitio no representa a la administración general.
        </p>
      </footer>
    </main>
  );
}