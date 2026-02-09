"use client";

import { usePlayer } from "@/lib/PlayerContext";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function GlobalPlayer() {
  const { currentVideo, closeVideo } = usePlayer();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  // 1. Montaje seguro
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  // 2. Si no hay video seleccionado, no mostramos nada.
  if (!currentVideo) return null;

  // 3. CORRECCIÓN DOBLE VOZ (Tu lógica original):
  // Si estamos en "Aprender", apagamos este reproductor por completo para evitar eco.
  if (pathname === "/aprender") return null;

  return (
    <div className="fixed z-[100] bottom-4 right-4 w-[90%] md:w-80 rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-black transition-all duration-500 animate-in slide-in-from-bottom-5">
      
      {/* Barra de control Pro */}
      <div className="bg-gray-900/95 backdrop-blur text-white p-3 flex justify-between items-center border-b border-gray-800">
        <div className="flex flex-col overflow-hidden mr-4">
          <span className="text-[11px] font-bold text-amber-500 uppercase tracking-widest truncate">
            Reproduciendo ahora
          </span>
          <span className="text-xs font-medium truncate text-gray-200">
            {currentVideo.title}
          </span>
        </div>
        <button 
          onClick={closeVideo} 
          className="p-2 bg-gray-800 rounded-full hover:bg-red-900/50 text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* El Iframe Guerrero (Tu código original con esteroides) */}
      <div className="aspect-video relative bg-black">
        <iframe
          className="w-full h-full border-0"
          src={`https://www.youtube.com/embed/${currentVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1&start=0&playsinline=1`}
          title="Reproductor Global"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}