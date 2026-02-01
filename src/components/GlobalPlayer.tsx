"use client";

import { usePlayer } from "@/lib/PlayerContext";
import { usePathname } from "next/navigation";

export default function GlobalPlayer() {
  const { currentVideo, closeVideo } = usePlayer();
  const pathname = usePathname();

  // 1. Si no hay video seleccionado, no mostramos nada.
  if (!currentVideo) return null;

  // 2. CORRECCIÓN DOBLE VOZ:
  // Si estamos en la página "Aprender", APAGAMOS este reproductor por completo.
  // Así solo suena el de la página principal y evitamos el eco.
  if (pathname === "/aprender") return null;

  return (
    <div className="fixed z-[100] bottom-4 right-4 w-[90%] md:w-80 rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-black transition-all duration-500 animate-in slide-in-from-bottom-5">
      {/* Barra de control */}
      <div className="bg-gray-900/90 backdrop-blur text-white p-2 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
        <span className="truncate flex-1 mr-4">{currentVideo.title}</span>
        <button onClick={closeVideo} className="p-1 hover:text-red-400">✕</button>
      </div>

      {/* Video */}
      <div className="aspect-video relative">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${currentVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1&start=0`}
          title="Reproductor Global"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        ></iframe>
      </div>
    </div>
  );
}