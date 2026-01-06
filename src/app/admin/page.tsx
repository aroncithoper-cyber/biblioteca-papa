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
  arrayRemove, // <--- IMPORTANTE: Agregado para poder quitar permisos
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

  // Estado Edición
  const [editingDoc, setEditingDoc] = useState<any>(null);

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
      // Cargar Libros
      const qDocs = query(collection(db, "documents"), orderBy("createdAt", "desc"));
      const snapDocs = await getDocs(qDocs);
      setDocs(snapDocs.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));

      // Cargar Solicitudes
      const qReq = query(collection(db, "requests"), orderBy("createdAt", "desc"));
      const snapReq = await getDocs(qReq);
      setRequests(snapReq.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    } catch (e: any) {
      console.error("Error cargando datos:", e);
    }
  };

  // Función para guardar cambios de edición
  const handleUpdateDoc = async () => {
    if (!editingDoc) return;
    setLoading(true);
    try {
      const docRef = doc(db, "documents", editingDoc.id);
      await updateDoc(docRef, {
        title: editingDoc.title,
        isPublic: editingDoc.isPublic
      });
      alert("✅ Libro actualizado correctamente");
      setEditingDoc(null);
      loadData();
    } catch (e: any) {
      alert("❌ Error al actualizar: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para autorizar
  const authorizeUser = async (docId: string, emailOverride?: string, requestId?: string) => {
    const email = emailOverride || userEmailToAuthorize[docId]?.trim().toLowerCase();
    
    if (!email) return alert("Error: Correo no válido");
    
    setLoading(true);
    try {
      // 1. Agregamos el correo al documento
      await updateDoc(doc(db, "documents", docId), { authorizedEmails: arrayUnion(email) });
      
      // 2. Si venía de una solicitud pendiente, la borramos
      if (requestId) {
        await deleteDoc(doc(db, "requests", requestId));
      }

      alert(`✅ Acceso concedido a: ${email}`);
      
      if(!emailOverride) setUserEmailToAuthorize({ ...userEmailToAuthorize, [docId]: "" });
      
      loadData();
    } catch (e: any) { 
        alert("❌ Error al autorizar: " + e.message);
    } finally { setLoading(false); }
  };

  // --- NUEVA FUNCIÓN AGREGADA: REVOCAR ACCESO ---
  const revokeAccess = async (docId: string, email: string) => {
    if (!confirm(`¿Estás seguro de quitar el acceso a: ${email}?`)) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "documents", docId), {
        authorizedEmails: arrayRemove(email)
      });
      alert("🚫 Acceso eliminado correctamente");
      loadData();
    } catch (e: any) {
      alert("❌ Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Rechazar solicitud
  const rejectRequest = async (requestId: string) => {
      if(!confirm("¿Borrar esta solicitud?")) return;
      setLoading(true);
      try {
          await deleteDoc(doc(db, "requests", requestId));
          loadData();
      } catch(e: any) { alert("Error: " + e.message); }
      finally { setLoading(false); }
  };

  const uploadDoc = async () => {
    if (!title.trim()) return alert("⚠️ Escribe un título para el libro");
    if (!file) return alert("⚠️ No has seleccionado el archivo PDF");
    
    setLoading(true);
    try {
      let coverUrl = "";
      if (cover) {
        const coverPath = `covers/${Date.now()}_${cover.name}`;
        const coverRef = ref(storage, coverPath);
        await uploadBytes(coverRef, cover);
        coverUrl = await getDownloadURL(coverRef);
      }

      const pdfPath = `pdfs/${Date.now()}_${file.name}`;
      const pdfRef = ref(storage, pdfPath);
      await uploadBytes(pdfRef, file);
      const fileUrl = await getDownloadURL(pdfRef);

      await addDoc(collection(db, "documents"), {
        title: title.trim(),
        fileUrl: fileUrl,
        coverUrl: coverUrl,
        storagePath: pdfPath,
        isPublic: isPublic,
        authorizedEmails: [],
        createdAt: serverTimestamp(),
      });

      alert("🎉 ¡Libro publicado correctamente!");
      
      setTitle(""); setFile(null); setCover(null); setIsPublic(false);
      const pdfInput = document.getElementById("pdfInput") as HTMLInputElement;
      const coverInput = document.getElementById("coverInput") as HTMLInputElement;
      if(pdfInput) pdfInput.value = "";
      if(coverInput) coverInput.value = "";

      loadData();

    } catch (e: any) { 
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
    <main className="min-h-screen bg-[#fcfaf7] font-serif pb-20 relative">
      <Header />
      
      {/* MODAL EDICIÓN */}
      {editingDoc && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <h3 className="text-xl font-bold mb-6 text-gray-900">Editar Libro</h3>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-2">Título del Libro</label>
                <input 
                  value={editingDoc.title}
                  onChange={(e) => setEditingDoc({ ...editingDoc, title: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <input 
                  type="checkbox" 
                  checked={editingDoc.isPublic} 
                  onChange={(e) => setEditingDoc({ ...editingDoc, isPublic: e.target.checked })}
                  className="w-5 h-5 accent-amber-600 cursor-pointer"
                />
                <div>
                  <span className="block text-sm font-bold text-gray-900">Hacer Público</span>
                  <span className="text-[10px] text-gray-400">Si está marcado, todos pueden verlo sin permiso.</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setEditingDoc(null)}
                  className="flex-1 py-3 text-gray-500 font-bold text-xs uppercase hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleUpdateDoc}
                  disabled={loading}
                  className="flex-1 py-3 bg-black text-white font-bold text-xs uppercase rounded-xl hover:bg-amber-600 transition-colors shadow-lg"
                >
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-5xl font-bold text-gray-900 tracking-tighter mb-12 border-b border-amber-100 pb-10">Administración</h1>

        <div className="grid md:grid-cols-2 gap-10 mb-20">
          {/* SECCIÓN 01: LIBROS */}
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
                <div className={`relative h-24 bg-[#fcfaf7] border-2 border-dashed ${file ? 'border-green-500 bg-green-50' : 'border-amber-100'} rounded-2xl flex flex-col items-center justify-center`}>
                  <input id="pdfInput" type="file" accept="application/pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e)=>setFile(e.target.files?.[0]||null)} />
                  <span className={`text-[9px] font-bold uppercase ${file ? 'text-green-700' : 'text-amber-600'}`}>{file ? "PDF Listo" : "Subir PDF"}</span>
                </div>
                <div className={`relative h-24 bg-[#fcfaf7] border-2 border-dashed ${cover ? 'border-green-500 bg-green-50' : 'border-amber-100'} rounded-2xl flex flex-col items-center justify-center`}>
                  <input id="coverInput" type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e)=>setCover(e.target.files?.[0]||null)} />
                  <span className={`text-[9px] font-bold uppercase ${cover ? 'text-green-700' : 'text-amber-600'}`}>{cover ? "Portada Lista" : "Subir Portada"}</span>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer py-2">
                <input type="checkbox" checked={isPublic} onChange={(e)=>setIsPublic(e.target.checked)} className="accent-black" />
                <span className="text-[10px] font-bold uppercase text-gray-400">Hacer Público</span>
              </label>
              <button onClick={uploadDoc} disabled={loading} className="w-full py-4 bg-black text-white rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-all disabled:opacity-50">
                {loading ? "Subiendo..." : "Publicar Libro"}
              </button>
            </div>
          </div>

          {/* SECCIÓN 02: GALERÍA */}
          <div className="bg-white rounded-[3rem] p-8 shadow-2xl border border-amber-50">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-amber-700">
               <span className="w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center text-[10px]">02</span>
               Galería (Fotos)
            </h2>
            <div className="space-y-4">
              <div className="relative h-36 bg-amber-50/30 border-2 border-dashed border-amber-100 rounded-[2rem] flex flex-col items-center justify-center">
                <input id="galleryInput" type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e)=>setGalleryFile(e.target.files?.[0]||null)} />
                <span className="text-[10px] font-bold uppercase text-amber-600 px-4 text-center">{galleryFile ? galleryFile.name : "Subir Foto"}</span>
              </div>
              <input className="w-full bg-[#fcfaf7] rounded-2xl px-5 py-4 text-sm border border-gray-100 outline-none" placeholder="Descripción..." value={galleryDesc} onChange={(e)=>setGalleryDesc(e.target.value)} />
              <button onClick={uploadToGallery} disabled={loading} className="w-full py-4 bg-amber-600 text-white rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-all">
                {loading ? "Guardando..." : "Añadir a Galería"}
              </button>
            </div>
          </div>
        </div>

        {/* --- SECCIÓN 03: SOLICITUDES DE ACCESO --- */}
        {requests.length > 0 && (
          <div className="mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-amber-600 mb-8 flex items-center gap-4">
              Solicitudes Pendientes <span className="h-px flex-1 bg-amber-100"></span>
            </h3>
            <div className="grid gap-4">
              {requests.map((req) => (
                <div key={req.id} className="bg-amber-50 border border-amber-100 rounded-[2rem] p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 font-bold text-xs">
                       ?
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{req.userEmail}</p>
                      <p className="text-[10px] uppercase tracking-widest text-amber-600">
                        Solicita leer: <span className="font-bold">{req.bookTitle}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button 
                      onClick={() => authorizeUser(req.bookId, req.userEmail, req.id)}
                      className="flex-1 md:flex-none px-6 py-3 bg-green-600 text-white rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-green-700 transition-colors shadow-lg"
                    >
                      Dar Acceso
                    </button>
                    <button 
                      onClick={() => rejectRequest(req.id)}
                      className="flex-1 md:flex-none px-6 py-3 bg-white text-gray-400 border border-gray-200 rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      Ignorar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${d.isPublic ? 'bg-green-100 text-green-700' : 'bg-amber-50 text-amber-600'}`}>
                        {d.isPublic ? 'Público' : 'Privado'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-3 justify-end w-full md:w-auto">
                    <button 
                      onClick={() => setEditingDoc(d)}
                      className="flex-1 md:flex-none px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-blue-100 transition-colors"
                    >
                      Editar
                    </button>
                    
                    <button 
                      onClick={async () => { if(confirm('¿Eliminar definitivamente este libro?')) { await deleteDoc(doc(db, "documents", d.id)); loadData(); }}} 
                      className="flex-1 md:flex-none px-4 py-2 bg-red-50 text-red-500 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-red-100 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                
                {/* --- SECCIÓN NUEVA: LISTA DE USUARIOS AUTORIZADOS Y ELIMINAR --- */}
                {!d.isPublic && (
                   <div className="mt-6 pt-6 border-t border-gray-50">
                      <p className="text-[9px] font-black uppercase text-gray-400 mb-3 tracking-widest">Usuarios con acceso:</p>
                      
                      {/* Lista de correos autorizados con botón de borrar */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {d.authorizedEmails && d.authorizedEmails.length > 0 ? (
                          d.authorizedEmails.map((email: string) => (
                            <div key={email} className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full">
                               <span className="text-xs text-gray-600">{email}</span>
                               <button 
                                 onClick={() => revokeAccess(d.id, email)}
                                 className="w-4 h-4 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-[9px] font-bold hover:bg-red-500 hover:text-white transition-colors"
                                 title="Quitar acceso"
                               >
                                 ✕
                               </button>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-gray-300 italic">No hay usuarios asignados aún.</span>
                        )}
                      </div>

                      {/* Input para agregar manual */}
                      <div className="flex gap-2">
                        <input 
                          placeholder="Agregar correo manualmente..."
                          className="flex-1 bg-gray-50 px-4 py-2 rounded-lg text-xs outline-none"
                          value={userEmailToAuthorize[d.id] || ""}
                          onChange={(e) => setUserEmailToAuthorize({ ...userEmailToAuthorize, [d.id]: e.target.value })}
                        />
                        <button 
                          onClick={() => authorizeUser(d.id)}
                          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-[9px] font-bold uppercase hover:bg-amber-600"
                        >
                          Autorizar
                        </button>
                      </div>
                   </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}