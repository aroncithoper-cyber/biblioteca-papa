"use client";

import Header from "@/components/Header";
import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AprenderPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 1. CARGAR VIDEOS DESDE LA BASE DE DATOS (FIREBASE)
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const q = query(collection(db, "videos"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const videosData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setVideos(videosData);
        // Si hay videos, seleccionamos el primero automáticamente para que se vea luego luego
        if (videosData.length > 0) {
          setSelectedVideo(videosData[0]);
        }
      } catch (error) {
        console.error("Error cargando videos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  return (
    <main className="min-h-screen bg-[#fcfaf7] font-serif selection:bg-amber-200">
      <Header />

      <section className="max-w-7xl mx-auto px-6 py-12 sm:py-20">
        
        {/* ENCABEZADO ELEGANTE */}
        <div className="text-center mb-16 space-y-6 animate-in fade-in zoom-in duration-1000">
          <div className="inline-block px-4 py-1.5 border border-amber-200 rounded-full bg-white shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-700">
              Enseñanza Bíblica
            </span>
          </div>
          <h1 className="text-4xl md:text-7xl font-black text-gray-900 tracking-tighter leading-none">
            Aprende más de <br className="hidden sm:block"/> la Palabra
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm md:text-lg font-light italic">
            "Escudriñad las Escrituras... ellas son las que dan testimonio de mí."
          </p>
        </div>

        {/* --- CONTENIDO --- */}
        <div className="grid lg:grid-cols-3 gap-10">
          
          {/* COLUMNA IZQUIERDA: REPRODUCTOR PRINCIPAL */}
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              // SKELETON LOADING (Se ve profesional mientras carga)
              <div className="aspect-video bg-gray-200 rounded-[2rem] animate-pulse w-full shadow-lg"></div>
            ) : selectedVideo ? (
              // REPRODUCTOR PRO
              <div className="group relative aspect-video rounded-[2rem] overflow-hidden shadow-2xl bg-black border-[6px] border-white ring-1 ring-gray-100 transition-all duration-500 hover:shadow-amber-100/50">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?rel=0&modestbranding=1&showinfo=0&autoplay=1`}
                  title={selectedVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              // ESTADO VACÍO (Si no has subido videos aún)
              <div className="aspect-video bg-gray-50 rounded-[2rem] border-4 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                <span className="text-4xl mb-2">📺</span>
                <p className="text-xs font-bold uppercase tracking-widest">No hay videos disponibles</p>
              </div>
            )}

            {/* INFO DEL VIDEO SELECCIONADO */}
            {!loading && selectedVideo && (
              <div className="px-2 animate-in slide-in-from-bottom-2">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                  {selectedVideo.title}
                </h2>
                <div className="w-12 h-1 bg-amber-500 rounded-full my-4"></div>
                <p className="text-gray-600 mt-3 text-base leading-relaxed pl-2 border-l-2 border-amber-100">
                  {selectedVideo.description}
                </p>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA: LISTA DE REPRODUCCIÓN */}
          <div className="bg-white rounded-[2.5rem] p-6 border border-amber-50 shadow-xl h-fit lg:max-h-[600px] flex flex-col">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6 pb-4 border-b border-gray-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Biblioteca de Videos
            </h3>

            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {loading ? (
                // Skeleton para la lista
                [1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse"></div>
                ))
              ) : videos.length > 0 ? (
                videos.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => setSelectedVideo(video)}
                    className={`group w-full text-left p-3 rounded-2xl border transition-all duration-300 ${
                      selectedVideo?.id === video.id
                        ? "bg-gray-900 border-gray-900 shadow-lg scale-[1.02]"
                        : "bg-white border-gray-100 hover:border-amber-200 hover:bg-amber-50"
                    }`}
                  >
                    <div className="flex gap-4 items-center">
                      {/* Miniatura */}
                      <div className="relative w-24 aspect-video bg-gray-200 rounded-xl overflow-hidden flex-shrink-0 shadow-sm group-hover:shadow-md transition-all">
                        <img
                          src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                          className={`w-full h-full object-cover transition-opacity ${selectedVideo?.id === video.id ? 'opacity-80' : 'opacity-100'}`}
                          alt=""
                        />
                        {/* Icono Play sobre miniatura */}
                        {selectedVideo?.id === video.id && (
                           <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-6 h-6 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                                 <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[8px] border-l-white border-b-[4px] border-b-transparent ml-0.5"></div>
                              </div>
                           </div>
                        )}
                      </div>
                      
                      {/* Textos */}
                      <div className="min-w-0">
                        <h4 className={`text-xs font-bold line-clamp-2 leading-tight mb-1 ${
                            selectedVideo?.id === video.id ? "text-white" : "text-gray-900 group-hover:text-amber-800"
                        }`}>
                          {video.title}
                        </h4>
                        <p className={`text-[9px] uppercase tracking-wider font-medium ${
                            selectedVideo?.id === video.id ? "text-gray-400" : "text-gray-400"
                        }`}>
                          {selectedVideo?.id === video.id ? "Reproduciendo..." : "Ver ahora"}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-center text-xs text-gray-400 py-10 italic">
                  Pronto se añadirán nuevos estudios.
                </p>
              )}
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}