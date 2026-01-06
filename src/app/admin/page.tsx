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
  arrayUnion,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Link from "next/link";

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<any[]>([]);
  const [userEmailToAuthorize, setUserEmailToAuthorize] = useState<{ [key: string]: string }>({});
  const router = useRouter();

  // Estados para Documentos (PDF)
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [isPublic, setIsPublic] = useState(false);

  // Estados para Galería
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [galleryDesc, setGalleryDesc] = useState("");

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

  useEffect(() => { loadDocs().catch(console.error); }, []);

  // LIBERAR LIBRO A UN USUARIO
  const authorizeUser = async (docId: string) => {
    const email = userEmailToAuthorize[docId]?.trim().toLowerCase();
    if (!email) return alert("Escribe un correo válido");

    setLoading(true);
    try {
      const docRef = doc(db, "documents", docId);
      await updateDoc(docRef, {
        authorizedEmails: arrayUnion(email)
      });
      alert(`Acceso concedido a ${email} ✅`);
      setUserEmailToAuthorize({ ...userEmailToAuthorize, [docId]: "" });
      loadDocs();
    } catch (e) {
      alert("Error al autorizar");
    } finally {
      setLoading(false);
    }
  };

  // SUBIR DOCUMENTO
  const uploadDoc = async () => {
    if (!title.trim() || !file) return alert("Completa el título y el PDF");
    setLoading(true);
    try {
      let coverUrl = "";
      if (cover) {
        const coverPath = `covers/${Date.now()}_${cover.name}`;
        await uploadBytes(ref(storage, coverPath), cover);
        coverUrl = await getDownloadURL(ref(storage, coverPath));
      }

      const pdfPath = `pdfs/${Date.now()}_${file.name}`;
      await uploadBytes(ref(storage, pdfPath), file);
      const fileUrl = await getDownloadURL(ref(storage, pdfPath));

      await addDoc(collection(db, "documents"), {
        title: title.trim(),
        fileUrl,
        coverUrl,
        storagePath: pdfPath,
        isPublic,
        authorizedEmails: [], // Lista vacía al iniciar
        createdAt: serverTimestamp(),
      });

      alert("Documento publicado ✅");
      setTitle(""); setFile(null); setCover(null);
      loadDocs();
    } catch (e) { alert("Error al subir documento"); }
    finally { setLoading(false); }
  };

  // SUBIR A GALERÍA
  const uploadToGallery = async () => {
    if (!galleryFile) return alert("Selecciona una foto");
    setLoading(true);
    try {
      const path = `gallery/${Date.now()}_${galleryFile.name}`;
      await uploadBytes(ref(storage, path), galleryFile);
      const url = await getDownloadURL(ref(storage, path));
      await addDoc(collection(db, "gallery"), {
        url,
        description: galleryDesc,
        createdAt: serverTimestamp(),
      });
      alert("Foto añadida ✅");
      setGalleryFile(null); setGalleryDesc("");
    } catch (e) { alert("Error"); }
    finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen bg-[#fcfaf7] font-serif pb-20">
      <Header />
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-amber-100 pb-10">
          <h1 className="text-5xl font-bold text-gray-900 tracking-tighter">Administración</h1>
        </div>

        {/* Formulario de Carga (Omitido para brevedad, mantén el tuyo igual) */}
        {/* ... (Aquí va tu bloque 01 y 02 de subida que ya tenías) ... */}

        {/* LISTADO DE GESTIÓN CON LIBERACIÓN DE LIBROS */}
        <div className="mt-24">
          <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400 mb-10 border-b border-amber-100 pb-4">
            Gestión de Acceso y Archivo
          </h3>
          <div className="space-y-6">
            {docs.map((d) => (
              <div key={d.id} className="bg-white border border-amber-100 rounded-[2.5rem] p-8 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex items-center gap-6">
                    {d.coverUrl ? (
                      <img src={d.coverUrl} className="w-16 h-16 rounded-xl object-cover shadow-md" alt="" />
                    ) : (
                      <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center text-[10px] text-amber-500 font-bold">PDF</div>
                    )}
                    <div>
                      <p className="font-bold text-xl text-gray-900 leading-tight">{d.title}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">
                        {d.isPublic ? '🔓 Público' : `🔒 ${d.authorizedEmails?.length || 0} Accesos concedidos`}
                      </p>
                    </div>
                  </div>

                  {!d.isPublic && (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input 
                          type="email"
                          placeholder="Correo del hermano..."
                          className="text-xs px-4 py-2 bg-[#fcfaf7] border border-amber-100 rounded-lg outline-none focus:ring-1 focus:ring-amber-500 w-48"
                          value={userEmailToAuthorize[d.id] || ""}
                          onChange={(e) => setUserEmailToAuthorize({ ...userEmailToAuthorize, [d.id]: e.target.value })}
                        />
                        <button 
                          onClick={() => authorizeUser(d.id)}
                          disabled={loading}
                          className="bg-amber-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all"
                        >
                          Liberar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-50 flex justify-end gap-4">
                   <button onClick={async () => { if(confirm('¿Borrar?')) { await deleteDoc(doc(db, "documents", d.id)); loadDocs(); }}} className="text-[10px] font-bold text-red-400 hover:text-red-600 uppercase tracking-widest">Eliminar Volumen</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}