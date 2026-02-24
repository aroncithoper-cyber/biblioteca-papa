"use client";

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import FlipbookViewer from "@/components/FlipbookViewer";

import { pdfjs } from "react-pdf";
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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

        const data = snap.data() as any;
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
        console.error("Error al obtener el documento:", err);
        router.push("/biblioteca");
      }
    })();

    return () => {
      alive = false;
    };
  }, [id, router]);

  return (
    <main className="min-h-screen bg-[#fcfaf7] font-serif">
      <Header />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-16">

        {/* Navegación Superior */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10 border-b border-amber-100 pb-6">

          <button
            className="flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-gray-400 hover:text-black transition"
            onClick={() => router.push("/biblioteca")}
          >
            ← Volver a la Biblioteca
          </button>

          <span className="text-[10px] uppercase tracking-[0.3em] text-amber-700 font-medium">
            Lectura Digital
          </span>
        </div>

        {/* Título */}
        <div className="text-center mb-12 md:mb-16 space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-amber-600/50">
            Consejero del Obrero
          </p>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 max-w-3xl mx-auto leading-tight">
            {loading ? "Preparando lectura..." : title}
          </h1>

          <p className="text-sm text-gray-400 max-w-xl mx-auto">
            Archivo compartido para la edificación fraternal.
          </p>
        </div>

        {/* Visor */}
        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[500px] bg-white border border-amber-100 rounded-3xl shadow-sm">
              <div className="w-12 h-12 border-2 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
              <p className="mt-6 text-sm text-gray-400 italic">
                Cargando documento...
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-2 sm:p-6">
              {pdfUrl && <FlipbookViewer fileUrl={pdfUrl} />}
            </div>
          )}
        </div>

        {/* Pie discreto */}
        <div className="mt-16 text-center border-t border-amber-50 pt-8">
          <p className="text-[11px] text-gray-400 leading-relaxed">
            J. Enrique Pérez León
          </p>
          <p className="text-[10px] text-amber-600/60 uppercase tracking-widest mt-1">
            Consejero del Obrero
          </p>
        </div>

      </section>
    </main>
  );
}