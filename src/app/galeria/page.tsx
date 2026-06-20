"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "@/components/Header";

export default function GaleriaPage() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setPhotos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    })().catch(() => setLoading(false));
  }, []);

  return (
    <main
      className="ambient-page min-h-screen bg-[#fcfaf7] font-serif select-none relative overflow-x-hidden"
      onContextMenu={(e) => e.preventDefault()}
    >
      <Header />

      {/* TEXTURA DE FONDO */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0 mix-blend-multiply" 
           style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/stardust.png")` }}>
      </div>

      {/* LIGHTBOX (PANTALLA COMPLETA) */}
      {selectedPhoto && (
        <div 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-500"
            onClick={() => setSelectedPhoto(null)}
        >
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              aria-label="Cerrar"
              className="absolute top-4 right-4 sm:top-6 sm:right-6 min-w-[48px] min-h-[48px] w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors z-50"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div className="relative max-w-5xl w-full max-h-screen flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                {/* En pantalla completa SIEMPRE a color */}
                <img 
                    src={selectedPhoto.url} 
                    className="max-w-full max-h-[80vh] object-contain rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.5)] border-4 border-white/10" 
                    alt="Detalle"
                />
                {selectedPhoto.description && (
                    <p className="text-white/80 text-center mt-6 text-sm font-light italic tracking-wider max-w-xl animate-in slide-in-from-bottom-4">
                        "{selectedPhoto.description}"
                    </p>
                )}
            </div>
        </div>
      )}

      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16 sm:py-24">
        {/* Encabezado */}
        <div className="text-center mb-16 sm:mb-24 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-block border border-amber-200 rounded-full px-6 py-2 bg-white/50 backdrop-blur-sm">
             <span className="text-amber-800 font-black text-[10px] uppercase tracking-[0.4em]">
                Álbum Familiar
             </span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-8xl font-black text-gray-900 tracking-tighter leading-none">
            Galería de <br/><span className="text-transparent bg-clip-text bg-gradient-to-b from-amber-600 to-amber-900">Recuerdos</span>
          </h1>

          <p className="text-gray-500 italic text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
            Momentos compartidos en la obra y el ministerio de Jose Enrique Perez Leon.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-12 h-12 border-4 border-amber-100 border-t-amber-600 rounded-full animate-spin"></div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
              Revelando fotografías...
            </p>
          </div>
        ) : (
          /* MASONRY GRID */
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 space-y-8 px-2">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="card-enter group relative break-inside-avoid cursor-zoom-in"
                style={{ "--stagger": `${Math.min(index, 8) * 50}ms` } as React.CSSProperties}
              >
                {/* MARCO DE LA FOTO */}
                <div className="relative overflow-hidden rounded-2xl bg-gray-200 shadow-xl transition-all duration-700 group-hover:shadow-2xl group-hover:-translate-y-2">
                    
                    <img
                      src={photo.url}
                      alt={photo.description || "Foto"}
                      className="w-full h-auto object-cover transform transition-all duration-[1500ms] ease-out 
                                 filter grayscale contrast-[1.1] brightness-[0.9] 
                                 group-hover:grayscale-0 group-hover:contrast-100 group-hover:brightness-100 group-hover:scale-105"
                      loading="lazy"
                    />
                    
                    {/* SOMBRA INTERNA (Vignette) */}
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl z-20 pointer-events-none"></div>
                    
                    {/* CAPA DE DATOS — hover en desktop */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 md:group-hover:opacity-100 transition-opacity duration-500 hidden md:flex flex-col justify-end p-6">
                        {photo.description && (
                            <>
                                <div className="h-0.5 w-8 bg-amber-400 mb-2"></div>
                                <p className="text-white text-xs font-bold leading-relaxed drop-shadow-md">
                                    {photo.description}
                                </p>
                            </>
                        )}
                    </div>
                </div>
                {/* Descripción visible en móvil */}
                {photo.description && (
                  <p className="md:hidden mt-3 px-1 text-xs text-gray-600 leading-relaxed font-medium line-clamp-3">
                    {photo.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && photos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-amber-100 rounded-[3rem] bg-white/50">
            <span className="text-4xl mb-4 opacity-30">📸</span>
            <p className="text-gray-400 italic">
              El álbum está esperando su primera fotografía.
            </p>
          </div>
        )}
      </section>

      <footer className="py-20 text-center relative z-10">
        <img src="/icon-512.png" className="w-10 h-10 mx-auto mb-6 grayscale opacity-20" alt="Logo" />
        <p className="text-[9px] uppercase tracking-[0.3em] text-gray-400 font-bold">
          Archivo Histórico RV1909
        </p>
      </footer>
    </main>
  );
}