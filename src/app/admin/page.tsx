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
  const [requests, setRequests] = useState<any[]>([]); // Nueva lista de solicitudes
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

  const loadData = async () => {
    // Cargar Libros
    const qDocs = query(collection(db, "documents"), orderBy("createdAt", "desc"));
    const snapDocs = await getDocs(qDocs);
    setDocs(snapDocs.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));

    // Cargar Solicitudes de WhatsApp
    const qReq = query(collection(db, "requests"), orderBy("createdAt", "desc"));
    const snapReq = await getDocs(qReq);
    setRequests(snapReq.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
  };

  useEffect(() => { loadData().catch(console.error); }, []);

  const authorizeUser = async (docId: string) => {
    const email = userEmailToAuthorize[docId]?.trim().toLowerCase();
    if (!email) return alert("Escribe un correo válido");
    setLoading(true);
    try {
      await updateDoc(doc(db, "documents", docId), { authorizedEmails: arrayUnion(email) });
      alert(`Acceso concedido a ${email} ✅`);
      setUserEmailToAuthorize({ ...userEmailToAuthorize, [docId]: "" });
      loadData();
    } catch (e) { alert("Error"); }
    finally { setLoading(false); }
  };

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
        authorizedEmails: [],
        createdAt: serverTimestamp(),
      });
      alert("Documento publicado ✅");
      setTitle(""); setFile(null); setCover(null);
      loadData();
    } catch (e) { alert("Error"); }
    finally { setLoading(false); }
  };

  const uploadToGallery = async () => {
    if (!galleryFile) return alert("Selecciona una foto");
    setLoading(true);
    try {
      const path = `gallery/${Date.now()}_${galleryFile.name}`;
      await uploadBytes(ref(storage, path), galleryFile);
      const url = await getDownloadURL(ref(storage, path));
      await addDoc(collection(db, "gallery"), { url, description: galleryDesc, createdAt: serverTimestamp() });
      alert("Foto añadida ✅");
      setGalleryFile(null); setGalleryDesc("");
      loadData();
    } catch (e) { alert("Error"); }
    finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen bg-[#fcfaf7] font-serif pb-20">
      <Header />
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-5xl font-bold text-gray-900 tracking-tighter mb-12 border-b border-amber-100 pb-10">Administración</h1>

        {/* --- FORMULARIOS DE CARGA --- */}
        <div className="grid md:grid-cols-2 gap-10 mb-20">
          {/* Publicar Libro */}
          <div className="bg-white rounded-[3rem] p-8 shadow-2xl border border-amber-50">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
               <span className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-[10px]">01</span>
               Nuevo Volumen
            </h2>
            <div className="space-y-4">
              <input className="w-full bg-[#fcfaf7] rounded-2xl px-5 py-4 text-sm border border-gray-100 outline-none" placeholder="Título..." value={title} onChange={(e) => setTitle(e.target.value)} />
              <div className="grid grid-cols-2 gap-4">
                <div className="relative h-24 bg-[#fcfaf7] border-2 border-dashed border-amber-100 rounded-2xl flex flex-col items-center justify-center">
                  <input type="file" accept="application/pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e)=>setFile(e.target.files?.[0]||null)} />
                  <span className="text-[9px] font-bold uppercase text-amber-600">PDF</span>
                </div>
                <div className="relative h-24 bg-[#fcfaf7] border-2 border-dashed border-amber-100 rounded-2xl flex flex-col items-center justify-center">
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e)=>setCover(e.target.files?.[0]||null)} />
                  <span className="text-[9px] font-bold uppercase text-amber-600">Portada</span>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer py-2">
                <input type="checkbox" checked={isPublic} onChange={(e)=>setIsPublic(e.target.checked)} className="accent-black" />
                <span className="text-[10px] font-bold uppercase text-gray-400">Público</span>
              </label>
              <button onClick={uploadDoc} disabled={loading} className="w-full py-4 bg-black text-white rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-all">Publicar</button>
            </div>
          </div>

          {/* Galería */}
          <div className="bg-white rounded-[3rem] p-8 shadow-2xl border border-amber-50">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-amber-700">
               <span className="w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center text-[10px]">02</span>
               Galería
            </h2>
            <div className="space-y-4">
              <div className="relative h-36 bg-amber-50/30 border-2 border-dashed border-amber-100 rounded-[2rem] flex flex-col items-center justify-center">
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e)=>setGalleryFile(e.target.files?.[0]||null)} />
                <span className="text-[10px] font-bold uppercase text-amber-600">{galleryFile ? galleryFile.name : "Subir Foto"}</span>
              </div>
              <input className="w-full bg-[#fcfaf7] rounded-2xl px-5 py-4 text-sm border border-gray-100 outline-none" placeholder="Descripción..." value={galleryDesc} onChange={(e)=>setGalleryDesc(e.target.value)} />
              <button onClick={uploadToGallery} disabled={loading} className="w-full py-4 bg-amber-600 text-white rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-amber-100">Añadir</button>
            </div>
          </div>
        </div>

        {/* --- SECCIÓN DE SOLICITUDES PENDIENTES --- */}
        <div className="mb-24">
          <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-amber-600 mb-8 flex items-center gap-4">
            Solicitudes de WhatsApp <span className="h-px flex-1 bg-amber-100"></span>
          </h3>
          <div className="grid gap-4">
            {requests.map((r) => (
              <div key={r.id} className="bg-amber-50 border border-amber-100 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in">
                <div>
                  <p className="font-bold text-gray-900">{r.userEmail}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-medium">Interesado en: <span className="text-amber-700 font-bold">{r.bookTitle}</span></p>
                </div>
                <div className="flex items-center gap-4">
                  <a 
                    href={`https://wa.me/${r.whatsapp.replace(/\+/g, '')}`} 
                    target="_blank" 
                    className="bg-green-500 text-white px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-green-600 transition-all flex items-center gap-2"
                  >
                    📱 WhatsApp
                  </a>
                  <button 
                    onClick={async () => { if(confirm('¿Marcar como atendida?')) { await deleteDoc(doc(db, "requests", r.id)); loadData(); } }}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
            {requests.length === 0 && <p className="text-center italic text-gray-300 py-10">No hay solicitudes nuevas.</p>}
          </div>
        </div>

        {/* --- GESTIÓN DE LIBROS --- */}
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400 mb-8 flex items-center gap-4">
            Gestión de Archivo <span className="h-px flex-1 bg-amber-100"></span>
          </h3>
          <div className="space-y-4">
            {docs.map((d) => (
              <div key={d.id} className="bg-white border border-amber-50 rounded-[2.5rem] p-8 shadow-sm group">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-6">
                    {d.coverUrl ? <img src={d.coverUrl} className="w-16 h-16 rounded-xl object-cover" /> : <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center text-white text-[10px]">PDF</div>}
                    <div>
                      <p className="font-bold text-xl text-gray-900 leading-tight">{d.title}</p>
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                        {d.isPublic ? 'Público' : `${d.authorizedEmails?.length || 0} Accesos`}
                      </span>
                    </div>
                  </div>
                  {!d.isPublic && (
                    <div className="flex gap-2">
                      <input 
                        type="email" 
                        placeholder="Correo a liberar..." 
                        className="text-xs px-4 py-2 bg-[#fcfaf7] border border-amber-100 rounded-xl outline-none focus:ring-1 focus:ring-amber-500 w-44"
                        value={userEmailToAuthorize[d.id] || ""}
                        onChange={(e) => setUserEmailToAuthorize({ ...userEmailToAuthorize, [d.id]: e.target.value })}
                      />
                      <button onClick={() => authorizeUser(d.id)} className="bg-black text-white px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-amber-600 transition-all">Liberar</button>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex justify-end">
                   <button onClick={async () => { if(confirm('¿Borrar?')) { await deleteDoc(doc(db, "documents", d.id)); loadData(); }}} className="text-[9px] text-red-300 hover:text-red-500 font-bold uppercase tracking-[0.2em] transition-colors opacity-0 group-hover:opacity-100">Eliminar Volumen</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}