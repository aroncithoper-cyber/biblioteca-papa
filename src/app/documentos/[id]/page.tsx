"use client";

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import FlipbookViewer from "@/components/FlipbookViewer";

export default function DocumentoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [pdfProxyUrl, setPdfProxyUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, "documents", id));
      if (!snap.exists()) {
        router.push("/");
        return;
      }

      const data = snap.data() as any;
      setTitle(data.title || "Volumen de Estudio");

      const storagePath = data.storagePath;
      if (!storagePath) {
        console.error("Falta storagePath en Firestore");
        router.push("/");
        return;
      }

      setPdfProxyUrl(`/api/pdf?path=${encodeURIComponent(storagePath)}`);
      setLoading(false);
    })().catch(console.error);
  }, [id, router]);

  return (
    <main className="min-h-screen bg-[#F5F5F5] font-serif">
      <Header />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Navegación Superior Discreta */}
        <div className="flex items-center justify-between mb-8">
          <button
            className="group flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-colors"
            onClick={() => router.push("/")}
          >
            <span className="text-lg group-hover:-translate-x-1 transition-transform">←</span> 
            Volver a la Biblioteca
          </button>
          
          <div className="hidden sm:block h-px flex-1 mx-8 bg-gray-200"></div>
          
          <span className="text-[10px] uppercase tracking-[0.2em] text-amber-600 font-bold">
            Lectura Protegida
          </span>
        </div>

        {/* Título de la Obra */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 tracking-tight">
            {loading ? "Cargando volumen..." : title}
          </h1>
          <div className="w-12 h-0.5 bg-gray-900 mx-auto"></div>
        </div>

        {/* Espacio del Lector (Flipbook) */}
        <div className="relative transition-all duration-700 ease-in-out">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[600px] bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-12 h-12 border-2 border-gray-200 border-t-black rounded-full animate-spin mb-4"></div>
              <p className="text-sm italic text-gray-400">Abriendo ejemplar...</p>
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in duration-1000">
              <FlipbookViewer fileUrl={pdfProxyUrl} />
            </div>
          )}
        </div>

        {/* Nota de Pie de Página */}
        <div className="mt-12 text-center pb-10">
          <p className="text-[9px] uppercase tracking-[0.4em] text-gray-300">
            Consejero del Obrero — Edificación Cristiana
          </p>
        </div>
      </section>
    </main>
  );
}