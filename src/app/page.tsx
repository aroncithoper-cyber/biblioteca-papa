"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <div className="min-h-screen bg-[#fcfaf7] font-serif selection:bg-amber-200 overflow-x-hidden">
      {/* BOTÓN FLOTANTE DE INSTALACIÓN (PWA) */}
      {installPrompt && (
        <div className="fixed bottom-8 left-0 right-0 z-[100] flex justify-center px-6 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <button
            onClick={handleInstallClick}
            className="group flex items-center gap-4 px-8 py-4 bg-amber-600 text-white rounded-full font-bold text-[10px] uppercase tracking-[0.3em] shadow-2xl border-2 border-white hover:bg-black transition-all active:scale-95"
          >
            <span className="text-lg">📥</span>
            <span>Instalar App Oficial</span>
          </button>
        </div>
      )}

      {/* Navegación Minimalista */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/80 backdrop-blur-md py-4 shadow-sm"
            : "bg-transparent py-8"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img
              src="/icon-512.png"
              className="w-8 h-8 rounded-full grayscale opacity-50"
              alt="Logo"
            />
            <span
              className={`text-[10px] font-bold tracking-[0.4em] uppercase ${
                scrolled ? "text-black" : "text-gray-400"
              }`}
            >
              Consejero
            </span>
          </div>
          <div className="flex gap-8 items-center">
            <Link
              href="/admin"
              className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-amber-600 transition-colors font-bold"
            >
              Panel
            </Link>
            <Link
              href="/biblioteca"
              className="bg-black text-white px-8 py-2.5 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-amber-700 transition-all shadow-xl shadow-black/10"
            >
              Entrar
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - El Impacto Inicial */}
      <header className="relative h-screen flex items-center justify-center">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="/icon-512.png"
            className="w-full h-full object-contain opacity-[0.02] scale-150 rotate-12"
            alt="background"
          />
        </div>

        <div className="relative z-20 text-center px-6 max-w-5xl animate-in fade-in zoom-in duration-1000">
          <img
            src="/icon-512.png"
            className="w-20 h-20 mx-auto mb-12 rounded-full shadow-2xl border border-amber-100 p-1 bg-white"
            alt="Logo Principal"
          />
          <h1 className="text-6xl md:text-9xl font-bold text-gray-900 tracking-tighter mb-8 leading-[0.85]">
            El Legado del <br />
            <span className="text-amber-600">Obrero</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 italic mb-14 leading-relaxed max-w-2xl mx-auto">
            "Instruye al niño en su camino, y aun cuando fuere viejo no se apartará
            de él."
          </p>
          <Link
            href="/biblioteca"
            className="group relative inline-flex items-center gap-4 px-14 py-6 bg-black text-white rounded-full font-bold text-xs uppercase tracking-[0.4em] overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(0,0,0,0.2)]"
          >
            <span className="relative z-10">Abrir Biblioteca</span>
            <span className="text-xl group-hover:translate-x-2 transition-transform duration-300">
              →
            </span>
          </Link>
        </div>
      </header>

      {/* Sección de Historia/Propósito */}
      <section className="max-w-6xl mx-auto px-6 py-40 border-t border-amber-100">
        <div className="grid md:grid-cols-2 gap-24 items-center">
          <div className="space-y-10">
            <span className="text-amber-600 font-bold text-[10px] uppercase tracking-[0.5em] block">
              Propósito y Visión
            </span>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 tracking-tight leading-[1.1]">
              Enseñanza fiel <br /> para la edificación.
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed italic">
              Esta plataforma es la casa digital del ministerio de Jose Enrique Perez
              Leon. Un espacio diseñado para que el obrero encuentre alimento espiritual
              de forma accesible, ordenada y profunda.
            </p>
            <div className="flex items-center gap-6">
              <div className="h-px w-12 bg-amber-500"></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Desde la Reina-Valera 1909
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[4/5] bg-neutral-900 rounded-[3rem] overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-all duration-700">
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
                <img
                  src="/icon-512.png"
                  className="w-16 h-16 mb-8 grayscale invert opacity-20"
                  alt=""
                />
                <p className="text-white/40 text-xs tracking-[0.3em] uppercase mb-4">
                  Colección Digital
                </p>
                <h3 className="text-white text-2xl font-bold italic tracking-tight">
                  "La verdad os hará libres"
                </h3>
              </div>
            </div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-100 rounded-full blur-3xl opacity-50 -z-10"></div>
          </div>
        </div>
      </section>

      {/* Footer Final - Con Link de Instalación */}
      <footer className="py-20 text-center bg-white/50 border-t border-amber-100">
        <p className="text-[10px] uppercase tracking-[0.8em] text-gray-300 font-bold mb-6">
          Jose Enrique Perez Leon
        </p>
        <div className="flex justify-center gap-8 mb-6">
          <Link
            href="/instalar"
            className="text-[9px] uppercase tracking-widest text-amber-600 font-bold hover:underline italic"
          >
            Instalar App
          </Link>
          <Link
            href="/biblioteca"
            className="text-[9px] uppercase tracking-widest text-gray-400 font-bold hover:underline italic"
          >
            Biblioteca
          </Link>
        </div>
        <p className="text-[11px] text-gray-300 italic tracking-widest">
          © 2026 — Consejero del Obrero
        </p>
      </footer>
    </div>
  );
}
