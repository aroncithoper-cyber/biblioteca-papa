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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

export default function AdminPage() {
  const ADMIN_EMAILS = ["aroncithoper@gmail.com", "e_perezleon@hotmail.com"];

  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [docs, setDocs] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]); 
  const [userEmailToAuthorize, setUserEmailToAuthorize] = useState<{ [key: string]: string }>({});
  const router = useRouter();

  // Estados Documentos
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [isPublic, setIsPublic] = useState(false);

  // Estados Galería
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [galleryDesc, setGalleryDesc] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const userEmail = user?.email?.toLowerCase() || "";
      if (!user || !ADMIN_EMAILS.includes(userEmail)) {
        router.push("/biblioteca"); 
      } else {
        setIsAdmin(true);
        loadData();
      }
    });
    return () => unsubscribe();
  }, [router]);

  const loadData = async () => {
    try {
      const qDocs = query(collection(db, "documents"), orderBy("createdAt", "desc"));
      const snapDocs = await getDocs(qDocs);
      setDocs(snapDocs.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));

      const qReq = query(collection(db, "requests"), orderBy("createdAt", "desc"));
      const snapReq = await getDocs(qReq);
      setRequests(snapReq.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    } catch (e: any) {
      console.error("Error cargando datos:", e);
    }
  };

  const authorizeUser = async (docId: string) => {
    const email = userEmailToAuthorize[docId]?.trim().toLowerCase();
    if (!email) return alert("Escribe un correo válido");
    setLoading(true);
    try {
      await updateDoc(doc(db, "documents", docId), { authorizedEmails: arrayUnion(email) });
      alert(`✅ Acceso concedido a: ${email}`);
      setUserEmailToAuthorize({ ...userEmailToAuthorize, [docId]: "" });
      loadData();
    } catch (e: any) { 
        alert("❌ Error al autorizar: " + e.message);
    } finally { setLoading(false); }
  };

  const uploadDoc = async () => {
    if (!title.trim()) return alert("⚠️ Escribe un título para el libro");
    if (!file) return alert("⚠️ No has seleccionado el archivo PDF");
    
    setLoading(true);
    try {
      console.log("1. Iniciando proceso de subida...");
      
      // Subir Portada
      let coverUrl = "";
      if (cover) {
        console.log("2. Subiendo portada...");
        const coverPath = `covers/${Date.now()}_${cover.name}`;
        const coverRef = ref(storage, coverPath);
        await uploadBytes(coverRef, cover);
        coverUrl = await getDownloadURL(coverRef);
        console.log("Portada lista:", coverUrl);
      } else {
        console.log("Sin portada seleccionada.");
      }

      // Subir PDF
      console.log("3. Subiendo PDF...");
      const pdfPath = `pdfs/${Date.now()}_${file.name}`;
      const pdfRef = ref(storage, pdfPath);
      await uploadBytes(pdfRef, file);
      const fileUrl = await getDownloadURL(pdfRef);
      console.log("PDF listo:", fileUrl);

      // Guardar en Firestore
      console.log("4. Guardando en base de datos...");
      await addDoc(collection(db, "documents"), {
        title: title.trim(),
        fileUrl: fileUrl,
        coverUrl: coverUrl, // Si no hay, se guarda como string vacío ""
        storagePath: pdfPath,
        isPublic: isPublic,
        authorizedEmails: [],
        createdAt: serverTimestamp(),
      });

      alert("🎉 ¡Libro publicado correctamente!");
      
      // Limpiar
      setTitle(""); setFile(null); setCover(null); setIsPublic(false);
      // Limpiar inputs visualmente
      const pdfInput = document.getElementById("pdfInput") as HTMLInputElement;
      const coverInput = document.getElementById("coverInput") as HTMLInputElement;
      if(pdfInput) pdfInput.value = "";
      if(coverInput) coverInput.value = "";

      loadData();

    } catch (e: any) { 
      console.error(e);
      // Aquí está la clave: te dirá el error real
      alert("❌ ERROR AL SUBIR: " + e.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const uploadToGallery = async () => {
    if (!galleryFile) return alert("⚠️ Selecciona una foto");
    setLoading(true);
    try {
      const path = `gallery/${Date.now()}_${galleryFile.name}`;
      const imgRef = ref(storage, path);
      await uploadBytes(imgRef, galleryFile);
      const url = await getDownloadURL(imgRef);
      
      await addDoc(collection(db, "gallery"), { 
        url, 
        description: galleryDesc, 
        createdAt: serverTimestamp() 
      });
      
      alert("📸 Foto añadida a la galería");
      setGalleryFile(null); setGalleryDesc("");
      const galInput = document.getElementById("galleryInput") as HTMLInputElement;
      if(galInput) galInput.value = "";
      
      loadData();
    } catch (e: any) { 
      alert("❌ Error en galería: " + e.message); 
    } finally { setLoading(false); }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#fcfaf7] flex items-center justify-center">
        <p className="font-serif italic text-gray-400 animate-pulse">Verificando acceso...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#fcfaf7] font-serif pb-20">
      <Header />
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-5xl font-bold text-gray-900 tracking-tighter mb-12 border-b border-amber-100 pb-10">Administración</h1>

        <div className="grid md:grid-cols-2 gap-10 mb-20">
          {/* SECCIÓN 01: LIBROS (PDF) */}
          <div className="bg-white rounded-[3rem] p-8 shadow-2xl border border-amber-50">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
               <span className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-[10px]">01</span>
               Nuevo Volumen
            </h2>
            <div className="space-y-4">
              <input 
                className="w-full bg-[#fcfaf7] rounded-2xl px-5 py-4 text-sm border border-gray-100 outline-none" 
                placeholder="Título del Libro..." 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
              />
              
              <div className="grid grid-cols-2 gap-4">
                {/* Input PDF */}
                <div className={`relative h-24 bg-[#fcfaf7] border-2 border-dashed ${file ? 'border-green-500 bg-green-50' : 'border-amber-100'} rounded-2xl flex flex-col items-center justify-center`}>
                  <input 
                    id="pdfInput"
                    type="file" 
                    accept="application/pdf" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={(e)=>setFile(e.target.files?.[0]||null)} 
                  />
                  <span className={`text-[9px] font-bold uppercase ${file ? 'text-green-700' : 'text-amber-600'}`}>
                    {file ? "PDF Listo" : "Subir PDF"}
                  </span>
                </div>

                {/* Input Portada */}
                <div className={`relative h-24 bg-[#fcfaf7] border-2 border-dashed ${cover ? 'border-green-500 bg-green-50' : 'border-amber-100'} rounded-2xl flex flex-col items-center justify-center`}>
                  <input 
                    id="coverInput"
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={(e)=>setCover(e.target.files?.[0]||null)} 
                  />
                  <span className={`text-[9px] font-bold uppercase ${cover ? 'text-green-700' : 'text-amber-600'}`}>
                    {cover ? "Portada Lista" : "Subir Portada"}
                  </span>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer py-2">
                <input type="checkbox" checked={isPublic} onChange={(e)=>setIsPublic(e.target.checked)} className="accent-black" />
                <span className="text-[10px] font-bold uppercase text-gray-400">Hacer Público</span>
              </label>

              <button 
                onClick={uploadDoc} 
                disabled={loading} 
                className="w-full py-4 bg-black text-white rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-all disabled:opacity-50"
              >
                {loading ? "Subiendo..." : "Publicar Libro"}
              </button>
            </div>
          </div>

          {/* SECCIÓN 02: GALERÍA (FOTOS) */}
          <div className="bg-white rounded-[3rem] p-8 shadow-2xl border border-amber-50">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-amber-700">
               <span className="w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center text-[10px]">02</span>
               Galería (Fotos)
            </h2>
            <div className="space-y-4">
              <div className="relative h-36 bg-amber-50/30 border-2 border-dashed border-amber-100 rounded-[2rem] flex flex-col items-center justify-center">
                <input 
                  id="galleryInput"
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={(e)=>setGalleryFile(e.target.files?.[0]||null)} 
                />
                <span className="text-[10px] font-bold uppercase text-amber-600 px-4 text-center">
                  {galleryFile ? galleryFile.name : "Subir Foto"}
                </span>
              </div>
              <input className="w-full bg-[#fcfaf7] rounded-2xl px-5 py-4 text-sm border border-gray-100 outline-none" placeholder="Descripción..." value={galleryDesc} onChange={(e)=>setGalleryDesc(e.target.value)} />
              <button onClick={uploadToGallery} disabled={loading} className="w-full py-4 bg-amber-600 text-white rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-all">
                {loading ? "Guardando..." : "Añadir a Galería"}
              </button>
            </div>
          </div>
        </div>

        {/* LISTADO DE LIBROS */}
        <div className="mb-24">
           <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400 mb-8 flex items-center gap-4">
            Archivo Existente <span className="h-px flex-1 bg-amber-100"></span>
          </h3>
          <div className="space-y-4">
            {docs.map((d) => (
              <div key={d.id} className="bg-white border border-amber-50 rounded-[2.5rem] p-8 shadow-sm group">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-6">
                    {d.coverUrl ? (
                        <img src={d.coverUrl} className="w-16 h-16 rounded-xl object-cover border border-gray-200" alt="Portada" />
                    ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-[10px] font-bold">Sin Foto</div>
                    )}
                    <div>
                      <p className="font-bold text-xl text-gray-900">{d.title}</p>
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                        {d.isPublic ? 'Público' : 'Privado'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button onClick={async () => { if(confirm('¿Eliminar?')) { await deleteDoc(doc(db, "documents", d.id)); loadData(); }}} className="text-[9px] text-red-300 hover:text-red-500 font-bold uppercase tracking-[0.2em] transition-colors">Eliminar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}