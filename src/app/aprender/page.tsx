"use client";

import Header from "@/components/Header";
import { useEffect, useState, useMemo } from "react";
import { 
  collection, 
  getDocs, 
  orderBy, 
  query, 
  where, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { usePlayer } from "@/lib/PlayerContext";

// Definimos nuestro tipo de video extendido
type VideoItem = {
  id: string;
  title: string;
  youtubeId: string;
  description?: string;
  category?: string; // Campo para filtrar carpetas
  createdAt?: any;
};

export default function AprenderPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  
  const { currentVideo, playVideo } = usePlayer();
  const [user, setUser] = useState<any>(null);
  const [savedVideoIds, setSavedVideoIds] = useState<string[]>([]);

  // 1. CARGAR USUARIO Y FAVORITOS
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const q = query(
            collection(db, "user_favorites"), 
            where("userId", "==", currentUser.uid),
            where("type", "==", "video")
          );
          const snap = await getDocs(q);
          const ids = snap.docs.map(d => d.data().contentId);
          setSavedVideoIds(ids);
        } catch (e) { console.error(e); }
      } else {
        setSavedVideoIds([]);
      }
    });
    return () => unsub();
  }, []);

  // 2. CARGAR VIDEOS
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const q = query(collection(db, "videos"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        const videosData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().title || "Sin título",
          youtubeId: doc.data().youtubeId || "",
          description: doc.data().description || "",
          category: doc.data().category || "General", 
          createdAt: doc.data().createdAt
        })) as VideoItem[];

        setVideos(videosData);

        // Si no hay nada sonando, ponemos el primero
        if (videosData.length > 0 && !currentVideo) {
          playVideo(videosData[0]);
        }
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };

    fetchVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- LÓGICA DE CARPETAS ---
  const categories = useMemo(() => {
    const cats = new Set(videos.map(v => v.category || "General"));
    return ["Todos", ...Array.from(cats).sort()];
  }, [videos]);

  const filteredVideos = videos.filter(v => 
    selectedCategory === "Todos" ? true : (v.category || "General") === selectedCategory
  );

  const toggleFavorite = async (video: any) => {
    if (!user) return alert("Inicia sesión para guardar videos.");
    const isSaved = savedVideoIds.includes(video.id);

    setSavedVideoIds(prev => isSaved ? prev.filter(id => id !== video.id) : [...prev, video.id]);

    try {
        if (isSaved) {
            const q = query(collection(db, "user_favorites"), where("userId", "==", user.uid), where("contentId", "==", video.id));
            const snap = await getDocs(q);
            snap.forEach(async (d) => await deleteDoc(doc(db, "user_favorites", d.id)));
        } else {
            await addDoc(collection(db, "user_favorites"), {
                userId: user.uid, contentId: video.id, type: "video", title: video.title, youtubeId: video.youtubeId, createdAt: serverTimestamp()
            });
        }
    } catch (e) {
        if (isSaved) setSavedVideoIds(prev => [...prev, video.id]);
        else setSavedVideoIds(prev => prev.filter(id => id !== video.id));
    }
  };

  return (
    <main className="min-h-screen bg-[#fcfaf7] font-serif selection:bg-amber-200">
      <Header />

      <section className="max-w-7xl mx-auto px-6 py-12 sm:py-20">
        
        {/* ENCABEZADO Y FILTROS */}
        <div className="text-center mb-10 space-y-6 animate-in fade-in zoom-in duration-1000">
          <div className="inline-block px-4 py-1.5 border border-amber-200 rounded-full bg-white shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-700">
              Enseñanza Bíblica
            </span>
          </div>
          <h1 className="text-4xl md:text-7xl font-black text-gray-900 tracking-tighter leading-none">
            Aprende más de <br className="hidden sm:block"/> la Palabra
          </h1>
          
          {/* AVISO "COMPAÑÍA EN EL CAMINO" (Diseño Místico) */}
          <div className="flex justify-center mb-6">
            <div className="relative group max-w-md cursor-default mx-auto">
                {/* Aura dorada suave de fondo */}
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-100 via-amber-200 to-amber-100 rounded-full blur-md opacity-30 group-hover:opacity-60 transition duration-1000 animate-pulse"></div>
                
                <div className="relative flex items-center gap-4 bg-white/90 backdrop-blur-xl px-6 py-4 rounded-full border border-amber-100 shadow-sm">
                  <div className="flex items-center justify-center w-10 h-10 bg-amber-50 rounded-full flex-shrink-0">
                      <span className="text-xl animate-pulse">🎧</span>
                  </div>
                  
                  <div className="flex flex-col items-start text-left">
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-700 leading-none mb-1">
                        Compañía en el camino
                      </p>
                      <p className="text-[11px] sm:text-[12px] text-gray-600 font-medium leading-tight">
                        Escucha el estudio en segundo plano mientras realizas tus labores o <span className="text-amber-900 font-bold">bloqueas tu celular</span>.
                      </p>
                  </div>
                </div>
            </div>
          </div>

          {/* FILTROS DE CATEGORÍA */}
          {categories.length > 1 && (
            <div className="flex justify-center overflow-x-auto pb-2 pt-4 no-scrollbar">
                <div className="flex gap-2 px-4 py-2 bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                                selectedCategory === cat 
                                ? "bg-red-600 text-white shadow-lg scale-105" 
                                : "bg-transparent text-gray-500 hover:bg-red-50 hover:text-red-700"
                            }`}
                        >
                            {cat === "Todos" ? "📺 Ver Todo" : cat}
                        </button>
                    ))}
                </div>
            </div>
          )}
        </div>

        {/* --- CONTENIDO --- */}
        <div className="grid lg:grid-cols-3 gap-10">
          
          {/* REPRODUCTOR PRINCIPAL */}
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <div className="aspect-video bg-gray-200 rounded-[2rem] animate-pulse w-full shadow-lg"></div>
            ) : currentVideo ? (
              <div className="group relative aspect-video rounded-[2rem] overflow-hidden shadow-2xl bg-black border-[6px] border-white ring-1 ring-gray-100 transition-all duration-500 hover:shadow-amber-200/40">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${currentVideo.youtubeId}?rel=0&modestbranding=1&showinfo=0&autoplay=1`}
                  title={currentVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <div className="aspect-video bg-gray-50 rounded-[2rem] border-4 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                <span className="text-4xl mb-2">📺</span>
                <p className="text-xs font-bold uppercase tracking-widest">Selecciona un video</p>
              </div>
            )}

            {!loading && currentVideo && (
              <div className="px-2 animate-in slide-in-from-bottom-2">
                <div className="flex justify-between items-start gap-4">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-4">
                    {currentVideo.title}
                    </h2>
                    
                    <button 
                        onClick={() => toggleFavorite(currentVideo)}
                        className={`group flex items-center justify-center w-12 h-12 rounded-full border transition-all shadow-sm hover:shadow-md active:scale-90 flex-shrink-0 ${
                            savedVideoIds.includes(currentVideo.id) 
                            ? "bg-red-50 border-red-200 text-red-500" 
                            : "bg-white border-gray-200 text-gray-400 hover:text-red-400 hover:border-red-100"
                        }`}
                        title={savedVideoIds.includes(currentVideo.id) ? "Quitar" : "Guardar"}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={savedVideoIds.includes(currentVideo.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="w-6 h-6 transition-transform group-hover:scale-110">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                        </svg>
                    </button>
                </div>

                <div className="flex gap-2 mb-4">
                    {/* SOLUCIÓN AL ERROR: Forzamos el tipo 'any' o 'VideoItem' para acceder a category */}
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded-full tracking-wider">
                        {(currentVideo as any).category || "General"}
                    </span>
                </div>
                <div className="w-12 h-1 bg-amber-500 rounded-full mb-4"></div>
                <p className="text-gray-600 text-base leading-relaxed font-light text-justify">
                  {currentVideo.description}
                </p>
              </div>
            )}
          </div>

          {/* LISTA DE REPRODUCCIÓN */}
          <div className="bg-white rounded-[2.5rem] p-6 border border-amber-50 shadow-xl h-fit lg:max-h-[700px] flex flex-col">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6 pb-4 border-b border-gray-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              {selectedCategory === "Todos" ? "Todos los Videos" : selectedCategory}
            </h3>

            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {loading ? (
                [1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse"></div>)
              ) : filteredVideos.length > 0 ? (
                filteredVideos.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => playVideo(video)}
                    className={`group w-full text-left p-3 rounded-2xl border transition-all duration-300 ${
                      currentVideo?.id === video.id
                        ? "bg-gray-900 border-gray-900 shadow-lg scale-[1.02]"
                        : "bg-white border-gray-100 hover:border-red-200 hover:bg-red-50"
                    }`}
                  >
                    <div className="flex gap-4 items-center">
                      <div className="relative w-24 aspect-video bg-gray-200 rounded-xl overflow-hidden flex-shrink-0">
                        <img
                          src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                          className={`w-full h-full object-cover ${currentVideo?.id === video.id ? 'opacity-70' : ''}`}
                          alt=""
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start">
                            <h4 className={`text-xs font-bold line-clamp-2 leading-tight mb-1 ${
                                currentVideo?.id === video.id ? "text-white" : "text-gray-900 group-hover:text-red-800"
                            }`}>
                            {video.title}
                            </h4>
                            {savedVideoIds.includes(video.id) && (
                                <span className="text-[10px] text-red-500 ml-2">❤️</span>
                            )}
                        </div>
                        <p className="text-[9px] uppercase tracking-wider font-bold text-gray-400">
                          {currentVideo?.id === video.id ? "Escuchando..." : (video.category || "Ver ahora")}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-center text-xs text-gray-300 py-20 italic">
                  No hay videos en esta categoría.
                </p>
              )}
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}