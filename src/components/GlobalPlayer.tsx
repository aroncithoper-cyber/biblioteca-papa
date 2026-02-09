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
  
  // Referencia
  const playerRef = useRef<any>(null);
  
  // Estados
  const [isMounted, setIsMounted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [wasPlayingBeforeLearn, setWasPlayingBeforeLearn] = useState(false);

  // Protección de montaje
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // --- LÓGICA DE REANUDACIÓN INTELIGENTE ---
  useEffect(() => {
    if (pathname === "/aprender") {
      // Si entramos a aprender, guardamos si estaba sonando y pausamos
      if (isPlaying) {
        setWasPlayingBeforeLearn(true);
        togglePlay(); // Pausa
      }
    } else {
      // Si salimos de aprender y estaba sonando antes, intentamos reanudar
      if (wasPlayingBeforeLearn) {
        setWasPlayingBeforeLearn(false);
        // Pequeño delay para dejar que el componente se monte
        setTimeout(() => {
            if (!isPlaying) togglePlay();
        }, 500);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);


  // --- MEDIA SESSION (Optimizado: Solo se ejecuta al cambiar de canción) ---
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!isMounted || !currentVideo || pathname === "/aprender") return;

    if (typeof window !== "undefined" && "mediaSession" in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentVideo.title,
          artist: "Consejero del Obrero",
          album: "Biblioteca Digital",
          artwork: [{ src: "/icon-512.png", sizes: "512x512", type: "image/png" }],
        });

        navigator.mediaSession.setActionHandler("play", () => {
             if(!isPlaying) togglePlay();
        });
        navigator.mediaSession.setActionHandler("pause", () => {
             if(isPlaying) togglePlay();
        });
        
        // Handlers de tiempo usando referencia (sin reiniciar el efecto)
        navigator.mediaSession.setActionHandler("previoustrack", () => {
          playerRef.current?.seekTo(playerRef.current.getCurrentTime() - 10, 'seconds');
        });
        navigator.mediaSession.setActionHandler("nexttrack", () => {
          playerRef.current?.seekTo(playerRef.current.getCurrentTime() + 10, 'seconds');
        });

      } catch (e) { /* Ignorar */ }
    }
    // NOTA: Quitamos 'playedSeconds' de las dependencias para evitar el loop infinito
  }, [currentVideo, isMounted, pathname, isPlaying, togglePlay]);

  // --- PROGRESO ---
  const handleProgress = (state: any) => {
    setPlayedSeconds(state.playedSeconds);
    if (pathname !== "/aprender" && typeof navigator !== "undefined" && "mediaSession" in navigator && duration > 0) {
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
  
  // Ocultamos visualmente en "/aprender" en lugar de destruir el componente
  // Esto mantiene el video "listo" para sonar en cuanto salgas.
  const isHidden = pathname === "/aprender";

  return (
    <div 
      className={`fixed z-[100] bottom-4 right-4 w-[90%] md:w-80 rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-black transition-all duration-500 animate-in slide-in-from-bottom-5 ${
        isHidden ? "hidden pointer-events-none" : "block"
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
          playing={isPlaying && !isHidden} // Se pausa automáticamente si está oculto
          controls={true}
          
          onPlay={() => {
             if (!isPlaying && !isHidden) togglePlay();
          }}
          onPause={() => {
             if (isPlaying && !isHidden) togglePlay();
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