"use client";

import dynamic from "next/dynamic";
import { doc, getDoc } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";

/** Convierte path de Storage (o gs://) a URL pública de descarga. */
async function toDownloadUrl(fileField: string): Promise<string> {
  const trimmed = fileField.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  let storagePath = trimmed;
  if (trimmed.startsWith("gs://")) {
    const match = /^gs:\/\/[^/]+\/o\/(.+)$/.exec(trimmed);
    storagePath = match ? decodeURIComponent(match[1]) : trimmed.replace(/^gs:\/\/[^/]+\/o\//, "");
  } else {
    storagePath = trimmed.replace(/^\/+/, "");
  }
  const pdfRef = ref(storage, storagePath);
  return getDownloadURL(pdfRef);
}

const EbookViewer = dynamic(
  () => import("@/components/EbookViewerClient"),
  { ssr: false }
);

export default function DocumentoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [title, setTitle] = useState<string>("");
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
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
        const downloadUrl = await toDownloadUrl(fileField.trim());
        if (!alive) return;
        setPdfUrl(downloadUrl);
        setLoading(false);
      } catch {
        router.push("/biblioteca");
      }
    })();

    return () => {
      alive = false;
    };
  }, [id, router]);

  const safeId = typeof id === "string" ? id : Array.isArray(id) ? id[0] ?? "" : "";

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
          pdfUrl && safeId ? (
            <EbookViewer fileUrl={pdfUrl} documentId={safeId} />
          ) : null
        )}
      </section>
    </main>
  );
}
