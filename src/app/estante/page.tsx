"use client";

import Header from "@/components/Header";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EstantePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<{ books: any[], videos: any[] }>({ books: [], videos: [] });
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/biblioteca"); // Si no hay usuario, va para afuera
        return;
      }
      setUser(currentUser);
      await fetchFavorites(currentUser.uid);
    });
    return () => unsubscribe();
  }, [router]);

  const fetchFavorites = async (uid: string) => {
    try {
      const q = query(collection(db, "user_favorites"), where("userId", "==", uid));
      const snap = await getDocs(q);
      
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Separamos por tipo
      const books = items.filter((i: any) => i.type === "book");
      const videos = items.filter((i: any) => i.type === "video");

      setFavorites({ books, videos });
    } catch (e) {
      console.error("Error cargando estante", e);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favId: string, type: "book" | "video") => {
    if(!confirm("¿Quitar de tu estante?")) return;
    
    // Optimistic UI (Lo borramos visualmente primero para que se sienta instantáneo)
    if(type === 'book') {
        setFavorites(prev => ({...prev, books: prev.books.filter(b => b.id !== favId)}));
    } else {
        setFavorites(prev => ({...prev, videos: prev.videos.filter(v => v.id !== favId)}));
    }

    try {
      await deleteDoc(doc(db, "user_favorites", favId));
    } catch (e) {
      alert("Hubo un error al borrar.");
      // Si falla, recargamos (aquí podrías revertir el estado)
      if(user) fetchFavorites(user.uid);
    }
  };

  return (
    <main className="ambient-page min-h-screen bg-[#fcfaf7] font-serif selection:bg-amber-200">
      <Header />

      <section className="max-w-7xl mx-auto px-6 py-12 sm:py-20">
        
        {/* ENCABEZADO PERSONALIZADO */}
        <div className="mb-16 animate-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter mb-4">
            Mi Estante
          </h1>
          <p className="text-gray-500 text-lg font-light flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Espacio personal de estudio de <span className="font-bold text-gray-800">{user?.email?.split('@')[0]}</span>
          </p>
        </div>

        {loading ? (
           <div className="space-y-8">
             <div className="h-64 bg-gray-100 rounded-[2.5rem] animate-pulse"></div>
             <div className="h-64 bg-gray-100 rounded-[2.5rem] animate-pulse"></div>
           </div>
        ) : (
          <div className="space-y-20">
            
            {/* --- SECCIÓN LIBROS --- */}
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-600 mb-8 flex items-center gap-4">
                Libros Guardados <span className="h-px flex-1 bg-amber-100"></span>
              </h2>

              {favorites.books.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {favorites.books.map((book: any, index: number) => (
                    <div
                      key={book.id}
                      className="card-enter group relative rounded-[2rem] border border-gray-100 bg-white p-4 transition-all duration-500 hover:border-amber-200 hover:shadow-xl"
                      style={{ "--stagger": `${Math.min(index, 6) * 45}ms` } as React.CSSProperties}
                    >
                      
                      {/* Botón Borrar (Flotante) */}
                      <button 
                        onClick={(e) => {e.preventDefault(); removeFavorite(book.id, 'book');}}
                        className="absolute top-2 right-2 z-20 min-w-[44px] min-h-[44px] w-11 h-11 bg-white/90 backdrop-blur rounded-full text-gray-500 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all shadow-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 translate-y-0 md:translate-y-2 md:group-hover:translate-y-0 duration-300"
                        title="Quitar del estante"
                        aria-label="Quitar del estante"
                      >
                        ✕
                      </button>

                      <Link href={`/documentos/${book.contentId}`} className="block">
                        <div className="aspect-[3/4] bg-gray-200 rounded-2xl overflow-hidden mb-4 shadow-inner relative">
                          {book.coverUrl ? (
                            <img src={book.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">📖</div>
                          )}
                        </div>
                        <h3 className="font-bold text-gray-900 leading-tight line-clamp-2 group-hover:text-amber-700 transition-colors">
                          {book.title}
                        </h3>
                        <p className="text-[9px] uppercase tracking-widest text-gray-400 mt-2">Continuar Lectura</p>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-[2rem] border border-dashed border-gray-200">
                  <p className="text-gray-400 italic text-sm">No tienes libros guardados aún.</p>
                  <Link href="/biblioteca" className="mt-4 inline-block text-[9px] font-bold uppercase tracking-widest text-amber-600 hover:underline">Ir a la Biblioteca</Link>
                </div>
              )}
            </div>

            {/* --- SECCIÓN VIDEOS --- */}
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-red-600 mb-8 flex items-center gap-4">
                Videos Favoritos <span className="h-px flex-1 bg-red-50"></span>
              </h2>

              {favorites.videos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {favorites.videos.map((vid: any, index: number) => (
                     <div
                       key={vid.id}
                       className="card-enter group relative rounded-[2rem] border border-gray-100 bg-white p-4 transition-all duration-500 hover:border-red-100 hover:shadow-xl"
                       style={{ "--stagger": `${Math.min(index, 6) * 45}ms` } as React.CSSProperties}
                     >
                        
                        {/* Botón Borrar */}
                        <button 
                          onClick={(e) => {e.preventDefault(); removeFavorite(vid.id, 'video');}}
                          className="absolute top-2 right-2 z-20 min-w-[44px] min-h-[44px] w-11 h-11 bg-white/90 backdrop-blur rounded-full text-gray-500 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all shadow-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 translate-y-0 md:translate-y-2 md:group-hover:translate-y-0 duration-300"
                          title="Quitar del estante"
                          aria-label="Quitar del estante"
                        >
                          ✕
                        </button>

                        <Link href="/aprender" className="block">
                          <div className="aspect-video bg-gray-800 rounded-xl overflow-hidden mb-4 relative shadow-md">
                             <img src={`https://img.youtube.com/vi/${vid.youtubeId}/mqdefault.jpg`} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" alt="" />
                             <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                   <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1"></div>
                                </div>
                             </div>
                          </div>
                          <h3 className="font-bold text-gray-900 leading-tight line-clamp-1 group-hover:text-red-700 transition-colors">
                            {vid.title}
                          </h3>
                          <p className="text-[9px] uppercase tracking-widest text-gray-400 mt-2">Ver Video</p>
                        </Link>
                     </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-[2rem] border border-dashed border-gray-200">
                  <p className="text-gray-400 italic text-sm">No tienes videos favoritos.</p>
                  <Link href="/aprender" className="mt-4 inline-block text-[9px] font-bold uppercase tracking-widest text-red-600 hover:underline">Ir a Aprender</Link>
                </div>
              )}
            </div>

          </div>
        )}
      </section>
    </main>
  );
}