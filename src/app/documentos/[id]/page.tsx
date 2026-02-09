"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import EbookViewerClient from "@/components/EbookViewerClient";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function DocumentoPage() {
  const params = useParams();
  const router = useRouter();
  // Manejo seguro del ID para Next.js 15/16
  const id = params?.id as string;

  const [bookData, setBookData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchBook = async () => {
      try {
        const docRef = doc(db, "documents", id);
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
          setBookData({ id: snap.id, ...snap.data() });
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error cargando libro:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  // Pantalla de Carga (Spinner elegante)
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfaf7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
           <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800 animate-pulse">Abriendo libro...</p>
        </div>
      </div>
    );
  }

  // Pantalla de Error (Si el libro no existe o no tiene permiso)
  if (error || !bookData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfaf7] text-center p-6 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <span className="text-3xl grayscale opacity-50">📚</span>
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Libro no disponible</h1>
        <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
          No pudimos cargar este documento. Puede que haya sido eliminado o que no tengas permisos para verlo.
        </p>
        <button 
          onClick={() => router.push('/biblioteca')}
          className="px-8 py-4 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-[0.25em] hover:bg-amber-600 transition-all shadow-xl hover:-translate-y-1"
        >
          Volver a la Biblioteca
        </button>
      </div>
    );
  }

  // Visor Súper Pro
  return (
    <main className="h-screen w-full bg-[#fcfaf7] overflow-hidden relative">
      {/* Botón flotante para salir */}
      <Link 
        href="/biblioteca" 
        className="fixed top-4 left-4 z-[50] w-10 h-10 bg-white/10 backdrop-blur-md border border-black/5 rounded-full flex items-center justify-center text-gray-600 hover:bg-white hover:text-red-500 transition-all shadow-sm group"
        title="Salir de la lectura"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </Link>

      {/* Cargamos el componente PRO que ya diseñamos */}
      <div className="w-full h-full flex items-center justify-center p-0 sm:p-4 md:p-6 bg-[#fcfaf7] dark:bg-[#1a1a1a] transition-colors duration-500">
        <EbookViewerClient 
          fileUrl={bookData.url || bookData.coverUrl} // Intenta url del PDF, o fallback
          documentId={bookData.id} 
        />
      </div>
    </main>
  );
}