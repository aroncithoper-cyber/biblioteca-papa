"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Link from "next/link";
import InstallGuideModal from "@/components/InstallGuideModal";

export default function BiografiaPage() {
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
      alert("Avisos activados correctamente.");
    }
  };

  return (
    <main className="min-h-screen bg-[#fcfaf7] font-serif selection:bg-amber-200 pb-20">
      <Header />

      <InstallGuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
      />

      {/* BOTONES FLOTANTES */}
      <div className="fixed bottom-6 z-[100] left-0 right-0 flex justify-center gap-3 px-4 pointer-events-none">
        {installPrompt && (
          <button
            onClick={handleInstallClick}
            className="pointer-events-auto px-5 py-3 bg-amber-600 text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg hover:bg-black transition-all"
          >
            Instalar App
          </button>
        )}

        <button
          onClick={handleEnableNotifications}
          className="pointer-events-auto px-5 py-3 bg-white border border-gray-200 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all"
        >
          Avisos
        </button>

        <button
          onClick={() => setShowGuide(true)}
          className="pointer-events-auto px-5 py-3 bg-white border border-gray-200 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gray-100 transition-all"
        >
          Ayuda
        </button>
      </div>

      {/* HERO */}
      <section className="relative h-[60vh] flex items-end justify-center overflow-hidden bg-gray-900">
        <div className="absolute inset-0">
          <img
            src="/papa-predicando.png"
            alt="J. Enrique Pérez predicando"
            className="w-full h-full object-cover object-top opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#fcfaf7] via-transparent to-black/40" />
        </div>

        <div className="relative z-10 text-center px-6 pb-16">
          <p className="text-xs uppercase tracking-[0.4em] bg-white/90 px-4 py-1 rounded-full font-bold text-amber-700 inline-block mb-4">
            El autor
          </p>
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight">
            J. Enrique Pérez León
          </h1>
          <div className="h-1 w-20 bg-amber-600 mx-auto mt-6 rounded-full"></div>
        </div>
      </section>

      {/* CONTENIDO */}
      <section className="max-w-6xl mx-auto px-6 -mt-10 relative z-20">
        <div className="bg-white rounded-[3rem] shadow-xl p-8 md:p-16 border border-amber-50">

          <div className="space-y-10">

            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Una vida dedicada al servicio
              </h2>

              <p className="text-gray-600 leading-loose text-lg text-justify">
                La trayectoria de <strong>J. Enrique Pérez León</strong> comenzó
                en los primeros años de su juventud, participando activamente en
                la preparación ministerial y en el acompañamiento pastoral en
                distintas localidades.
              </p>

              <p className="text-gray-600 leading-loose text-lg text-justify mt-4">
                Con el paso del tiempo recibió las responsabilidades
                ministeriales correspondientes, dedicando más de cuatro décadas
                al servicio continuo dentro de la iglesia.
              </p>
            </div>

            {/* CITA */}
            <div className="border-l-4 border-amber-500 pl-6 italic text-xl text-gray-800 font-serif">
              “Escribir es una manera de dejar apoyo para quienes vienen
              después; que la doctrina permanezca firme y sea continuada por las
              futuras generaciones.”
            </div>

            <div>
              <h3 className="text-xl font-bold uppercase tracking-widest text-gray-900 mb-4">
                La labor escrita
              </h3>

              <p className="text-gray-600 leading-loose text-lg text-justify">
                Los estudios y materiales aquí compartidos surgen del deseo de
                facilitar la enseñanza y preservar apuntes doctrinales que han
                servido en distintos momentos del ministerio.
              </p>

              <p className="text-gray-600 leading-loose text-lg text-justify mt-4">
                No se trata de una publicación oficial, sino de un archivo
                personal destinado a la edificación fraternal.
              </p>
            </div>

            {/* SECCIÓN APOYO VOLUNTARIO */}
            <div className="mt-12 bg-gray-50 rounded-3xl p-8 border border-gray-100 text-center">
              <h4 className="text-lg font-bold text-gray-900 mb-3">
                Apoyo voluntario
              </h4>
              <p className="text-gray-600 text-sm max-w-xl mx-auto leading-relaxed">
                Si alguno desea apoyar esta labor escrita de manera voluntaria,
                puede hacerlo como muestra de aprecio y respaldo al trabajo
                realizado.
              </p>

              {/* AQUÍ luego podemos poner botón PayPal o información bancaria */}
              <div className="mt-6">
                <button className="px-6 py-2 border border-amber-600 text-amber-700 rounded-full text-xs uppercase tracking-widest hover:bg-amber-600 hover:text-white transition-all">
                  Información de apoyo
                </button>
              </div>
            </div>

          </div>
        </div>

        <div className="py-12 text-center">
          <Link
            href="/biblioteca"
            className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-amber-600 transition-colors"
          >
            ← Volver a la Biblioteca
          </Link>
        </div>
      </section>
    </main>
  );
}