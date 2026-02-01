"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type Video = {
  id: string;
  title: string;
  youtubeId: string;
  description?: string;
};

type PlayerContextType = {
  currentVideo: Video | null;
  isPlaying: boolean;
  playVideo: (video: Video) => void;
  closeVideo: () => void;
  togglePlay: () => void;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playVideo = (video: Video) => {
    setCurrentVideo(video);
    setIsPlaying(true);
  };

  const closeVideo = () => {
    setCurrentVideo(null);
    setIsPlaying(false);
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  return (
    <PlayerContext.Provider value={{ currentVideo, isPlaying, playVideo, closeVideo, togglePlay }}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer debe usarse dentro de PlayerProvider");
  return context;
};