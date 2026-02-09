"use client";

import { usePlayer } from "@/lib/PlayerContext";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// Carga dinámica segura
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any;

export default function GlobalPlayer() {
  const { currentVideo, closeVideo, isPlaying, togglePlay } = usePlayer();
  const pathname = usePathname();
  
  const playerRef = useRef<any>(null);
  const [duration, setDuration] = useState(0);
  const [playedSeconds, setPlayedSeconds] = useState(0);

  // Si no hay video, no renderizamos
  if (!currentVideo) return null;

  // Si estamos en "Aprender", ocultamos para evitar doble audio
  if (pathname === "/aprender") return null;

  // --- LÓGICA TIPO SPOTIFY (BLINDADA) ---
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    // Verificamos que window exista para evitar errores al cambiar de página
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentVideo.title,
        artist: "Consejero del Obrero",
        album: "Biblioteca Digital",
        artwork: [{ src: "/icon-512.png", sizes: "512x512", type: "image/png" }],
      });

      // HANDLERS SEGUROS: Verificamos que playerRef.current exista antes de actuar
      navigator.mediaSession.setActionHandler("play", () => {
        if (!isPlaying) togglePlay();
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        if (isPlaying) togglePlay();
      });
      navigator.mediaSession.setActionHandler("previoustrack", () => {
        if (playerRef.current) playerRef.current.seekTo(playedSeconds - 10);
      });
      navigator.mediaSession.setActionHandler("nexttrack", () => {
        if (playerRef.current) playerRef.current.seekTo(playedSeconds + 10);
      });
    } catch (e) {
      console.log("Error en MediaSession (ignorable):", e);
    }
  }, [currentVideo, isPlaying, togglePlay, playedSeconds]); // Quitamos playerRef de las dependencias

  // --- SINCRONIZACIÓN SEGURA ---
  const handleProgress = (state: any) => {
    setPlayedSeconds(state.playedSeconds);

    if (typeof navigator !== "undefined" && "mediaSession" in navigator && duration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: 1,
          position: state.playedSeconds,
        });
      } catch (error) {
        // Ignoramos errores de sincronización durante navegación
      }
    }
  };

  return (
    <div className="fixed z-[100] bottom-4 right-4 w-[90%] md:w-80 rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-black transition-all duration-500 animate-in slide-in-from-bottom-5">
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
          playing={isPlaying}
          controls={true}
          onPlay={() => {
            if (!isPlaying) togglePlay();
            if (typeof navigator !== "undefined" && "mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
          }}
          onPause={() => {
            if (isPlaying) togglePlay();
            if (typeof navigator !== "undefined" && "mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
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