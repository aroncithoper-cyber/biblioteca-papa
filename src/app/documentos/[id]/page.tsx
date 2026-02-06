"use client";

import { useState, useEffect } from "react";

/* TEMPORAL: resto comentado hasta completar pasos.
import dynamic from "next/dynamic";
import { doc, getDoc } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";

const EbookViewer = dynamic(
  () => import("@/components/EbookViewerClient"),
  { ssr: false }
);

async function toDownloadUrl(fileField: string): Promise<string> {
  ...
}
*/

export default function DocumentoPage() {
  return (
    <div style={{ padding: 40 }}>
      <h1>Página documentos OK</h1>
      <p>Si ves esto, el crash no es de Next ni de la ruta.</p>
    </div>
  );
}
