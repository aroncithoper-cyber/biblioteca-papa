"use client";

import { usePlayer } from "@/lib/PlayerContext";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// Importación dinámica "Nuclear" (Para pasar el build de Vercel)
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any;

export default function GlobalPlayer() {
  const { currentVideo, closeVideo, isPlaying, togglePlay } = usePlayer();
  const pathname = usePathname();
  
  // Referencia 'any' para control total
  const playerRef = useRef<any>(null);
  
  // Estados
  const [isMounted, setIsMounted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [playedSeconds, setPlayedSeconds] = useState(0);

  // Detectamos si estamos en la página "Aprender"
  const isLearnPage = pathname === "/aprender";

  // Montaje seguro
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // --- LOGICA DE REANUDACIÓN AUTOMÁTICA ---
  useEffect(() => {
    if (!isLearnPage && isMounted && currentVideo && isPlaying) {
      const timeout = setTimeout(() => {
         // Verificamos si el player interno está listo
         if (playerRef.current?.getInternalPlayer()) {
             // Forzamos actualización visual si es necesario
         }
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [isLearnPage, isMounted, currentVideo, isPlaying]);


  // --- MEDIA SESSION (Controles Pantalla Bloqueo) ---
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
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
        
        // CORRECCIÓN CLAVE: Usamos getCurrentTime() directo del player, no la variable de estado
        navigator.mediaSession.setActionHandler("previoustrack", () => {
          if (playerRef.current) {
            const actualTime = playerRef.current.getCurrentTime();
            playerRef.current.seekTo(Math.max(actualTime - 10, 0), 'seconds');
          }
        });
        navigator.mediaSession.setActionHandler("nexttrack", () => {
          if (playerRef.current) {
            const actualTime = playerRef.current.getCurrentTime();
            playerRef.current.seekTo(actualTime + 10, 'seconds');
          }
        });
        
        // Soporte para la barra deslizante del celular
        navigator.mediaSession.setActionHandler("seekto", (details) => {
            if (playerRef.current && details.seekTime) {
                playerRef.current.seekTo(details.seekTime, 'seconds');
            }
        });

      } catch (e) { /* Ignorar */ }
    }
  }, [currentVideo, isPlaying, togglePlay, isMounted, isLearnPage]); // Quitamos playedSeconds de aquí para evitar loops

  // --- PROGRESO (AQUÍ ESTABA EL ERROR DE LA BARRA LOCA) ---
  const handleProgress = (state: any) => {
    setPlayedSeconds(state.playedSeconds);
    
    // VALIDACIÓN ESTRICTA: Solo actualizamos el celular si la duración es un número real y mayor a 0
    // Esto evita que la barra salte al final cuando el video está cargando.
    if (
        !isLearnPage && 
        typeof navigator !== "undefined" && 
        "mediaSession" in navigator && 
        duration > 0 && 
        Number.isFinite(duration)
    ) {
      try {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: 1,
          position: state.playedSeconds,
        });
      } catch (error) { /* Ignorar */ }
    }
  };

  // --- RENDERIZADO ---
  if (!isMounted) return null;
  if (!currentVideo) return null;

  const shouldBeVisible = !isLearnPage;
  // Truco: Si estamos en Aprender, le decimos que NO reproduzca, pero NO desmontamos el componente
  const effectivePlaying = isLearnPage ? false : isPlaying;

  return (
    <div 
      className={`fixed z-[100] bottom-4 right-4 w-[90%] md:w-80 rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-black transition-all duration-500 animate-in slide-in-from-bottom-5 ${
        shouldBeVisible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-20 pointer-events-none h-0"
      }`}
    >
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

      <div className="relative pt-[56.25%] bg-black">
        <ReactPlayer
          ref={playerRef}
          url={`https://www.youtube.com/watch?v=${currentVideo.youtubeId}`}
          width="100%"
          height="100%"
          className="absolute top-0 left-0"
          playing={effectivePlaying} 
          controls={true}
          
          onPlay={() => {
             if (shouldBeVisible && !isPlaying) togglePlay();
          }}
          onPause={() => {
             if (shouldBeVisible && isPlaying) togglePlay();
          }}
          
          // Actualizamos la duración solo si es válida
          onDuration={(d: number) => {
              if (Number.isFinite(d) && d > 0) setDuration(d);
          }}
          
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