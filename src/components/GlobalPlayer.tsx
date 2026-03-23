"use client";

import { usePlayer } from "@/lib/PlayerContext";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export default function GlobalPlayer() {
  const { currentVideo, closeVideo, isPlaying, togglePlay } = usePlayer();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const dummyAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // --- CEREBRO "SPOTIFY PRO" ---
  useEffect(() => {
    if (!isMounted || !currentVideo || pathname === "/aprender") return;

    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentVideo.title,
        artist: "Consejero del Obrero",
        // AQUÍ ESTÁ LA SOLUCIÓN AL ERROR EN ROJO:
        album: (currentVideo as any).category || "Enseñanza",
        artwork: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      });

      navigator.mediaSession.setActionHandler("play", () => togglePlay());
      navigator.mediaSession.setActionHandler("pause", () => togglePlay());
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    }

    // TRUCO PARA IOS
    if (isPlaying && dummyAudioRef.current) {
        dummyAudioRef.current.play().catch(e => console.log("Auto-play dummy audio prevented", e));
    } else if (!isPlaying && dummyAudioRef.current) {
        dummyAudioRef.current.pause();
    }

  }, [currentVideo, isPlaying, isMounted, pathname, togglePlay]);

  if (!isMounted || !currentVideo || pathname === "/aprender") return null;

  return (
    <div className="fixed z-[100] bottom-4 right-4 w-[90%] md:w-80 rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-black transition-all duration-500 animate-in slide-in-from-bottom-5">
      
      <audio ref={dummyAudioRef} loop src="data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA" />

      {/* Barra de título Pro */}
      <div className="bg-gray-900/95 backdrop-blur text-white p-3 flex justify-between items-center border-b border-gray-800">
        <div className="flex flex-col overflow-hidden mr-4">
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest truncate">
            {isPlaying ? "Reproduciendo" : "En pausa"}
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

      <div className="aspect-video relative bg-black">
        <iframe
          className={`w-full h-full border-0 ${isPlaying ? "opacity-100" : "opacity-50"}`}
          src={`https://www.youtube.com/embed/${currentVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1&start=0&playsinline=1${!isPlaying ? '&enablejsapi=1' : ''}`}
          title="Reproductor Global"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}