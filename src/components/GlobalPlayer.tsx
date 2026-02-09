"use client";

import { usePlayer } from "@/lib/PlayerContext";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
// Importamos la librería general para evitar errores de ruta en Vercel
import ReactPlayer from "react-player";

export default function GlobalPlayer() {
  const { currentVideo, closeVideo, isPlaying, togglePlay } = usePlayer();
  const pathname = usePathname();
  
  // CORRECCIÓN CLAVE: Usamos <any> para que TypeScript no se queje
  const playerRef = useRef<any>(null);

  // Estados para controlar el tiempo real
  const [duration, setDuration] = useState(0);
  const [playedSeconds, setPlayedSeconds] = useState(0);

  // 1. Si no hay video, no renderizamos nada
  if (!currentVideo) return null;

  // 2. Si estamos en "Aprender", ocultamos este player para evitar doble audio
  if (pathname === "/aprender") return null;

  // --- LÓGICA TIPO SPOTIFY (Media Session API) ---
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if ("mediaSession" in navigator && currentVideo) {
      // A. Ponemos los datos en la pantalla de bloqueo
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentVideo.title,
        artist: "Consejero del Obrero",
        album: "Biblioteca Digital",
        artwork: [
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      });

      // B. Escuchamos los botones de los audífonos/reloj
      navigator.mediaSession.setActionHandler("play", () => {
        if (!isPlaying) togglePlay();
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        if (isPlaying) togglePlay();
      });
      navigator.mediaSession.setActionHandler("previoustrack", () => {
        // Retroceder 10 seg
        playerRef.current?.seekTo(playedSeconds - 10);
      });
      navigator.mediaSession.setActionHandler("nexttrack", () => {
        // Adelantar 10 seg
        playerRef.current?.seekTo(playedSeconds + 10);
      });
    }
  }, [currentVideo, isPlaying, togglePlay, playedSeconds]);

  // --- SINCRONIZACIÓN DE TIEMPO (El secreto para que la barra no salte) ---
  const handleProgress = (state: { playedSeconds: number }) => {
    setPlayedSeconds(state.playedSeconds);

    if ("mediaSession" in navigator && duration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: 1,
          position: state.playedSeconds,
        });
      } catch (error) {
        // Ignoramos errores si el video no ha cargado bien
      }
    }
  };

  return (
    <div className="fixed z-[100] bottom-4 right-4 w-[90%] md:w-80 rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-black transition-all duration-500 animate-in slide-in-from-bottom-5">
      {/* Barra de control Visual */}
      <div className="bg-gray-900/95 backdrop-blur text-white p-3 flex justify-between items-center border-b border-gray-800">
        <div className="flex flex-col overflow-hidden mr-4">
          <span className="text-[11px] font-bold text-amber-500 uppercase tracking-widest truncate">
            Reproduciendo ahora
          </span>
          <span className="text-xs font-medium truncate text-gray-200">
            {currentVideo.title}
          </span>
        </div>
        <button 
          onClick={closeVideo} 
          className="p-2 bg-gray-800 rounded-full hover:bg-red-900/50 text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Reproductor Inteligente (Oculto pero funcional) */}
      <div className="relative pt-[56.25%] bg-black">
        <ReactPlayer
          ref={playerRef}
          url={`https://www.youtube.com/watch?v=${currentVideo.youtubeId}`}
          width="100%"
          height="100%"
          className="absolute top-0 left-0"
          playing={isPlaying}
          controls={true} // Ponemos controles nativos por si acaso
          
          // Eventos clave para Spotify-mode
          onPlay={() => {
            if (!isPlaying) togglePlay();
            if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
          }}
          onPause={() => {
            if (isPlaying) togglePlay();
            if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
          }}
          onDuration={(d) => setDuration(d)}
          onProgress={handleProgress}
          
          // Configuración para que suene en segundo plano (importante)
          config={{
            youtube: {
              playerVars: { 
                playsinline: 1,
                modestbranding: 1,
                origin: typeof window !== "undefined" ? window.location.origin : undefined
              }
            }
          }}
        />
      </div>
    </div>
  );
}