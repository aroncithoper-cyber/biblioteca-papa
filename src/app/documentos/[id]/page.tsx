"use client";

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import FlipbookViewer from "@/components/FlipbookViewer";

export default function DocumentoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [title, setTitle] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [isMobileReader, setIsMobileReader] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(max-width: 767px)").matches ||
      /Android/i.test(navigator.userAgent)
    );
  });

  useEffect(() => {
    const mobile =
      window.matchMedia("(max-width: 767px)").matches ||
      /Android/i.test(navigator.userAgent);
    setIsMobileReader(mobile);
  }, []);

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
      } catch {
        router.push("/biblioteca");
      }
    })();

    return () => {
      alive = false;
    };
  }, [id, router]);

  if (isMobileReader && !loading && pdfUrl) {
    return (
      <main className="documento-mobile-reader min-h-[100dvh] bg-[#fcfaf7] font-serif">
        <Header />
        <div className="sticky top-0 z-20 px-3 py-2 border-b border-amber-100 bg-white/95 backdrop-blur-sm flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => router.push("/biblioteca")}
            className="min-h-[40px] text-[10px] font-bold uppercase tracking-wider text-amber-700"
          >
            ← Biblioteca
          </button>
          <p className="text-[10px] font-bold text-gray-800 truncate flex-1 text-center px-2">
            {title}
          </p>
          <span className="w-16 shrink-0" aria-hidden />
        </div>
        <FlipbookViewer fileUrl={pdfUrl} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fcfaf7] font-serif">
      <Header />

      <section className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-12 border-b border-amber-100 pb-4 sm:pb-6">
          <button
            type="button"
            className="group flex items-center gap-2 min-h-[44px] text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-gray-400 hover:text-black self-start"
            onClick={() => router.push("/biblioteca")}
          >
            <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
            <span>Volver a la Biblioteca</span>
          </button>
          <span className="text-[10px] uppercase tracking-[0.2em] text-amber-700 font-bold">
            Lectura Protegida
          </span>
        </div>

        <div className="text-center mb-8 sm:mb-16 space-y-3">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tighter max-w-4xl mx-auto leading-tight px-2 text-gray-900">
            {loading ? "Abriendo los archivos..." : title}
          </h1>
        </div>

        <div className="relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] rounded-2xl border bg-white/50 border-amber-100">
              <div className="w-16 h-16 border-2 border-t-amber-600 border-amber-100 rounded-full animate-spin" />
              <p className="mt-6 text-sm text-amber-800/40 uppercase tracking-widest">
                Preparando ejemplar
              </p>
            </div>
          ) : (
            <div className="p-1 sm:p-2 md:p-8 rounded-2xl md:rounded-[40px] shadow-2xl border bg-white/40 border-white/60 overflow-x-hidden">
              {pdfUrl && <FlipbookViewer fileUrl={pdfUrl} />}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
