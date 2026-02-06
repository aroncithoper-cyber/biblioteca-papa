"use client";

import dynamic from "next/dynamic";
import { doc, getDoc } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";

const EbookViewer = dynamic(
  () => import("@/components/EbookViewerClient"),
  { ssr: false }
);

async function toDownloadUrl(fileField: string): Promise<string> {
  const trimmed = fileField.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  let storagePath = trimmed;
  if (trimmed.startsWith("gs://")) {
    const match = /^gs:\/\/[^/]+\/(.+)$/.exec(trimmed);
    storagePath = match ? decodeURIComponent(match[1]) : trimmed.replace(/^gs:\/\/[^/]+\//, "");
  } else {
    storagePath = trimmed.replace(/^\/+/, "");
  }
  return getDownloadURL(ref(storage, storagePath));
}

export default function DocumentoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [title, setTitle] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params?.id;
    const docId = typeof id === "string" ? id : Array.isArray(id) ? id[0] ?? "" : "";
    if (!docId) return;
    let alive = true;

    (async () => {
      try {
        const snap = await getDoc(doc(db, "documents", docId));
        if (!snap.exists()) {
          router.push("/biblioteca");
          return;
        }
        const data = snap.data();
        if (!alive || !data) return;

        const fileField = (data.fileUrl ?? data.pdfUrl ?? data.path ?? "") as string;
        if (typeof fileField !== "string" || !fileField.trim()) {
          router.push("/biblioteca");
          return;
        }

        setTitle((data.title as string) || "Volumen de Estudio");
        const url = await toDownloadUrl(fileField.trim());
        if (!alive) return;
        setPdfUrl(url);
        setDocumentId(docId);
        setLoading(false);
      } catch {
        router.push("/biblioteca");
      }
    })();

    return () => { alive = false; };
  }, [params?.id, router]);

  return (
    <main className="min-h-screen bg-[#fcfaf7] font-serif">
      <Header />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-12 border-b border-amber-100 pb-6">
          <button
            onClick={() => router.push("/biblioteca")}
            className="text-[11px] uppercase tracking-[0.3em] text-gray-400 hover:text-black"
          >
            ← Volver a la Biblioteca
          </button>
          <span className="text-[11px] uppercase tracking-[0.3em] text-amber-700 font-bold">
            Lectura Protegida
          </span>
        </div>

        <div className="text-center mb-16 space-y-4">
          <p className="text-xs uppercase tracking-[0.5em] text-amber-600/60">Legacy Collection</p>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 tracking-tighter leading-tight">
            {loading ? "Abriendo los archivos..." : title}
          </h1>
        </div>

        <div className="relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[600px] bg-white/50 rounded-[40px] border border-amber-100 shadow-inner">
              <div className="w-16 h-16 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              <p className="mt-6 text-sm italic text-amber-800/40 tracking-widest uppercase">
                Cargando del archivo digital
              </p>
            </div>
          ) : (
            pdfUrl && documentId ? (
              <div className="p-2 md:p-8 bg-white/40 rounded-[40px] shadow-2xl border border-white/60">
                <EbookViewer fileUrl={pdfUrl} documentId={documentId} />
              </div>
            ) : null
          )}
        </div>

        <div className="mt-20 text-center pb-12 pt-8 border-t border-amber-50 max-w-xs mx-auto">
          <p className="text-[10px] uppercase tracking-[0.5em] text-gray-300 leading-loose">
            Jose Enrique Perez Leon
            <br />
            <span className="text-amber-600/40 font-bold italic text-xs">Consejero del Obrero</span>
          </p>
        </div>
      </section>
    </main>
  );
}
