"use client";

import { usePlayer } from "@/lib/PlayerContext";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// Importación dinámica para pasar el build
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any;

export default function GlobalPlayer() {
  const { currentVideo, closeVideo, isPlaying, togglePlay } = usePlayer();
  const pathname = usePathname();
  const playerRef = useRef<any>(null);
  
  const [isMounted, setIsMounted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [playedSeconds, setPlayedSeconds] = useState(0);

  const isLearnPage = pathname === "/aprender";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // --- MEDIA SESSION ---
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
        
        navigator.mediaSession.setActionHandler("previoustrack", () => {
          if (playerRef.current) {
             const currentTime = playerRef.current.getCurrentTime();
             playerRef.current.seekTo(Math.max(currentTime - 10, 0), 'seconds');
          }
        });
        navigator.mediaSession.setActionHandler("nexttrack", () => {
          if (playerRef.current) {
             const currentTime = playerRef.current.getCurrentTime();
             playerRef.current.seekTo(currentTime + 10, 'seconds');
          }
        });
      } catch (e) { /* Ignorar */ }
    }

    return () => {
        if (typeof window !== "undefined" && "mediaSession" in navigator) {
            try {
                const ms = navigator.mediaSession;
                ms.setActionHandler("play", null);
                ms.setActionHandler("pause", null);
                ms.setActionHandler("previoustrack", null);
                ms.setActionHandler("nexttrack", null);
            } catch (e) {}
        }
    };
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

  if (!isMounted || !currentVideo) return null;

  // --- TRUCO MAESTRO DE VISIBILIDAD ---
  // En lugar de "hidden", usamos estilos que mantienen el iframe vivo pero invisible
  const containerStyle: React.CSSProperties = isLearnPage ? {
    position: 'fixed',
    left: '-9999px', // Lo mandamos lejísimos de la pantalla
    top: '-9999px',
    visibility: 'hidden',
    opacity: 0,
    pointerEvents: 'none'
  } : {
    position: 'fixed',
    bottom: '1rem',
    right: '1rem',
    visibility: 'visible',
    opacity: 1,
    zIndex: 100,
  };

  return (
    <div 
      style={containerStyle}
      className="w-[90%] md:w-80 rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-black transition-opacity duration-500"
    >
      {/* Barra Superior */}
      <div className="bg-gray-900/95 backdrop-blur text-white p-3 flex justify-between items-center border-b border-gray-800">
        <div className="flex flex-col overflow-hidden mr-4">
          <span className="text-[11px] font-bold text-amber-500 uppercase tracking-widest truncate">Reproduciendo ahora</span>
          <span className="text-xs font-medium truncate text-gray-200">{currentVideo.title}</span>
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
          playing={isLearnPage ? false : isPlaying} // Pausamos solo si estamos en Aprender
          controls={true}
          onPlay={() => { if (!isLearnPage && !isPlaying) togglePlay(); }}
          onPause={() => { if (!isLearnPage && isPlaying) togglePlay(); }}
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