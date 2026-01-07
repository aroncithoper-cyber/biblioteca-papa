"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";

export default function LandingPage() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <main className="min-h-screen bg-[#fcfaf7] font-serif selection:bg-amber-200">
      <Header />

      {installPrompt && (
        <div className="fixed bottom-6 z-[100] left-0 right-0 flex justify-center px-4">
          <button onClick={handleInstallClick} className="flex items-center gap-3 px-6 py-3 bg-amber-600 text-white rounded-full font-bold text-[10px] uppercase tracking-[0.2em] shadow-2xl border-2 border-white hover:bg-black transition-all">
            <span>📲 Instalar App</span>
          </button>
        </div>
      )}

      {/* HERO SECTION - ENCABEZADO */}
      <section className="relative pt-20 pb-32 px-6 text-center overflow-hidden">
        {/* Fondo decorativo sutil */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-amber-50/60 rounded-full blur-3xl -z-10" />
        
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <span className="inline-block py-1 px-3 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold tracking-[0.3em] uppercase mb-4">
            Biblioteca Digital
          </span>
          
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-gray-900 tracking-tighter leading-[0.9]">
            El Legado del <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-800">Obrero</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-500 italic max-w-2xl mx-auto leading-relaxed font-light">
            "Instruye al niño en su camino, y aun cuando fuere viejo no se apartará de él."
          </p>
          
          <div className="flex justify-center gap-4 pt-8">
            <Link href="/biblioteca" className="px-10 py-4 bg-gray-900 text-white rounded-full text-[10px] font-bold uppercase tracking-[0.25em] shadow-xl hover:bg-amber-700 hover:scale-105 transition-all duration-300">
              Abrir Biblioteca
            </Link>
          </div>
        </div>
      </section>

      {/* SECCIÓN DE BIENVENIDA (TEXTO CORREGIDO) */}
      <section className="py-24 bg-white border-t border-amber-50">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          
          {/* FOTO DEL AUTOR (Aquí va la nueva foto renombrada a autor.png) */}
          <div className="relative group">
            <div className="absolute inset-0 bg-amber-100 rounded-[2.5rem] rotate-3 group-hover:rotate-2 transition-transform duration-500" />
            <div className="relative aspect-[3/4] bg-gray-50 rounded-[2.5rem] overflow-hidden shadow-2xl border-[6px] border-white">
              <img 
                src="/autor.png" 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-105" 
                alt="J. Enrique Pérez L." 
                onError={(e) => { 
                  // Si no encuentra autor.png, pone el logo temporalmente
                  e.currentTarget.src = "/icon-512.png"; 
                  e.currentTarget.classList.add("opacity-20", "p-20");
                }} 
              />
            </div>
          </div>

          {/* TEXTO CÁLIDO Y HUMILDE */}
          <div className="space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Un corazón dispuesto al <span className="text-amber-600 underline decoration-amber-200 decoration-4 underline-offset-4">servicio.</span>
            </h2>
            
            <p className="text-gray-600 leading-loose text-lg text-justify font-light">
              La obra de <strong>J. Enrique Pérez León</strong> no pretende ser un tratado académico, sino una ofrenda de gratitud. Es el fruto de años de caminar en la fe, de estudio silencioso y de oración constante.
            </p>
            
            <p className="text-gray-600 leading-loose text-lg text-justify font-light">
              Esta plataforma nace con el deseo sencillo de compartir lo que de gracia se ha recibido, esperando que estas líneas sirvan de aliento y herramienta para los hermanos que, día a día, trabajan en la viña del Señor.
            </p>

            {/* ESTADÍSTICAS SENCILLAS */}
            <div className="grid grid-cols-2 gap-8 border-t border-gray-100 pt-8 mt-4">
              <div>
                <h3 className="text-4xl font-black text-amber-600">40+</h3>
                <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold mt-1">Años sirviendo</p>
              </div>
              <div>
                <h3 className="text-4xl font-black text-amber-600">∞</h3>
                <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold mt-1">Gratitud Eterna</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* FOOTER SENCILLO */}
      <footer className="bg-[#121212] text-white py-20 px-6 text-center border-t border-gray-800">
        <img src="/icon-512.png" className="w-10 h-10 mx-auto mb-8 opacity-30 grayscale invert" alt="Logo" />
        <p className="text-[9px] uppercase tracking-[0.4em] font-bold text-gray-500 mb-4">
          © 2026 Consejero Digital
        </p>
        <p className="text-[8px] text-gray-600 italic font-serif">
          Protección de Derechos Reservados
        </p>
      </footer>
    </main>
  );
}