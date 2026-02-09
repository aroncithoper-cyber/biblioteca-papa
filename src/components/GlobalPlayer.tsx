"use client";

import { usePlayer } from "@/lib/PlayerContext";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// Importación dinámica "Nuclear"
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any;

export default function GlobalPlayer() {
  const { currentVideo, closeVideo, isPlaying, togglePlay } = usePlayer();
  const pathname = usePathname();
  const playerRef = useRef<any>(null);
  
  // Estados
  const [isMounted, setIsMounted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [wasPlayingBeforeLearn, setWasPlayingBeforeLearn] = useState(false);

  // Detectar si estamos en la página "Aprender"
  const isLearnPage = pathname === "/aprender";

  // Protección de montaje
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // --- LÓGICA DE REANUDACIÓN ---
  useEffect(() => {
    if (isLearnPage) {
      // Entrando a aprender: Si suena, guardamos estado y pausamos
      if (isPlaying) {
        setWasPlayingBeforeLearn(true);
        // Usamos un timeout para asegurar que no choque con otros eventos
        setTimeout(() => {
             if(isPlaying) togglePlay(); 
        }, 100);
      }
    } else {
      // Saliendo de aprender: Si estaba sonando, intentamos reanudar
      if (wasPlayingBeforeLearn) {
        setWasPlayingBeforeLearn(false);
        setTimeout(() => {
            // Intentamos reproducir, pero si falla, no pasa nada
            if (!isPlaying) togglePlay();
        }, 800); // Le damos casi 1 segundo para que la página cargue bien
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLearnPage]); // Dependemos solo de si es página de aprender o no

  // --- MEDIA SESSION ---
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

        navigator.mediaSession.setActionHandler("play", () => { if(!isPlaying) togglePlay(); });
        navigator.mediaSession.setActionHandler("pause", () => { if(isPlaying) togglePlay(); });
        
        navigator.mediaSession.setActionHandler("previoustrack", () => {
          playerRef.current?.seekTo(playerRef.current.getCurrentTime() - 10, 'seconds');
        });
        navigator.mediaSession.setActionHandler("nexttrack", () => {
          playerRef.current?.seekTo(playerRef.current.getCurrentTime() + 10, 'seconds');
        });

      } catch (e) { /* Ignorar */ }
    }
  }, [currentVideo, isPlaying, togglePlay, isMounted, isLearnPage]);

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

  if (!isMounted) return null;
  if (!currentVideo) return null;

  // Lógica CSS para ocultar
  const isHidden = isLearnPage;

  return (
    <div 
      className={`fixed z-[100] bottom-4 right-4 w-[90%] md:w-80 rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-black transition-all duration-500 animate-in slide-in-from-bottom-5 ${
        isHidden ? "hidden pointer-events-none" : "block"
      }`}
    >
      <div className="bg-gray-900/95 backdrop-blur text-white p-3 flex justify-between items-center border-b border-gray-800">
        <div className="flex flex-col overflow-hidden mr-4">
          <span className="text-[11px] font-bold text-amber-500 uppercase tracking-widest truncate">Reproduciendo ahora</span>
          <span className="text-xs font-medium truncate text-gray-200">{currentVideo.title}</span>
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
          playing={isPlaying && !isHidden} // Force pause si está oculto
          controls={true}
          
          onPlay={() => {
             // Solo actualizamos el estado si es una acción del usuario real
             if (!isHidden && !isPlaying) togglePlay();
          }}
          onPause={() => {
             // Solo actualizamos el estado si es una acción del usuario real
             if (!isHidden && isPlaying) togglePlay();
          }}
          
          onDuration={(d: number) => setDuration(d)}
          onProgress={handleProgress}
          
          config={{
            youtube: {
              playerVars: { playsinline: 1, modestbranding: 1, origin: typeof window !== "undefined" ? window.location.origin : undefined }
            } as any
          }}
        />
      </div>
    </div>
  );
}