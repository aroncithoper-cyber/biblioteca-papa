"use client";
import { useEffect, useState } from "react";
import Header from "@/components/Header";

export default function InstalarPage() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    });
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstallPrompt(null);
  };

  return (
    <main className="min-h-screen bg-[#fcfaf7] font-serif">
      <Header />
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <img src="/icon.png" className="w-24 h-24 mx-auto mb-8 rounded-[2rem] shadow-2xl border border-amber-100 p-2 bg-white" alt="Logo" />
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tighter">Aplicación Oficial</h1>
        <p className="text-gray-500 italic mb-12">Lleva la biblioteca de Jose Enrique Perez Leon siempre contigo.</p>

        {/* SI ES ANDROID/CHROME APARECE ESTE BOTÓN */}
        {installPrompt ? (
          <button 
            onClick={handleInstall}
            className="w-full py-6 bg-amber-600 text-white rounded-full font-bold text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-black transition-all animate-pulse"
          >
            📥 Instalar Ahora
          </button>
        ) : (
          /* SI ES IPHONE O YA ESTÁ INSTALADA APARECEN INSTRUCCIONES */
          <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-amber-50 text-left">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-6">Instrucciones de instalación</h3>
            
            <div className="space-y-8">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">1</div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Busca el botón de <strong>Compartir</strong> en la barra de tu navegador (el icono del cuadradito con la flecha hacia arriba).
                </p>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">2</div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Desliza hacia abajo y selecciona la opción <br/> <strong>"Añadir a la pantalla de inicio"</strong>.
                </p>
              </div>
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