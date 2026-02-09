"use client";

import { usePlayer } from "@/lib/PlayerContext";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// Importación dinámica para que no cargue en el servidor (evita error de hidratación)
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any;

export default function GlobalPlayer() {
  const { currentVideo, closeVideo, isPlaying, togglePlay } = usePlayer();
  const pathname = usePathname();
  
  const playerRef = useRef<any>(null);
  const [duration, setDuration] = useState(0);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  
  // ESTADO DE SEGURIDAD: Solo mostramos el player si el navegador está listo
  const [isReady, setIsReady] = useState(false);

  // 1. Efecto de Montaje Seguro (Evita que cargue durante la navegación)
  useEffect(() => {
    setIsReady(true);
    // Limpieza al desmontar
    return () => setIsReady(false);
  }, []);

  // 2. Reglas de visualización
  // Si no está listo el navegador, o no hay video, o estamos en "Aprender", NO RENDERIZAMOS NADA.
  if (!isReady || !currentVideo) return null;
  if (pathname === "/aprender") return null;

  // --- LÓGICA MEDIA SESSION (Control desde pantalla de bloqueo) ---
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    // Verificamos obsesivamente que todo exista antes de tocar nada
    if (typeof window === "undefined" || !navigator || !("mediaSession" in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentVideo.title,
        artist: "Consejero del Obrero",
        album: "Biblioteca Digital",
        artwork: [{ src: "/icon-512.png", sizes: "512x512", type: "image/png" }],
      });

      // Handlers seguros
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
      // Si falla la media session, no rompemos la app, solo lo ignoramos
      console.warn("MediaSession warning:", e);
    }

    // LIMPIEZA IMPORTANTE: Quitamos los controles al salir para que no choquen
    return () => {
      if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
        try {
          navigator.mediaSession.setActionHandler("play", null);
          navigator.mediaSession.setActionHandler("pause", null);
          navigator.mediaSession.setActionHandler("previoustrack", null);
          navigator.mediaSession.setActionHandler("nexttrack", null);
        } catch (e) { /* Ignorar */ }
      }
    };
  }, [currentVideo, isPlaying, togglePlay, playedSeconds]);

  // --- MANEJADORES DE EVENTOS SEGUROS ---
  const handleProgress = (state: any) => {
    setPlayedSeconds(state.playedSeconds);
    // Actualizamos la barra de bloqueo solo si es seguro
    if (typeof navigator !== "undefined" && "mediaSession" in navigator && duration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: 1,
          position: state.playedSeconds,
        });
      } catch (e) { /* Ignorar errores de sync */ }
    }
  };

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
          controls={true}
          // Eventos con chequeo de seguridad
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
          // Configuración YouTube con 'as any' para evitar líos de TypeScript
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