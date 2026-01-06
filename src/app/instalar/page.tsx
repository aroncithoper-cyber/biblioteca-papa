"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";

export default function InstalarPage() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <main className="min-h-screen bg-[#fcfaf7] font-serif">
      <Header />

      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <img
          src="/icon-512.png"
          alt="Consejero del Obrero"
          className="w-24 h-24 mx-auto mb-8 rounded-[2rem] shadow-2xl border border-amber-100 p-2 bg-white"
        />

        <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tighter">
          Aplicación Oficial
        </h1>

        <p className="text-gray-500 italic mb-12">
          Lleva la biblioteca de José Enrique Pérez León siempre contigo.
        </p>

        {installPrompt ? (
          <button
            onClick={handleInstall}
            className="w-full py-6 bg-amber-600 text-white rounded-full font-bold text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-black transition-all animate-pulse"
          >
            📥 Instalar Ahora
          </button>
        ) : (
          <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-amber-50 text-left">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-6">
              Instrucciones de instalación
            </h3>

            <div className="space-y-8">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <p className="text-sm text-gray-600">
                  En iPhone, toca <strong>Compartir</strong> (icono del
                  cuadrado con flecha).
                </p>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <p className="text-sm text-gray-600">
                  Selecciona <strong>“Añadir a pantalla de inicio”</strong>.
                </p>
              </div>

              <p className="text-xs text-gray-400 pt-4">
                En Android, también puedes usar el menú ⋮ →
                <strong> Instalar aplicación</strong>.
              </p>
            </div>
          </div>
        )}

        <p className="mt-12 text-[10px] text-gray-300 uppercase tracking-[0.5em] font-bold">
          Consejero del Obrero 2026
        </p>
      </div>
    </main>
  );
}
