"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "@/components/Header";

export default function GaleriaPage() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      className="min-h-screen bg-[#fcfaf7] font-serif select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <Header />

      <section className="max-w-7xl mx-auto px-6 py-16 sm:py-24">
        {/* Encabezado */}
        <div className="text-center mb-16 sm:mb-24 space-y-4 animate-in">
          <span className="text-amber-600 font-bold text-[10px] uppercase tracking-[0.6em]">
            Álbum Familiar
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-8xl font-bold text-gray-900 tracking-tighter">
            Galería de Recuerdos
          </h1>

          <div className="w-16 h-px bg-amber-200 mx-auto"></div>

          <p className="text-gray-400 italic text-sm max-w-lg mx-auto pt-4">
            Momentos compartidos en la obra y el ministerio de Jose Enrique Perez
            Leon.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-10 h-10 border-2 border-amber-100 border-t-amber-600 rounded-full animate-spin"></div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
              Abriendo el álbum...
            </p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 sm:gap-8 space-y-6 sm:space-y-8">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="relative group overflow-hidden rounded-[2.5rem] bg-white border border-white shadow-xl transition-all duration-700 hover:shadow-2xl animate-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Imagen */}
                <img
                  src={photo.url}
                  alt={photo.description}
                  className="w-full h-auto object-cover grayscale hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100"
                  onDragStart={(e) => e.preventDefault()}
                />

                {/* Pie de foto */}
                {photo.description && (
                  <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                    <p className="text-white text-xs font-medium italic leading-relaxed tracking-wide">
                      {photo.description}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && photos.length === 0 && (
          <div className="text-center py-32 border-2 border-dashed border-amber-100 rounded-[3rem]">
            <p className="text-gray-300 italic">
              El álbum de recuerdos está esperando su primera fotografía.
            </p>
          </div>
        )}
      </section>

      <footer className="py-16 sm:py-20 text-center opacity-30">
        <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">
          Contenido protegido — Prohibida su reproducción parcial o total
        </p>
      </footer>
    </main>
  );
}
