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
    if (!id) return;
    let alive = true;

    (async () => {
      try {
        const snap = await getDoc(doc(db, "documents", id));
        if (!snap.exists()) {
          router.push("/biblioteca");
          return;
        }

        const data = snap.data();
        if (!alive) return;

        const fileUrl = data.fileUrl || data.pdfUrl;
        if (!fileUrl) {
          router.push("/biblioteca");
          return;
        }

        setTitle(data.title || "Volumen de Estudio");
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

  return (
    <main className="min-h-screen bg-[#fcfaf7] font-serif">
      <Header />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-12 border-b border-amber-100 pb-6">
          <button
            onClick={() => router.push("/biblioteca")}
            className="text-xs uppercase tracking-widest text-gray-400 hover:text-black"
          >
            ← Volver a la Biblioteca
          </button>
          <span className="text-xs uppercase tracking-widest text-amber-700 font-bold">
            Lectura Protegida
          </span>
        </div>

        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.4em] text-amber-600/60">
            Legacy Collection
          </p>
          <h1 className="text-4xl md:text-6xl font-bold">
            {loading ? "Preparando la Obra…" : title}
          </h1>
        </div>

        {loading ? (
          <div className="min-h-[600px] flex items-center justify-center">
            <div className="w-12 h-12 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          pdfUrl && id && <EbookViewer fileUrl={pdfUrl} documentId={id} />
        )}
      </section>
    </main>
  );
}
