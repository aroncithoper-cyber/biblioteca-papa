"use client";

import { usePlayer } from "@/lib/PlayerContext";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
// Usamos la importación estándar que es más estable
import ReactPlayer from "react-player";

export default function GlobalPlayer() {
  const { currentVideo, closeVideo, isPlaying, togglePlay } = usePlayer();
  const pathname = usePathname();
  
  // Referencia 'any' para control total
  const playerRef = useRef<any>(null);
  
  // Estados
  const [isMounted, setIsMounted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [playedSeconds, setPlayedSeconds] = useState(0);

  // Detectamos si estamos en la zona prohibida (Aprender)
  const isLearnPage = pathname === "/aprender";

  // Montaje seguro
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // --- LOGICA DE REANUDACIÓN AUTOMÁTICA ---
  // Cuando salimos de "Aprender", si el video estaba activo, intentamos darle play
  useEffect(() => {
    if (!isLearnPage && isMounted && currentVideo && isPlaying) {
      // Pequeño empujón para asegurar que arranque
      const timeout = setTimeout(() => {
         // Solo si sigue pausado visualmente
         if (playerRef.current?.getInternalPlayer()?.getPlayerState() !== 1) {
             // Forzamos actualización
         }
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [isLearnPage, isMounted, currentVideo, isPlaying]);


  // --- MEDIA SESSION (Controles Pantalla Bloqueo) ---
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    // Si estamos en Aprender, NO tocamos la media session para no interferir con el otro video
    if (!isMounted || !currentVideo || isLearnPage) return;

    if (typeof window !== "undefined" && "mediaSession" in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentVideo.title,
          artist: "Consejero del Obrero",
          album: "Biblioteca Digital",
          artwork: [{ src: "/icon-512.png", sizes: "512x512", type: "image/png" }],
        });

        navigator.mediaSession.setActionHandler("play", () => { if (!isPlaying) togglePlay(); });
        navigator.mediaSession.setActionHandler("pause", () => { if (isPlaying) togglePlay(); });
        
        navigator.mediaSession.setActionHandler("previoustrack", () => {
          playerRef.current?.seekTo(playedSeconds - 10, 'seconds');
        });
        navigator.mediaSession.setActionHandler("nexttrack", () => {
          playerRef.current?.seekTo(playedSeconds + 10, 'seconds');
        });

      } catch (e) { /* Ignorar */ }
    }
  }, [currentVideo, isPlaying, togglePlay, playedSeconds, isMounted, isLearnPage]);

  // --- PROGRESO ---
  const handleProgress = (state: any) => {
    setPlayedSeconds(state.playedSeconds);
    if (!isLearnPage && typeof navigator !== "undefined" && "mediaSession" in navigator && duration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: 1,
          position: state.playedSeconds,
        });
      } catch (error) { /* Ignorar */ }
    }
  };

  // --- RENDERIZADO (EL SECRETO) ---
  if (!isMounted) return null;
  // Si no hay video cargado, ahí sí lo desmontamos para no estorbar
  if (!currentVideo) return null;

  // Si estamos en "Aprender":
  // 1. NO desmontamos el componente (return null).
  // 2. Lo ocultamos con CSS (hidden).
  // 3. Forzamos la propiedad playing={false} para que se calle.
  
  const shouldBeVisible = !isLearnPage;
  const effectivePlaying = isLearnPage ? false : isPlaying;

  return (
    <div 
      className={`fixed z-[100] bottom-4 right-4 w-[90%] md:w-80 rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-black transition-all duration-500 animate-in slide-in-from-bottom-5 ${
        shouldBeVisible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-20 pointer-events-none h-0"
      }`}
    >
      {/* Barra Superior */}
      <div className="bg-gray-900/95 backdrop-blur text-white p-3 flex justify-between items-center border-b border-gray-800">
        <div className="flex flex-col overflow-hidden mr-4">
          <span className="text-[11px] font-bold text-amber-500 uppercase tracking-widest truncate">
            Reproduciendo ahora
          </span>
          <span className="text-xs font-medium truncate text-gray-200">
            {currentVideo.title}
          </span>
        </div>
        <button onClick={closeVideo} className="p-2 bg-gray-800 rounded-full hover:bg-red-900/50 text-gray-400 hover:text-white transition-colors">✕</button>
      </div>

      {/* Reproductor */}
      <div className="relative pt-[56.25%] bg-black">
        <ReactPlayer
          ref={playerRef}
          url={`https://www.youtube.com/watch?v=${currentVideo.youtubeId}`}
          width="100%"
          height="100%"
          className="absolute top-0 left-0"
          playing={effectivePlaying} // Aquí está la magia: se pausa solo, pero sigue cargado
          controls={true}
          
          onPlay={() => {
             // Si el usuario le da play manualmente y no estamos en aprender, actualizamos estado
             if (shouldBeVisible && !isPlaying) togglePlay();
          }}
          onPause={() => {
             if (shouldBeVisible && isPlaying) togglePlay();
          }}
          
          onDuration={(d: number) => setDuration(d)}
          onProgress={handleProgress}
          
          config={{
            youtube: {
              playerVars: { 
                playsinline: 1, 
                modestbranding: 1, 
                origin: typeof window !== "undefined" ? window.location.origin : undefined 
              }
            } as any
          }}
        />
      </div>
    </div>
  );
}