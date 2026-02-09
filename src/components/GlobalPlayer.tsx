"use client";

import { usePlayer } from "@/lib/PlayerContext";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
// 1. Usamos la versión "Lazy" que es más ligera y compatible con Next.js
import ReactPlayer from "react-player/lazy";

export default function GlobalPlayer() {
  // --- HOOKS (Siempre primero) ---
  const { currentVideo, closeVideo, isPlaying, togglePlay } = usePlayer();
  const pathname = usePathname();
  
  // Referencia al reproductor (Vital para que funcione el adelantar/atrasar)
  const playerRef = useRef<any>(null);
  
  // Estados
  const [isMounted, setIsMounted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [playedSeconds, setPlayedSeconds] = useState(0);

  // 2. "Guardaespaldas" para evitar errores de hidratación (Pantalla roja)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // --- LÓGICA MEDIA SESSION (Control pantalla bloqueo) ---
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    // Solo ejecutamos si ya cargó la página y tenemos video
    if (!isMounted || !currentVideo || pathname === "/aprender") return;
    
    if (typeof window !== "undefined" && "mediaSession" in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentVideo.title,
          artist: "Consejero del Obrero",
          album: "Biblioteca Digital",
          artwork: [{ src: "/icon-512.png", sizes: "512x512", type: "image/png" }],
        });

        // Conectamos los cables de los botones
        navigator.mediaSession.setActionHandler("play", () => togglePlay());
        navigator.mediaSession.setActionHandler("pause", () => togglePlay());
        
        // AQUÍ ESTÁ EL ARREGLO DEL SEEK (Adelantar/Atrasar)
        navigator.mediaSession.setActionHandler("previoustrack", () => {
          if (playerRef.current) {
            const newTime = Math.max(playedSeconds - 10, 0); // Evita números negativos
            playerRef.current.seekTo(newTime, "seconds");
          }
        });
        navigator.mediaSession.setActionHandler("nexttrack", () => {
          if (playerRef.current) {
            const newTime = Math.min(playedSeconds + 10, duration); // No pasarse del final
            playerRef.current.seekTo(newTime, "seconds");
          }
        });
      } catch (e) {
        console.warn("MediaSession error:", e);
      }
    }
  }, [currentVideo, isPlaying, togglePlay, playedSeconds, duration, isMounted, pathname]);

  // --- SINCRONIZACIÓN BARRA DE PROGRESO ---
  const handleProgress = (state: any) => {
    setPlayedSeconds(state.playedSeconds);

    // Solo actualizamos el celular si la duración es válida (Evita que la barra salte al final)
    if (typeof navigator !== "undefined" && "mediaSession" in navigator && duration > 0 && isFinite(duration)) {
      try {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: 1,
          position: state.playedSeconds,
        });
      } catch (error) {
        // Silencioso
      }
    }
  };

  // 3. RENDERIZADO CONDICIONAL (Para evitar crashes)
  if (!isMounted) return null; // Esperamos a que el navegador esté listo
  if (!currentVideo) return null;
  if (pathname === "/aprender") return null;

  return (
    <div className="fixed z-[100] bottom-4 right-4 w-[90%] md:w-80 rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-black transition-all duration-500 animate-in slide-in-from-bottom-5">
      {/* Barra Superior Visual */}
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
          controls={true} // Controles nativos de YouTube (importante para móviles)
          
          // Eventos
          onPlay={() => {
             if (!isPlaying) togglePlay();
             if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
          }}
          onPause={() => {
             if (isPlaying) togglePlay();
             if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
          }}
          onEnded={() => {
             // Opcional: Cerrar o pasar al siguiente
          }}
          
          // Sincronización de datos
          onDuration={(d: number) => setDuration(d)}
          onProgress={handleProgress}
          
          // Configuración YouTube para móviles
          config={{
            youtube: {
              playerVars: { 
                playsinline: 1, // Evita que se ponga en pantalla completa automática
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