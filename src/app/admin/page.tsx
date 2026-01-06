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
import { db, storage, auth } from "@/lib/firebase";
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) router.push("/"); 
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

  const upload = async () => {
    if (!title.trim() || !file) return alert("Completa todos los campos");
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
      alert("Volumen publicado correctamente ✅");
    } catch (e) {
      alert("Error en la carga");
    } finally {
      setLoading(false);
    }
  };

  const saveTitleEdit = async (id: string) => {
    if (!editTitle.trim()) return;
    try {
      await updateDoc(doc(db, "documents", id), { title: editTitle.trim() });
      setEditingId(null);
      await loadDocs();
    } catch (e) {
      alert("Error al actualizar");
    }
  };

  const deleteDocument = async (d: DocItem) => {
    if (!confirm(`¿Borrar permanentemente "${d.title}"?`)) return;
    try {
      const fileRef = ref(storage, d.storagePath);
      await deleteObject(fileRef).catch(() => console.log("No estaba en storage"));
      await deleteDoc(doc(db, "documents", d.id));
      await loadDocs();
    } catch (e) {
      alert("Error al eliminar");
    }
  };

  return (
    <main className="min-h-screen bg-[#fcfaf7] font-serif">
      <Header />

      <section className="max-w-5xl mx-auto px-6 py-16">
        {/* Cabecera del Panel */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-b border-amber-100 pb-10">
          <div>
            <span className="text-amber-600 font-bold text-[10px] uppercase tracking-[0.4em] mb-4 block">Gestión Editorial</span>
            <h1 className="text-5xl font-bold text-gray-900 tracking-tighter">Panel de Control</h1>
          </div>
          <Link href="/biblioteca" className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors flex items-center gap-2">
            Ver Biblioteca <span>→</span>
          </Link>
        </div>

        {/* Formulario de Carga Estilo Tarjeta */}
        <div className="bg-white rounded-[40px] shadow-2xl shadow-amber-900/5 p-8 md:p-12 mb-20 border border-amber-50">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-bold">+</div>
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Publicar Nuevo Volumen</h2>
          </div>
          
          <div className="grid gap-8">
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400 ml-4">Título de la Obra</label>
              <input
                className="w-full bg-[#fcfaf7] border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-lg font-medium shadow-inner"
                placeholder="Ej: Consejero — I Trimestre 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="w-full relative group">
                <input
                  type="file"
                  accept="application/pdf"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <div className="w-full py-4 px-6 rounded-2xl bg-white border-2 border-dashed border-amber-100 flex items-center justify-between group-hover:bg-amber-50 transition-colors">
                  <span className="text-sm text-gray-400 italic">
                    {file ? file.name : "Seleccionar PDF..."}
                  </span>
                  <span className="text-[10px] font-bold text-amber-600 uppercase">Adjuntar</span>
                </div>
              </div>
              
              <button
                onClick={upload}
                disabled={loading}
                className="w-full md:w-64 py-4 rounded-2xl bg-black text-white font-bold text-xs uppercase tracking-[0.3em] hover:bg-amber-600 disabled:bg-gray-200 transition-all shadow-xl shadow-black/10 active:scale-95"
              >
                {loading ? "Subiendo..." : "Publicar Ahora"}
              </button>
            </div>
          </div>
        </div>

        {/* Listado de Gestión */}
        <div>
          <h2 className="font-bold text-xs uppercase tracking-[0.5em] text-gray-400 mb-10 flex items-center gap-4">
            Archivo Publicado <span className="h-px flex-1 bg-amber-100"></span> <span>{docs.length}</span>
          </h2>

          <div className="space-y-4">
            {docs.map((d) => (
              <div key={d.id} className="bg-white/60 backdrop-blur-md border border-white rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-xl hover:bg-white transition-all duration-500">
                
                <div className="flex-1 w-full">
                  {editingId === d.id ? (
                    <div className="flex gap-2 w-full animate-in fade-in zoom-in duration-300">
                      <input 
                        className="bg-[#fcfaf7] border-none rounded-xl px-4 py-2 text-sm w-full outline-none ring-1 ring-amber-200"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        autoFocus
                      />
                      <button onClick={() => saveTitleEdit(d.id)} className="bg-black text-white px-4 rounded-xl text-[10px] font-bold uppercase">OK</button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400 px-2 font-bold">✕</button>
                    </div>
                  ) : (
                    <div className="group flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                      <span className="font-bold text-gray-800 text-lg tracking-tight">{d.title}</span>
                      <button 
                        onClick={() => { setEditingId(d.id); setEditTitle(d.title); }}
                        className="opacity-0 group-hover:opacity-100 text-[9px] text-amber-600 font-bold uppercase tracking-widest transition-all hover:underline"
                      >
                        [ Editar ]
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                  <Link
                    className="flex-1 md:flex-none text-center text-[10px] px-6 py-3 rounded-xl border border-gray-100 font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                    href={`/documento/${d.id}`}
                  >
                    Ver
                  </Link>
                  <button
                    onClick={() => deleteDocument(d)}
                    className="px-6 py-3 rounded-xl bg-red-50 text-red-500 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                  >
                    Borrar
                  </button>
                </div>
              </div>
            ))}

            {docs.length === 0 && !loading && (
              <div className="text-center py-20 text-gray-400 italic font-serif">La biblioteca está esperando su primer volumen...</div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}