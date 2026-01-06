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

export default function BibliotecaPage() {
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

  useEffect(() => {
    const results = docs.filter(doc =>
      doc.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDocs(results);
  }, [searchTerm, docs]);

  return (
    <main className="min-h-screen bg-[#fcfaf7] font-serif select-none overflow-x-hidden">
      <Header />

      {/* Hero Section - Refinado */}
      <section className="max-w-6xl mx-auto px-6 pt-32 pb-20 text-center animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="flex justify-center items-center gap-6 mb-10">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-200"></div>
          <img src="/icon.png" className="w-14 h-14 grayscale opacity-40 hover:opacity-100 transition-opacity duration-700" alt="Logo" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-200"></div>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-bold text-gray-900 mb-8 tracking-tighter leading-none">
          Sala de Estudio
        </h1>
        
        <p className="text-xl md:text-2xl text-amber-900/50 font-medium italic mb-12 max-w-2xl mx-auto leading-relaxed">
          Colección digital de la obra literaria y espiritual de Jose Enrique Perez Leon
        </p>

        <blockquote className="max-w-xl mx-auto border-l-2 border-amber-500/20 pl-10 py-4 text-left backdrop-blur-sm bg-white/5 rounded-r-2xl">
          <p className="text-xl text-gray-600 italic leading-relaxed">
            "Y conoceréis la verdad, y la verdad os hará libres."
          </p>
          <cite className="block mt-4 text-[11px] font-bold tracking-[0.5em] text-amber-600/80 not-italic uppercase">
            Juan 8:32 — RV1909
          </cite>
        </blockquote>
      </section>

      {/* Buscador Flotante Estilo Moderno */}
      <section className="max-w-6xl mx-auto px-6 py-12 sticky top-4 z-40 transition-all duration-500">
        <div className="relative max-w-xl mx-auto group">
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-100 to-amber-50 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative backdrop-blur-xl bg-white/60 p-2 rounded-full border border-white shadow-2xl">
            <input 
              type="text"
              placeholder="Buscar volumen, año o temática..."
              className="w-full pl-14 pr-8 py-5 bg-white rounded-full shadow-inner focus:ring-2 focus:ring-amber-200 outline-none transition-all font-sans text-sm tracking-wide"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute left-7 top-7 text-amber-400/60 text-xl">🔍</span>
          </div>
        </div>
      </section>

      {/* Galería de Volúmenes */}
      <section className="max-w-7xl mx-auto px-6 pb-40">
        <div className="flex items-center justify-between mb-20 border-b border-amber-100 pb-8">
          <div className="space-y-1">
            <h3 className="text-[12px] uppercase tracking-[0.6em] font-black text-gray-400">Archivo Histórico</h3>
            <p className="text-[10px] text-amber-600/60 font-bold uppercase tracking-widest italic">Acceso restringido a miembros</p>
          </div>
          <span className="text-[11px] font-black bg-black text-white px-6 py-2.5 rounded-full shadow-lg shadow-black/10">
            {loading ? "..." : `${filteredDocs.length} VOLÚMENES`}
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-48 gap-6">
            <div className="w-12 h-12 border-2 border-amber-100 border-t-amber-600 rounded-full animate-spin"></div>
            <p className="text-xs italic text-amber-900/30 tracking-[0.4em] uppercase font-bold">Iniciando sistema de lectura...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-32 gap-x-16">
            {filteredDocs.map((d, index) => (
              <div 
                key={d.id} 
                className="group flex flex-col items-center animate-in fade-in slide-in-from-bottom-6 duration-1000"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Visualización del Libro con Efecto Perspectiva */}
                <Link href={`/documento/${d.id}`} className="relative w-64 h-80 transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] transform group-hover:-translate-y-6 group-hover:rotate-3 group-hover:scale-105">
                  
                  {/* Sombra de Suelo Profunda */}
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[85%] h-10 bg-black/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                  
                  {/* Cinta de Edición */}
                  {index === 0 && searchTerm === "" && (
                    <div className="absolute -top-5 -right-5 z-30 bg-amber-600 text-white text-[9px] font-black px-5 py-2.5 rounded-full shadow-2xl tracking-[0.3em] border-2 border-white animate-bounce">
                      RECIENTE
                    </div>
                  )}

                  {/* Cuerpo del Libro Lujo */}
                  <div className="relative w-full h-full bg-[#121212] rounded-r-2xl shadow-[25px_25px_60px_-15px_rgba(0,0,0,0.5)] border-l-[12px] border-black overflow-hidden flex flex-col justify-between p-10 text-center ring-1 ring-white/5">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/60 opacity-50"></div>
                    
                    <div className="space-y-3 relative z-10">
                        <div className="w-10 h-0.5 bg-amber-500/50 mx-auto rounded-full"></div>
                        <span className="block text-[9px] tracking-[0.6em] text-amber-500/90 font-black uppercase">Edición</span>
                    </div>

                    <h4 className="text-white text-base font-bold leading-relaxed font-serif px-2 relative z-10 line-clamp-4 tracking-tight">
                      {d.title}
                    </h4>

                    <div className="relative pt-6 z-10">
                      <img src="/icon.png" className="w-6 h-6 mx-auto mb-5 grayscale opacity-30 group-hover:opacity-80 transition-all duration-700" alt="" />
                      <div className="w-10 h-px bg-white/10 mx-auto"></div>
                    </div>
                  </div>
                </Link>

                {/* Info y Acción */}
                <div className="mt-14 text-center w-full max-w-[280px] space-y-8">
                  <div className="space-y-2">
                    <h3 className="text-gray-900 font-black text-xl h-14 line-clamp-2 leading-tight tracking-tighter">
                      {d.title}
                    </h3>
                    <div className="w-8 h-0.5 bg-amber-100 mx-auto transition-all duration-500 group-hover:w-20 group-hover:bg-amber-500"></div>
                  </div>
                  
                  <Link
                    href={`/documento/${d.id}`}
                    className="inline-flex items-center justify-center w-full py-5 bg-black text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-full hover:bg-amber-600 transition-all duration-700 shadow-xl shadow-black/5 active:scale-95 group-hover:shadow-amber-600/20"
                  >
                    Abrir Volumen
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer Pro */}
      <footer className="bg-white/40 backdrop-blur-sm border-t border-amber-100 py-32">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <img src="/icon.png" className="w-14 h-14 mx-auto mb-10 grayscale opacity-20 hover:opacity-100 transition-all duration-1000" alt="" />
          <p className="text-[12px] uppercase tracking-[0.8em] text-gray-400 font-bold mb-8">
            Jose Enrique Perez Leon
          </p>
          <div className="h-px w-20 bg-amber-100 mx-auto mb-12"></div>
          <p className="text-[12px] text-gray-400 font-sans italic tracking-widest leading-relaxed">
            © {new Date().getFullYear()} — Consejero del Obrero<br/>
            <span className="text-[10px] not-italic opacity-50 mt-4 block">Protección de derechos RV1909</span>
          </p>
        </div>
      </footer>
    </main>
  );
}