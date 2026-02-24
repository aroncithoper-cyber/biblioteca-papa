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

      {/* Header solo visible antes de entrar en lectura */}
      <Header />

      {/* Cabecera editorial mínima */}
      <section className="max-w-4xl mx-auto px-6 pt-10 pb-8">

        <button
          className="text-[11px] uppercase tracking-[0.3em] text-gray-400 hover:text-black transition"
          onClick={() => router.push("/biblioteca")}
        >
          ← Volver a la Biblioteca
        </button>

        <div className="mt-10 text-center space-y-4">

          <p className="text-xs uppercase tracking-[0.4em] text-amber-600/50">
            Consejero del Obrero
          </p>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            {loading ? "Preparando lectura..." : title}
          </h1>

          <p className="text-sm text-gray-400 max-w-xl mx-auto">
            Archivo compartido para la edificación fraternal.
          </p>

        </div>
      </section>

      {/* MODO LECTOR — ocupa el espacio real */}
      <section className="relative">

        {loading ? (
          <div className="max-w-3xl mx-auto px-6 py-20 text-center">
            <div className="w-12 h-12 border-2 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-6 text-sm text-gray-400 italic">
              Cargando documento...
            </p>
          </div>
        ) : (
          <>
            {/* Separación suave antes de entrar en modo lector */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-100 to-transparent mb-8" />

            {pdfUrl && <FlipbookViewer fileUrl={pdfUrl} />}
          </>
        )}

      </section>

      {/* Pie editorial muy discreto */}
      {!loading && (
        <section className="max-w-3xl mx-auto px-6 py-16 text-center text-gray-400 text-[11px]">
          J. Enrique Pérez León • Consejero del Obrero
        </section>
      )}

    </main>
  );
}