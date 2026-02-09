"use client";

import { usePlayer } from "@/lib/PlayerContext";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// --- LA IMPORTACIÓN NUCLEAR ---
// 1. Cargamos dinámicamente para evitar errores de servidor.
// 2. Le ponemos "as any" al final. Esto obliga a TypeScript a aceptar CUALQUIER propiedad (url, width, etc.)
//    sin marcar error de compilación.
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any;

export default function GlobalPlayer() {
  // --- 1. HOOKS (Siempre arriba, sin interrupciones) ---
  const { currentVideo, closeVideo, isPlaying, togglePlay } = usePlayer();
  const pathname = usePathname();
  
  // Referencia 'any' para tener control total
  const playerRef = useRef<any>(null);
  
  // Estados
  const [isMounted, setIsMounted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [playedSeconds, setPlayedSeconds] = useState(0);

  // Protección de montaje
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // --- 2. MEDIA SESSION (Control de Bloqueo) ---
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    // Validamos condiciones dentro del hook, no antes
    if (!isMounted || !currentVideo || pathname === "/aprender") return;

    if (typeof window !== "undefined" && "mediaSession" in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentVideo.title,
          artist: "Consejero del Obrero",
          album: "Biblioteca Digital",
          artwork: [{ src: "/icon-512.png", sizes: "512x512", type: "image/png" }],
        });

        // Controles básicos
        navigator.mediaSession.setActionHandler("play", () => togglePlay());
        navigator.mediaSession.setActionHandler("pause", () => togglePlay());
        
        // CONTROLES DE ADELANTAR/ATRASAR
        navigator.mediaSession.setActionHandler("previoustrack", () => {
          // Retroceder 10s
          if (playerRef.current) {
             playerRef.current.seekTo(playedSeconds - 10, 'seconds');
          }
        });
        navigator.mediaSession.setActionHandler("nexttrack", () => {
          // Adelantar 10s
          if (playerRef.current) {
             playerRef.current.seekTo(playedSeconds + 10, 'seconds');
          }
        });

      } catch (e) { console.warn(e); }
    }
  }, [currentVideo, isPlaying, togglePlay, playedSeconds, isMounted, pathname]);

  // --- 3. PROGRESO ---
  const handleProgress = (state: any) => {
    setPlayedSeconds(state.playedSeconds);
    if (typeof navigator !== "undefined" && "mediaSession" in navigator && duration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: 1,
          position: state.playedSeconds,
        });
      } catch (error) { /* Ignorar */ }
    }
  };

  // --- 4. RENDERIZADO CONDICIONAL (AL FINAL) ---
  // Si ponemos esto antes de los hooks, React explota (Error #310).
  // Al ponerlo aquí, aseguramos que la lógica siempre corra antes de decidir si mostramos o no.
  if (!isMounted) return null;
  if (!currentVideo) return null;
  if (pathname === "/aprender") return null;

  return (
    <div className="fixed z-[100] bottom-4 right-4 w-[90%] md:w-80 rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-black transition-all duration-500 animate-in slide-in-from-bottom-5">
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

      {/* Reproductor Nuclear */}
      <div className="relative pt-[56.25%] bg-black">
        <ReactPlayer
          ref={playerRef}
          url={`https://www.youtube.com/watch?v=${currentVideo.youtubeId}`}
          width="100%"
          height="100%"
          className="absolute top-0 left-0"
          playing={isPlaying}
          controls={true}
          
          onPlay={() => {
             if (!isPlaying) togglePlay();
             if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
          }}
          onPause={() => {
             if (isPlaying) togglePlay();
             if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
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