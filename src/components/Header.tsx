"use client";

import Link from "next/link";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase"; // Agregamos db para las búsquedas
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query } from "firebase/firestore";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  
  // Estados para el Buscador Pro
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<{docs: any[], videos: any[]}>({docs: [], videos: []});
  const [searching, setSearching] = useState(false);

  // Tus correos de administrador
  const ADMIN_EMAILS = useMemo(
    () => ["aroncithoper@gmail.com", "e_perezleon@hotmail.com"],
    []
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // --- LÓGICA DE BÚSQUEDA INTELIGENTE ---
  useEffect(() => {
    // Solo busca si hay más de 2 letras para no saturar
    if (searchTerm.length < 2) {
      setSearchResults({docs: [], videos: []});
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearching(true);
      try {
        const term = searchTerm.toLowerCase();
        
        // 1. Traemos documentos y filtramos (Búsqueda "gratuita" en cliente para mayor potencia)
        const qDocs = query(collection(db, "documents"));
        const snapDocs = await getDocs(qDocs);
        const filteredDocs = snapDocs.docs
          .map(d => ({id: d.id, ...d.data()}))
          .filter((d: any) => d.title.toLowerCase().includes(term));

        // 2. Traemos videos y filtramos
        const qVids = query(collection(db, "videos"));
        const snapVids = await getDocs(qVids);
        const filteredVids = snapVids.docs
          .map(v => ({id: v.id, ...v.data()}))
          .filter((v: any) => v.title.toLowerCase().includes(term) || v.description?.toLowerCase().includes(term));

        setSearchResults({ docs: filteredDocs, videos: filteredVids });
      } catch (error) {
        console.error("Error en búsqueda", error);
      } finally {
        setSearching(false);
      }
    }, 400); // Espera 400ms después de que dejes de escribir

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const logout = async () => {
    try {
      await signOut(auth);
    } finally {
      router.push("/");
    }
  };

  const isAdmin = !!user && ADMIN_EMAILS.includes((user.email || "").toLowerCase());

  const handleSupport = () => {
    const message = encodeURIComponent("Hola, necesito ayuda con la plataforma Consejero del Obrero.");
    window.open(`https://wa.me/5215530270067?text=${message}`, "_blank"); 
  };

  return (
    <>
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-amber-100/50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          
          {/* LOGO */}
          <Link href="/" className="group flex items-center gap-4 active:scale-95 transition-transform">
            <div className="relative">
              <div className="absolute -inset-1 bg-amber-200 rounded-full blur opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
              <img
                src="/icon-512.png" 
                alt="Logo"
                className="relative w-10 h-10 rounded-full grayscale group-hover:grayscale-0 transition-all duration-500 border border-amber-100 p-0.5 bg-white object-cover shadow-sm"
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-black tracking-[0.3em] uppercase text-gray-900 leading-none mb-1">
                Consejero
              </span>
              <span className="text-[8px] uppercase tracking-[0.4em] text-amber-600/60 font-bold leading-none">
                Legacy Digital
              </span>
            </div>
          </Link>

          {/* NAVEGACIÓN */}
          <nav className="flex items-center gap-3 sm:gap-6">
            
            {/* ICONO DE LUPA (Buscador) */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-amber-600 transition-all"
              title="Buscar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </button>

            {/* BOTÓN SOPORTE */}
            <button
              onClick={handleSupport}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-green-600 border border-green-100 hover:bg-green-600 hover:text-white transition-all shadow-sm"
              title="Ayuda y Soporte"
            >
              <span className="text-sm font-bold">?</span>
            </button>

            {user ? (
              <>
                {isAdmin ? (
                  <Link
                    href="/admin"
                    className="hidden md:block text-[10px] font-bold tracking-[0.2em] uppercase text-amber-700 bg-amber-50 px-4 py-2 rounded-full border border-amber-100 shadow-sm hover:bg-amber-100 transition-colors"
                  >
                    Panel
                  </Link>
                ) : null}

                <Link href="/biblioteca" className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500 hover:text-black transition-colors">
                  Libros
                </Link>

                {/* --- BOTÓN MI ESTANTE (NUEVO) --- */}
                <Link 
                  href="/estante" 
                  className="hidden sm:block text-[10px] font-bold tracking-[0.2em] uppercase text-amber-700 hover:text-amber-900 transition-colors"
                >
                  Mi Estante
                </Link>

                <Link
                  href="/aprender"
                  className="relative text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 hover:text-amber-600 transition-colors flex items-center gap-1"
                >
                  Aprender
                  <span className="absolute -top-3 -right-3 sm:static sm:top-auto sm:right-auto bg-amber-100 text-amber-700 text-[6px] px-1.5 py-0.5 rounded-full border border-amber-200 animate-pulse">
                    NUEVO
                  </span>
                </Link>

                <Link href="/biografia" className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 hover:text-amber-600 transition-colors">
                  Autor
                </Link>

                <Link href="/galeria" className="hidden sm:block text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 hover:text-amber-600 transition-colors">
                  Galería
                </Link>

                <button
                  onClick={logout}
                  className="text-[10px] font-bold tracking-[0.2em] uppercase bg-black text-white px-5 py-2.5 rounded-full hover:bg-amber-700 transition-all shadow-lg active:scale-90"
                >
                  Salir
                </button>
              </>
            ) : (
              <Link
                href="/biblioteca"
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-900 bg-white border border-gray-200 px-6 py-2.5 rounded-full hover:bg-black hover:text-white hover:border-black transition-all shadow-sm"
              >
                Entrar
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* --- MODAL DE BÚSQUEDA PRO (GLASSMORPHISM) --- */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[200] bg-white/95 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="max-w-4xl mx-auto px-6 pt-20 h-full flex flex-col">
            
            {/* Header del Modal */}
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Buscador</h2>
              <button 
                onClick={() => {setIsSearchOpen(false); setSearchTerm("");}} 
                className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors text-xl font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Input Gigante */}
            <div className="relative mb-12">
              <input 
                autoFocus
                type="text"
                placeholder="Escribe 'Santidad', 'Doctrina'..."
                className="w-full bg-transparent border-b-[3px] border-gray-100 text-3xl md:text-5xl py-4 outline-none focus:border-amber-500 transition-colors font-serif placeholder:text-gray-200 text-gray-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searching && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2">
                   <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Resultados */}
            <div className="flex-1 overflow-y-auto pb-20 custom-scrollbar grid md:grid-cols-2 gap-12 content-start">
              
              {/* Columna Libros */}
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-6 flex items-center gap-2">
                  Libros Encontrados <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">{searchResults.docs.length}</span>
                </h3>
                <div className="space-y-3">
                  {searchResults.docs.map(d => (
                    <Link 
                      key={d.id} 
                      href={`/documentos/${d.id}`} 
                      onClick={() => setIsSearchOpen(false)} 
                      className="group flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:border-amber-300 hover:shadow-lg transition-all"
                    >
                      <div className="w-12 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                        {d.coverUrl ? (
                          <img src={d.coverUrl} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px]">📖</div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-amber-700 transition-colors line-clamp-1">{d.title}</p>
                        <p className="text-[9px] uppercase tracking-wider text-gray-400">Ir a lectura</p>
                      </div>
                    </Link>
                  ))}
                  {searchTerm.length > 2 && searchResults.docs.length === 0 && (
                    <p className="text-sm text-gray-300 italic">No se encontraron libros.</p>
                  )}
                </div>
              </div>

              {/* Columna Videos */}
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-6 flex items-center gap-2">
                  Videos de Estudio <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full">{searchResults.videos.length}</span>
                </h3>
                <div className="space-y-3">
                  {searchResults.videos.map(v => (
                    <Link 
                      key={v.id} 
                      href="/aprender" 
                      onClick={() => setIsSearchOpen(false)} 
                      className="group flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:border-red-300 hover:shadow-lg transition-all"
                    >
                      <div className="w-16 h-12 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden relative">
                         <img src={`https://img.youtube.com/vi/${v.youtubeId}/default.jpg`} className="w-full h-full object-cover" alt="" />
                         <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-transparent transition-all">
                            <span className="text-white text-xs">▶</span>
                         </div>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-red-700 transition-colors line-clamp-1">{v.title}</p>
                        <p className="text-[9px] text-gray-400 line-clamp-1">{v.description}</p>
                      </div>
                    </Link>
                  ))}
                  {searchTerm.length > 2 && searchResults.videos.length === 0 && (
                    <p className="text-sm text-gray-300 italic">No se encontraron videos.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}