"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
// Importamos la guía de instalación
import InstallGuideModal from "@/components/InstallGuideModal";

export default function LandingPage() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showGuide, setShowGuide] = useState(false);

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
      
      {/* VENTANA DE AYUDA PARA INSTALAR */}
      <InstallGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />

      {/* BOTONES FLOTANTES DE INSTALACIÓN */}
      <div className="fixed bottom-6 z-[100] left-0 right-0 flex justify-center gap-3 px-4 animate-in slide-in-from-bottom-4 fade-in duration-1000 pointer-events-none">
        
        {/* Botón Android Automático */}
        {installPrompt && (
          <button 
            onClick={handleInstallClick} 
            className="flex items-center gap-2 px-5 py-3 bg-amber-600 text-white rounded-full font-bold text-[10px] uppercase tracking-[0.2em] shadow-2xl border-2 border-white hover:bg-black transition-all hover:scale-105 active:scale-95 pointer-events-auto"
          >
            <span className="text-base">📲</span>
            <span>Instalar App</span>
          </button>
        )}

        {/* Botón de Ayuda (Visible siempre para iPhone/Dudas) */}
        <button 
          onClick={() => setShowGuide(true)} 
          className="flex items-center gap-2 px-5 py-3 bg-white text-gray-800 rounded-full font-bold text-[10px] uppercase tracking-[0.2em] shadow-xl border border-gray-200 hover:bg-gray-50 transition-all hover:scale-105 active:scale-95 pointer-events-auto"
        >
          <span className="text-base">❓</span>
          <span>¿Cómo instalar?</span>
        </button>
      </div>

      {/* --- SECCIÓN HERO (PORTADA) --- */}
      <section className="relative pt-10 pb-32 px-6 overflow-hidden text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-100/40 rounded-full blur-3xl -z-10 opacity-60" />

        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in duration-1000">
          <div className="inline-block border border-amber-200/50 rounded-full px-4 py-1.5 bg-white/50 backdrop-blur shadow-sm mb-4">
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-amber-700">
              Biblioteca Oficial
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-gray-900 tracking-tighter leading-[0.9]">
            El Legado del <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-amber-600 to-amber-800">
              Obrero
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-500 italic font-medium max-w-2xl mx-auto leading-relaxed pt-4">
            "Instruye al niño en su camino, y aun cuando fuere viejo no se apartará de él."
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-10">
            <Link
              href="/biblioteca"
              className="w-full sm:w-auto px-10 py-4 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-[0.25em] hover:bg-amber-600 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
            >
              Explorar la Obra
            </Link>
            <Link
              href="/galeria"
              className="w-full sm:w-auto px-10 py-4 bg-white text-gray-900 border border-gray-200 rounded-full text-[10px] font-bold uppercase tracking-[0.25em] hover:bg-gray-50 transition-all hover:border-gray-400"
            >
              Ver Galería
            </Link>
          </div>
        </div>
      </section>

      {/* --- SECCIÓN BIOGRAFÍA --- */}
      <section className="py-24 bg-white border-t border-amber-50">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          
          {/* FOTO DEL AUTOR */}
          <div className="relative group mx-auto w-full max-w-md">
            <div className="absolute inset-0 bg-amber-100 rounded-[2.5rem] rotate-3 group-hover:rotate-6 transition-transform duration-700" />
            <div className="relative aspect-[3/4] bg-gray-100 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
              <img 
                src="/autor.png" 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000"
                alt="J. Enrique Pérez L."
                onError={(e) => {
                  e.currentTarget.src = "/icon-512.png"; 
                  e.currentTarget.classList.add("opacity-20", "p-20");
                }}
              />
            </div>
          </div>

          {/* TEXTO BIOGRÁFICO */}
          <div className="space-y-8 text-center md:text-left">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
              Un corazón dispuesto al <span className="text-amber-600 underline decoration-amber-200 decoration-4 underline-offset-4">servicio.</span>
            </h2>
            <div className="w-20 h-1 bg-amber-500 rounded-full mx-auto md:mx-0" />
            
            <p className="text-gray-600 leading-loose text-base md:text-lg">
              La obra de <strong>J. Enrique Pérez León</strong> no pretende ser un tratado académico, sino una ofrenda de gratitud. Es el fruto de años de caminar en la fe, de estudio silencioso y de oración constante por la iglesia.
            </p>
            
            <p className="text-gray-600 leading-loose text-base md:text-lg">
              Esta plataforma nace con el deseo sencillo de compartir lo que de gracia se ha recibido, esperando que estas líneas sirvan de aliento para los hermanos que trabajan en la viña del Señor.
            </p>
            
            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-100 mt-8">
              <div>
                <h3 className="text-4xl font-black text-amber-600">40+</h3>
                <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold mt-2">Años sirviendo</p>
              </div>
              <div>
                <h3 className="text-4xl font-black text-amber-600">∞</h3>
                <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold mt-2">Gratitud Eterna</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
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