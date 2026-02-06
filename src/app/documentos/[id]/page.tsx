"use client";

import dynamic from "next/dynamic";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";

const EbookViewer = dynamic(() => import("@/components/EbookViewer"), {
  ssr: false,
});

export default function DocumentoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [title, setTitle] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!id) return;
        const snap = await getDoc(doc(db, "documents", id));
        if (!snap.exists()) {
          router.push("/biblioteca");
          return;
        }
        const data = snap.data();
        if (!alive) return;

        setTitle(data.title || "Volumen de Estudio");
        const fileUrl = data.fileUrl || data.pdfUrl;

        if (!fileUrl) {
          router.push("/biblioteca");
          return;
        }

        setPdfUrl(fileUrl);
        setLoading(false);
      } catch (err) {
        console.error("Error:", err);
        router.push("/biblioteca");
      }
    })();
    return () => { alive = false; };
  }, [id, router]);

  return (
    <main className="min-h-screen bg-[#fcfaf7] font-serif">
      <Header />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Navegación Superior */}
        <div className="flex items-center justify-between mb-12 border-b border-amber-100 pb-6">
          <button
            className="group flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-gray-400 hover:text-black transition-all"
            onClick={() => router.push("/biblioteca")}
          >
            <span className="text-xl group-hover:-translate-x-2 transition-transform">←</span>
            Volver a la Biblioteca
          </button>
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
            <span className="text-[11px] uppercase tracking-[0.3em] text-amber-700 font-bold">Lectura Protegida</span>
          </div>
        </div>

        {/* Título y Estética */}
        <div className="text-center mb-16 space-y-4">
          <p className="text-xs uppercase tracking-[0.5em] text-amber-600/60">Legacy Collection</p>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 tracking-tighter max-w-4xl mx-auto leading-tight">
            {loading ? "Preparando la Obra..." : title}
          </h1>
          <div className="flex justify-center items-center gap-4">
            <div className="h-px w-16 bg-gray-200"></div>
            <img src="/icon-512.png" className="w-6 h-6 grayscale opacity-30" alt="decor" />
            <div className="h-px w-16 bg-gray-200"></div>
          </div>
        </div>

        {/* Contenedor del Visor */}
        <div className="relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[600px] bg-white/50 rounded-[40px] border border-amber-100 shadow-inner">
              <div className="w-16 h-16 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-6 text-sm italic text-amber-800/40 tracking-widest uppercase">Cargando del archivo digital</p>
            </div>
          ) : (
            <div className="animate-in fade-in duration-1000 p-2 md:p-6 bg-white/40 rounded-[40px] border border-white/60 shadow-xl">
              {pdfUrl && id && <EbookViewer fileUrl={pdfUrl} documentId={id} />}
            </div>
          )}
        </div>

        {/* Pie de Página Honorífico */}
        <div className="mt-20 text-center pb-12 pt-8 border-t border-amber-50 mx-auto max-w-xs">
          <p className="text-[10px] uppercase tracking-[0.5em] text-gray-300 leading-loose">
            Jose Enrique Perez Leon<br />
            <span className="text-amber-600/40 font-bold italic text-xs">Consejero del Obrero</span>
          </p>
        </div>
      </section>
    </main>
  );
}