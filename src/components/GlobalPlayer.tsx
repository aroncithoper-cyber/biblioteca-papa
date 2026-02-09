"use client";

import { usePlayer } from "@/lib/PlayerContext";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
// 1. VOLVEMOS A LA IMPORTACIÓN QUE SÍ FUNCIONA EN VERCEL
import ReactPlayer from "react-player";

export default function GlobalPlayer() {
  // --- HOOKS (Siempre van al principio, sin ifs antes) ---
  const { currentVideo, closeVideo, isPlaying, togglePlay } = usePlayer();
  const pathname = usePathname();
  
  // Usamos <any> para que TypeScript no moleste y nos deje usar .seekTo()
  const playerRef = useRef<any>(null);
  
  // Estados
  const [isMounted, setIsMounted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [playedSeconds, setPlayedSeconds] = useState(0);

  // 2. PROTECCIÓN DE MONTAJE (Evita pantalla roja al cambiar de página)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 3. LOGICA MEDIA SESSION (Para controlar desde bloqueo)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    // Si no está montado o no hay video, no hacemos nada (pero el hook existe)
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
        
        // AQUÍ ESTÁ EL SECRETO PARA ADELANTAR/ATRASAR
        navigator.mediaSession.setActionHandler("previoustrack", () => {
          if (playerRef.current) {
            // Retroceder 10 segundos
            playerRef.current.seekTo(playedSeconds - 10, 'seconds');
          }
        });
        navigator.mediaSession.setActionHandler("nexttrack", () => {
          if (playerRef.current) {
            // Adelantar 10 segundos
            playerRef.current.seekTo(playedSeconds + 10, 'seconds');
          }
        });
      } catch (e) {
        // Ignoramos errores de media session
      }
    }
  }, [currentVideo, isPlaying, togglePlay, playedSeconds, isMounted, pathname]);

  // 4. SINCRONIZACIÓN BARRA DE PROGRESO
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

  // 5. RENDERIZADO CONDICIONAL (Al final, para no romper hooks)
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

      {/* Reproductor */}
      <div className="relative pt-[56.25%] bg-black">
        <ReactPlayer
          ref={playerRef}
          url={`https://www.youtube.com/watch?v=${currentVideo.youtubeId}`}
          width="100%"
          height="100%"
          className="absolute top-0 left-0"
          playing={isPlaying}
          controls={true} // Controles nativos activados para móvil
          
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