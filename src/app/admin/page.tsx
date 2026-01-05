"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage, auth } from "@/lib/firebase"; // Asegúrate de exportar 'auth' en tu firebase.ts
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Link from "next/link";

type DocItem = {
  id: string;
  title: string;
  fileUrl: string;
  storagePath: string;
  createdAt?: any;
};

export default function AdminPage() {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const router = useRouter();

  // 1. Protección de Ruta (Solo usuarios logueados por ahora)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/"); // Si no hay usuario, fuera al home
      }
    });
    return () => unsubscribe();
  }, [router]);

  const loadDocs = async () => {
    const q = query(collection(db, "documents"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setDocs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
  };

  useEffect(() => {
    loadDocs().catch(console.error);
  }, []);

  // SUBIR NUEVO
  const upload = async () => {
    if (!title.trim()) return alert("Pon un título");
    if (!file) return alert("Selecciona un PDF");

    setLoading(true);
    try {
      const storagePath = `pdfs/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(storageRef);

      await addDoc(collection(db, "documents"), {
        title: title.trim(),
        fileUrl,
        storagePath,
        createdAt: serverTimestamp(),
      });

      setTitle("");
      setFile(null);
      await loadDocs();
      alert("Volumen guardado con éxito ✅");
    } catch (e) {
      alert("Error al subir");
    } finally {
      setLoading(false);
    }
  };

  // EDITAR TÍTULO
  const saveTitleEdit = async (id: string) => {
    if (!editTitle.trim()) return;
    try {
      await updateDoc(doc(db, "documents", id), { title: editTitle.trim() });
      setEditingId(null);
      await loadDocs();
    } catch (e) {
      alert("No se pudo actualizar el nombre");
    }
  };

  // ELIMINAR DOCUMENTO
  const deleteDocument = async (d: DocItem) => {
    if (!confirm(`¿Seguro que quieres borrar "${d.title}"?`)) return;

    try {
      // 1. Borrar de Storage
      const fileRef = ref(storage, d.storagePath);
      await deleteObject(fileRef).catch(() => console.log("Archivo no estaba en storage"));
      
      // 2. Borrar de Firestore
      await deleteDoc(doc(db, "documents", d.id));
      await loadDocs();
      alert("Borrado correctamente");
    } catch (e) {
      alert("Error al eliminar");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      <Header />

      <section className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Panel de Control</h1>
          <Link href="/" className="text-sm text-gray-500 hover:underline">Ir a la biblioteca</Link>
        </div>

        {/* Formulario de Carga */}
        <div className="bg-white border shadow-sm rounded-2xl p-8 mb-10">
          <h2 className="text-lg font-semibold mb-4">Publicar Nuevo Volumen</h2>
          <div className="grid gap-4">
            <input
              className="border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-black outline-none transition-all"
              placeholder="Ej: Consejero del Obrero 1-2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <input
                type="file"
                accept="application/pdf"
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <button
                onClick={upload}
                disabled={loading}
                className="w-full sm:w-48 px-6 py-3 rounded-xl bg-black text-white font-bold hover:bg-gray-800 disabled:bg-gray-400 transition-all shadow-lg"
              >
                {loading ? "Procesando..." : "Subir Libro"}
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Documentos */}
        <div>
          <h2 className="font-bold text-xl mb-6 flex items-center gap-2">
            Gestión de Biblioteca <span className="text-xs font-normal text-gray-400">({docs.length} unidades)</span>
          </h2>

          <div className="grid gap-4">
            {docs.map((d) => (
              <div key={d.id} className="bg-white border rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow">
                
                <div className="flex-1 w-full">
                  {editingId === d.id ? (
                    <div className="flex gap-2 w-full">
                      <input 
                        className="border rounded-lg px-3 py-1 text-sm w-full"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        autoFocus
                      />
                      <button onClick={() => saveTitleEdit(d.id)} className="text-green-600 text-xs font-bold uppercase">Guardar</button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400 text-xs font-bold uppercase">X</button>
                    </div>
                  ) : (
                    <div className="group flex items-center gap-3">
                      <span className="font-bold text-gray-800">{d.title}</span>
                      <button 
                        onClick={() => { setEditingId(d.id); setEditTitle(d.title); }}
                        className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-500 font-bold uppercase tracking-widest transition-opacity"
                      >
                        [ Editar Nombre ]
                      </button>
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400 font-mono mt-1 truncate max-w-xs">{d.fileUrl}</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Link
                    className="flex-1 text-center text-xs px-4 py-2.5 rounded-lg border border-gray-900 font-bold hover:bg-gray-900 hover:text-white transition-all"
                    href={`/documentos/${d.id}`}
                  >
                    PREVISUALIZAR
                  </Link>
                  <button
                    onClick={() => deleteDocument(d)}
                    className="px-4 py-2.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-600 hover:text-white transition-all"
                  >
                    BORRAR
                  </button>
                </div>
              </div>
            ))}

            {docs.length === 0 && !loading && (
              <div className="text-center py-20 text-gray-400 italic">No hay registros en la base de datos.</div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}