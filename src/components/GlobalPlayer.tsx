"use client";

import { usePlayer } from "@/lib/PlayerContext";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function GlobalPlayer() {
  const { currentVideo, closeVideo } = usePlayer();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);

  // Si no hay video, no mostramos nada
  if (!currentVideo) return null;

  // Si estamos en la página "Aprender", ocultamos el mini-player para no duplicar
  // (Opcional: puedes dejarlo si prefieres que siempre sea el mismo)
  const isLearningPage = pathname === "/aprender";

  return (
    <div 
      className={`fixed z-[100] transition-all duration-500 shadow-2xl border border-white/20 bg-black ${
        isLearningPage 
          ? "hidden" // Se oculta en la página de videos para que esa página maneje la vista completa si quieres, O lo dejamos visible.
          : "bottom-4 right-4 w-[90%] md:w-80 rounded-2xl overflow-hidden" // Modo Mini-Player
      }`}
    >
      {/* Barra de control superior del mini player */}
      {!isLearningPage && (
        <div className="bg-gray-900/90 backdrop-blur text-white p-2 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
          <span className="truncate flex-1 mr-4">{currentVideo.title}</span>
          <button onClick={closeVideo} className="p-1 hover:text-red-400">✕</button>
        </div>
      )}

      {/* El Video Real (Iframe) */}
      <div className={`relative ${isLearningPage ? "hidden" : "aspect-video"}`}>
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