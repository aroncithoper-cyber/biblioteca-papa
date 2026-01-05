"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "@/components/Header";
import Link from "next/link";

type DocItem = {
  id: string;
  title: string;
  createdAt?: any;
};

export default function HomePage() {
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    (async () => {
      const q = query(collection(db, "documents"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const fetchedDocs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setDocs(fetchedDocs);
      setFilteredDocs(fetchedDocs);
      setLoading(false);
    })().catch(() => setLoading(false));
  }, []);

  // Lógica del buscador en tiempo real
  useEffect(() => {
    const results = docs.filter(doc =>
      doc.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDocs(results);
  }, [searchTerm, docs]);

  return (
    <main className="min-h-screen bg-[#FDFDFD] font-serif select-none">
      <Header />

      {/* Hero Section - Estilo Editorial */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-16 text-center border-b border-gray-100">
        <div className="inline-block px-4 py-1 border border-gray-200 rounded-full mb-8">
          <span className="text-[10px] font-bold tracking-[0.3em] text-gray-400 uppercase">Obra Literaria y Espiritual</span>
        </div>
        
        <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 tracking-tighter">
          Consejero del Obrero
        </h1>
        
        <p className="text-2xl text-gray-500 font-medium italic mb-10">
          por Jose Enrique Perez Leon
        </p>

        <div className="flex items-center justify-center gap-4 mb-12 text-gray-300">
          <div className="h-[1px] w-12 bg-gray-200"></div>
          <span className="text-[10px] uppercase tracking-[0.4em]">Establecidos en la Verdad</span>
          <div className="h-[1px] w-12 bg-gray-200"></div>
        </div>

        <blockquote className="max-w-2xl mx-auto relative">
          <p className="text-xl text-gray-700 leading-relaxed italic">
            "Y conoceréis la verdad, y la verdad os hará libres."
          </p>
          <cite className="block mt-6 text-[11px] font-bold tracking-[0.3em] text-amber-600 not-italic">
            JUAN 8:32 — REINA-VALERA 1909
          </cite>
        </blockquote>
      </section>

      {/* Barra de Búsqueda Discreta */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="relative max-w-md mx-auto">
          <input 
            type="text"
            placeholder="Buscar por año o trimestre..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-full shadow-sm focus:ring-2 focus:ring-black outline-none transition-all font-sans text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-5 top-3 text-gray-400">🔍</span>
        </div>
      </section>

      {/* Colección de Libros */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="flex items-center justify-between mb-16 border-b border-gray-100 pb-4">
          <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400 font-sans">Publicaciones Recientes</h3>
          <span className="text-[10px] font-mono bg-gray-50 px-3 py-1 rounded-full text-gray-400 border">
            {loading ? "..." : `${filteredDocs.length} Volúmenes`}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-pulse text-gray-400 italic">Consultando biblioteca espiritual...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
            {filteredDocs.map((d, index) => (
              <div key={d.id} className="group relative flex flex-col items-center">
                
                {/* Estantería / Libro con Profundidad */}
                <div className="relative w-48 h-64 transition-all duration-500 group-hover:-translate-y-3 group-hover:rotate-1">
                  {/* Sombra de suelo */}
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[90%] h-6 bg-black/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  {/* Etiqueta de Nueva Edición (Solo al primero si no hay búsqueda) */}
                  {index === 0 && searchTerm === "" && (
                    <div className="absolute -top-3 -right-3 z-20 bg-amber-600 text-white text-[9px] font-bold px-3 py-1.5 rounded-full shadow-xl border border-white animate-bounce">
                      EDICIÓN ACTUAL
                    </div>
                  )}

                  {/* Cuerpo del Libro */}
                  <div className="relative w-full h-full bg-[#1A1A1A] rounded-r-lg shadow-2xl border-l-[8px] border-black overflow-hidden flex flex-col justify-between p-6 text-center">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-white/10 pointer-events-none"></div>
                    
                    <span className="text-[8px] tracking-[0.4em] text-amber-500/80 font-bold uppercase">Volumen</span>
                    <h4 className="text-white text-xs font-bold leading-tight font-serif px-2 line-clamp-4">
                      {d.title}
                    </h4>
                    <div className="flex flex-col gap-1">
                      <div className="w-6 h-[1px] bg-amber-500/30 mx-auto"></div>
                      <span className="text-[7px] text-gray-500 tracking-[0.3em] uppercase italic">Formativo</span>
                    </div>
                  </div>
                </div>

                {/* Título y Botón */}
                <div className="mt-10 text-center w-full max-w-[220px]">
                  <h3 className="text-gray-900 font-bold text-base mb-5 h-12 line-clamp-2 leading-tight">
                    {d.title}
                  </h3>
                  <Link
                    href={`/documentos/${d.id}`}
                    className="inline-block w-full py-3 bg-white border border-gray-900 text-gray-900 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all duration-300"
                  >
                    Iniciar Estudio
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredDocs.length === 0 && (
          <div className="text-center py-20 text-gray-400 italic border border-dashed rounded-3xl">
            No se encontraron volúmenes que coincidan con la búsqueda.
          </div>
        )}
      </section>

      {/* Footer Minimalista */}
      <footer className="bg-white border-t py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.5em] text-gray-300 font-sans mb-4">
            Jose Enrique Perez Leon
          </p>
          <div className="h-px w-8 bg-gray-100 mx-auto mb-4"></div>
          <p className="text-[11px] text-gray-400 font-sans italic">
            © {new Date().getFullYear()} — Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </main>
  );
}