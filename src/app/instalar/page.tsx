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
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#fcfaf7] font-serif overflow-x-hidden">
      <Header />

      <div className="max-w-xl mx-auto px-6 py-16 sm:py-24 text-center">
        {/* ICONO PRINCIPAL */}
        <div className="relative inline-block mb-10">
          <div className="absolute -inset-4 bg-amber-200/30 rounded-[3rem] blur-2xl animate-pulse" />
          <img
            src="/icon-512.png"
            alt="Logo"
            className="relative w-28 h-28 mx-auto rounded-[2.5rem] shadow-2xl border-4 border-white bg-white p-1"
          />
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 tracking-tighter">
          Biblioteca Digital
        </h1>

        <p className="text-gray-500 italic mb-12 text-sm sm:text-base max-w-sm mx-auto leading-relaxed">
          Instala la obra de José Enrique Pérez León en tu dispositivo para leer sin distracciones.
        </p>

        {/* BOTÓN DINÁMICO (SÓLO ANDROID/CHROME) */}
        {installPrompt && (
          <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <button
              onClick={handleInstall}
              className="w-full py-6 bg-black text-white rounded-full font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl hover:bg-amber-700 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <span className="text-lg">📥</span> Instalar Aplicación
            </button>
            <p className="mt-4 text-[10px] text-amber-600 font-bold uppercase tracking-widest">
              Disponible para tu dispositivo
            </p>
          </div>
        )}

        {/* INSTRUCCIONES MANUALES (IPHONE Y OTROS) */}
        <div className="bg-white rounded-[3rem] p-8 sm:p-12 shadow-2xl shadow-amber-900/5 border border-amber-50 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50/50 rounded-full -mr-16 -mt-16 blur-3xl" />
          
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-600 mb-8 flex items-center gap-2">
            <span className="w-4 h-px bg-amber-200" />
            Guía de instalación manual
          </h3>

          <div className="space-y-10 relative z-10">
            {/* PASO 1 */}
            <div className="flex gap-5 items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-gray-900 text-white rounded-2xl flex items-center justify-center font-bold text-sm shadow-lg">
                1
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 mb-1">Abrir Menú</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  En <strong>iPhone</strong> toca el icono <span className="text-lg">⎋</span> (Compartir). En <strong>Android</strong> toca los <span className="font-bold">⋮</span> (Ajustes).
                </p>
              </div>
            </div>

            {/* PASO 2 */}
            <div className="flex gap-5 items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-gray-900 text-white rounded-2xl flex items-center justify-center font-bold text-sm shadow-lg">
                2
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 mb-1">Agregar a Inicio</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Busca y selecciona la opción <br />
                  <strong className="text-amber-800">“Añadir a pantalla de inicio”</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-amber-50 flex items-center justify-between">
             <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-amber-100 border-2 border-white" />
                <div className="w-6 h-6 rounded-full bg-amber-200 border-2 border-white" />
                <div className="w-6 h-6 rounded-full bg-amber-300 border-2 border-white" />
             </div>
             <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest">
                Versión 2.0.26
             </p>
          </div>
        </div>

        <button 
          onClick={() => window.history.back()}
          className="mt-12 text-[10px] text-gray-400 uppercase tracking-[0.3em] hover:text-black transition-colors"
        >
          ← Volver atrás
        </button>
      </div>
    </main>
  );
}