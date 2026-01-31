"use client";

import Header from "@/components/Header";
import { useState } from "react";

// Aquí irás agregando tus videos manualmente o desde una base de datos después
const VIDEOS = [
  {
    id: "1",
    titulo: "La Importancia de la Doctrina",
    youtubeId: "dQw4w9WgXcQ", // El código que sale después del v= en YouTube
    descripcion: "Un estudio profundo sobre los fundamentos de nuestra fe."
  },
  {
    id: "2",
    titulo: "Historia de la Iglesia de Dios",
    youtubeId: "videoID2",
    descripcion: "Recorrido histórico y legado de nuestros antecesores."
  }
];

export default function AprenderPage() {
  const [selectedVideo, setSelectedVideo] = useState(VIDEOS[0]);

  return (
    <main className="min-h-screen bg-[#fcfaf7] font-serif">
      <Header />

      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16 space-y-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-amber-600">Senda del Saber</span>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter">Formación Ministerial</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          
          {/* REPRODUCTOR PRINCIPAL (2 columnas) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="relative aspect-video rounded-[2rem] overflow-hidden shadow-2xl bg-black border-4 border-white">
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?rel=0&modestbranding=1&showinfo=0`}
                title={selectedVideo.titulo}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="px-4">
              <h2 className="text-2xl font-bold text-gray-900">{selectedVideo.titulo}</h2>
              <p className="text-gray-500 mt-2">{selectedVideo.descripcion}</p>
            </div>
          </div>

          {/* LISTA DE VIDEOS (1 columna) */}
          <div className="space-y-6 h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b pb-4">Temas Disponibles</h3>
            {VIDEOS.map((video) => (
              <button
                key={video.id}
                onClick={() => setSelectedVideo(video)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  selectedVideo.id === video.id 
                    ? "bg-amber-50 border-amber-200 shadow-md scale-[1.02]" 
                    : "bg-white border-transparent hover:border-gray-200"
                }`}
              >
                <div className="flex gap-4 items-center">
                  <div className="w-20 aspect-video bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`} 
                      className="w-full h-full object-cover"
                      alt="" 
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 line-clamp-2 leading-tight">{video.titulo}</h4>
                    <p className="text-[9px] text-gray-400 mt-1 uppercase tracking-tighter">Reproducir ahora</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

        </div>
      </section>
    </main>
  );
}