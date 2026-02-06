"use client";

/* TEMPORAL: contenido comentado para aislar el crash.
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
*/

export default function DocumentoPage() {
  /* TEMPORAL: todo el cuerpo comentado
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
  */

  return (
    <div style={{ padding: 40 }}>
      <h1>Página documentos OK</h1>
      <p>Si ves esto, el crash no es de Next ni de la ruta.</p>
    </div>
  );
}
