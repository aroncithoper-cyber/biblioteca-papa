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
  arrayRemove,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

// Helper para YouTube
const getYouTubeID = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export default function AdminPage() {
  const ADMIN_EMAILS = ["aroncithoper@gmail.com", "e_perezleon@hotmail.com"];

  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [docs, setDocs] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]); 
  const [videos, setVideos] = useState<any[]>([]); 
  const [userEmailToAuthorize, setUserEmailToAuthorize] = useState<{ [key: string]: string }>({});
  const router = useRouter();

  // Estados Documentos
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(""); 
  const [file, setFile] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [isPublic, setIsPublic] = useState(false);

  // Estados Galería y Videos
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [galleryDesc, setGalleryDesc] = useState("");
  
  // VIDEOS
  const [vidTitle, setVidTitle] = useState("");
  const [vidDesc, setVidDesc] = useState("");
  const [vidLink, setVidLink] = useState("");
  const [vidCategory, setVidCategory] = useState(""); // NUEVO: Categoría de Video

  // Estados Notificaciones
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");

  // Edición
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
      const qDocs = query(collection(db, "documents"), orderBy("createdAt", "desc"));
      const snapDocs = await getDocs(qDocs);
      setDocs(snapDocs.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));

      const qReq = query(collection(db, "requests"), orderBy("createdAt", "desc"));
      const snapReq = await getDocs(qReq);
      setRequests(snapReq.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));

      const qVids = query(collection(db, "videos"), orderBy("createdAt", "desc"));
      const snapVids = await getDocs(qVids);
      setVideos(snapVids.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    } catch (e: any) { console.error("Error:", e); }
  };

  const handleUpdateDoc = async () => {
    if (!editingDoc) return;
    setLoading(true);
    try {
      const docRef = doc(db, "documents", editingDoc.id);
      await updateDoc(docRef, {
        title: editingDoc.title,
        isPublic: editingDoc.isPublic,
        category: editingDoc.category || "General"
      });
      alert("✅ Libro actualizado correctamente");
      setEditingDoc(null);
      loadData();
    } catch (e: any) { alert("Error: " + e.message); } 
    finally { setLoading(false); }
  };

  const authorizeUser = async (docId: string, emailOverride?: string, requestId?: string) => {
    const email = emailOverride || userEmailToAuthorize[docId]?.trim().toLowerCase();
    if (!email) return alert("Error: Correo no válido");
    
    let phoneNumber = "";
    let bookTitle = "el libro solicitado";
    
    if (requestId) {
        const reqData = requests.find(r => r.id === requestId);
        if (reqData) {
            phoneNumber = reqData.whatsapp ? reqData.whatsapp.replace(/\D/g, '') : "";
            bookTitle = reqData.bookTitle || bookTitle;
        }
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, "documents", docId), { authorizedEmails: arrayUnion(email) });
      if (requestId) await deleteDoc(doc(db, "requests", requestId));

      if (phoneNumber) {
          const message = `¡Paz a vosotros! 🕊️\n\nTu solicitud para acceder al libro *"${bookTitle}"* ha sido APROBADA.\n\nYa puedes entrar a leerlo aquí:\nhttps://consejero-del-obrero.vercel.app/biblioteca\n\n¡Bendiciones!`;
          window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
      }
      alert(`✅ Acceso concedido a: ${email}`);
      if(!emailOverride) setUserEmailToAuthorize({ ...userEmailToAuthorize, [docId]: "" });
      loadData();
    } catch (e: any) { alert("Error: " + e.message); } 
    finally { setLoading(false); }
  };

  const revokeAccess = async (docId: string, email: string) => {
    if (!confirm(`¿Quitar acceso a: ${email}?`)) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "documents", docId), { authorizedEmails: arrayRemove(email) });
      loadData();
    } catch (e: any) { alert("Error: " + e.message); } 
    finally { setLoading(false); }
  };

  const rejectRequest = async (requestId: string) => {
      if(!confirm("¿Borrar solicitud?")) return;
      setLoading(true);
      try { await deleteDoc(doc(db, "requests", requestId)); loadData(); } 
      catch(e: any) { alert("Error: " + e.message); }
      finally { setLoading(false); }
  };

  const uploadDoc = async () => {
    if (!title.trim()) return alert("⚠️ Escribe un título");
    if (!file) return alert("⚠️ Selecciona el PDF");
    
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
        category: category.trim() || "General",
        authorizedEmails: [],
        createdAt: serverTimestamp(),
      });

      alert("🎉 ¡Libro publicado!");
      setTitle(""); setCategory(""); setFile(null); setCover(null); setIsPublic(false);
      (document.getElementById("pdfInput") as HTMLInputElement).value = "";
      (document.getElementById("coverInput") as HTMLInputElement).value = "";
      loadData();
    } catch (e: any) { alert("Error: " + e.message); } 
    finally { setLoading(false); }
  };

  const uploadToGallery = async () => {
    if (!galleryFile) return alert("⚠️ Selecciona una foto");
    setLoading(true);
    try {
      const path = `gallery/${Date.now()}_${galleryFile.name}`;
      const imgRef = ref(storage, path);
      await uploadBytes(imgRef, galleryFile);
      const url = await getDownloadURL(imgRef);
      await addDoc(collection(db, "gallery"), { url, description: galleryDesc, createdAt: serverTimestamp() });
      alert("📸 Foto añadida");
      setGalleryFile(null); setGalleryDesc("");
      (document.getElementById("galleryInput") as HTMLInputElement).value = "";
      loadData();
    } catch (e: any) { alert("Error: " + e.message); } 
    finally { setLoading(false); }
  };

  const uploadVideo = async () => {
    if (!vidTitle.trim() || !vidLink.trim()) return alert("Faltan datos del video");
    const youtubeId = getYouTubeID(vidLink);
    if (!youtubeId) return alert("Link de YouTube inválido");

    setLoading(true);
    try {
      await addDoc(collection(db, "videos"), {
        title: vidTitle, 
        description: vidDesc, 
        youtubeId, 
        category: vidCategory.trim() || "General", // GUARDAR CATEGORÍA
        createdAt: serverTimestamp()
      });
      alert("🎥 Video agregado");
      setVidTitle(""); setVidDesc(""); setVidLink(""); setVidCategory("");
      loadData();
    } catch (e: any) { alert("Error: " + e.message); } 
    finally { setLoading(false); }
  };

  const deleteVideo = async (id: string) => {
    if(!confirm("¿Borrar video?")) return;
    setLoading(true);
    try { await deleteDoc(doc(db, "videos", id)); loadData(); } 
    catch(e: any) { alert("Error: " + e.message); }
    finally { setLoading(false); }
  };

  const sendPushNotification = async () => {
    if (!notifTitle.trim() || !notifBody.trim()) return alert("⚠️ Escribe título y mensaje.");
    if (!confirm(`¿Enviar a TODOS?\n\n"${notifTitle}"`)) return;

    setLoading(true);
    try {
      const res = await fetch("/api/send-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: notifTitle, body: notifBody }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ Enviado con éxito.\nDispositivos: ${data.sentCount || 0}`);
        setNotifTitle(""); setNotifBody("");
      } else { alert("Error: " + (data.error || "Desconocido")); }
    } catch (e: any) { alert("Error conexión: " + e.message); } 
    finally { setLoading(false); }
  };

  if (!isAdmin) return <div className="min-h-screen bg-[#fcfaf7] flex items-center justify-center"><p className="animate-pulse">Verificando...</p></div>;

  return (
    <main className="min-h-screen bg-[#fcfaf7] font-serif pb-20 relative">
      <Header />
      
      {/* MODAL EDICIÓN LIBROS */}
      {editingDoc && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <h3 className="text-xl font-bold mb-6 text-gray-900">Editar Libro</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-2">Título</label>
                <input 
                  value={editingDoc.title}
                  onChange={(e) => setEditingDoc({ ...editingDoc, title: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-2">Categoría (Carpeta)</label>
                <input 
                  value={editingDoc.category || ""}
                  onChange={(e) => setEditingDoc({ ...editingDoc, category: e.target.value })}
                  placeholder="Ej: Ampliación, Himnario..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                />
              </div>
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <input 
                  type="checkbox" 
                  checked={editingDoc.isPublic} 
                  onChange={(e) => setEditingDoc({ ...editingDoc, isPublic: e.target.checked })}
                  className="w-5 h-5 accent-amber-600 cursor-pointer"
                />
                <span className="text-sm font-bold text-gray-900">Hacer Público</span>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingDoc(null)} className="flex-1 py-3 text-gray-500 font-bold text-xs uppercase hover:bg-gray-100 rounded-xl">Cancelar</button>
                <button onClick={handleUpdateDoc} disabled={loading} className="flex-1 py-3 bg-black text-white font-bold text-xs uppercase rounded-xl hover:bg-amber-600 shadow-lg">{loading ? "..." : "Guardar"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-5xl font-bold text-gray-900 tracking-tighter mb-12 border-b border-amber-100 pb-10">Administración</h1>

        <div className="grid md:grid-cols-2 gap-10 mb-10">
          {/* SECCIÓN 01: NUEVO LIBRO */}
          <div className="bg-white rounded-[3rem] p-8 shadow-2xl border border-amber-50">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
               <span className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-[10px]">01</span>
               Nuevo Volumen
            </h2>
            <div className="space-y-4">
              <input className="w-full bg-[#fcfaf7] rounded-2xl px-5 py-4 text-sm border border-gray-100 outline-none" placeholder="Título del Libro..." value={title} onChange={(e) => setTitle(e.target.value)} />
              
              <input className="w-full bg-[#fcfaf7] rounded-2xl px-5 py-4 text-sm border border-gray-100 outline-none" placeholder="Categoría (Ej: Ampliación de Lecciones)..." value={category} onChange={(e) => setCategory(e.target.value)} />

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
               Galería
            </h2>
            <div className="space-y-4">
              <div className="relative h-36 bg-amber-50/30 border-2 border-dashed border-amber-100 rounded-[2rem] flex flex-col items-center justify-center">
                <input id="galleryInput" type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e)=>setGalleryFile(e.target.files?.[0]||null)} />
                <span className="text-[10px] font-bold uppercase text-amber-600 px-4 text-center">{galleryFile ? galleryFile.name : "Subir Foto"}</span>
              </div>
              <input className="w-full bg-[#fcfaf7] rounded-2xl px-5 py-4 text-sm border border-gray-100 outline-none" placeholder="Descripción..." value={galleryDesc} onChange={(e)=>setGalleryDesc(e.target.value)} />
              <button onClick={uploadToGallery} disabled={loading} className="w-full py-4 bg-amber-600 text-white rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-all">
                {loading ? "..." : "Añadir a Galería"}
              </button>
            </div>
          </div>
        </div>

        {/* --- GRID MEDIO --- */}
        <div className="grid md:grid-cols-2 gap-10 mb-20">
            {/* SECCIÓN 03: VIDEOS */}
            <div className="bg-white rounded-[3rem] p-8 shadow-2xl border border-red-50">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-red-700">
                    <span className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px]">03</span>
                    Videos
                </h2>
                <div className="space-y-4">
                    <div className="space-y-4">
                        <input className="w-full bg-[#fcfaf7] rounded-2xl px-5 py-4 text-sm border border-gray-100 outline-none" placeholder="Título" value={vidTitle} onChange={(e)=>setVidTitle(e.target.value)} />
                        <input className="w-full bg-[#fcfaf7] rounded-2xl px-5 py-4 text-sm border border-gray-100 outline-none" placeholder="Descripción" value={vidDesc} onChange={(e)=>setVidDesc(e.target.value)} />
                        
                        {/* INPUT PARA CATEGORÍA DE VIDEO */}
                        <input className="w-full bg-[#fcfaf7] rounded-2xl px-5 py-4 text-sm border border-gray-100 outline-none" placeholder="Categoría (Ej: Estudios, Himnos...)" value={vidCategory} onChange={(e)=>setVidCategory(e.target.value)} />
                        
                        <input className="w-full bg-[#fcfaf7] rounded-2xl px-5 py-4 text-sm border border-gray-100 outline-none" placeholder="Link de YouTube" value={vidLink} onChange={(e)=>setVidLink(e.target.value)} />
                        <button onClick={uploadVideo} disabled={loading} className="w-full py-4 bg-red-600 text-white rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-all">
                            {loading ? "..." : "Agregar Video"}
                        </button>
                    </div>
                    <div className="bg-[#fcfaf7] rounded-2xl p-4 h-48 overflow-y-auto custom-scrollbar">
                        <div className="space-y-3">
                            {videos.map(v => (
                                <div key={v.id} className="bg-white p-3 rounded-xl border border-gray-100 flex gap-3 items-center shadow-sm">
                                    <img src={`https://img.youtube.com/vi/${v.youtubeId}/default.jpg`} className="w-10 h-10 rounded object-cover" alt="" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold truncate">{v.title}</p>
                                        <p className="text-[9px] text-gray-500 uppercase">{v.category || "General"}</p>
                                    </div>
                                    <button onClick={()=>deleteVideo(v.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full font-bold text-xs">✕</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 04: NOTIFICACIONES */}
            <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-[3rem] p-8 shadow-2xl text-white">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <span className="w-8 h-8 bg-white text-indigo-900 rounded-full flex items-center justify-center text-[10px]">04</span>
                    Enviar Notificación
                </h2>
                <div className="space-y-5">
                    <input className="w-full bg-white/10 text-white placeholder-blue-300 rounded-2xl px-5 py-4 text-sm border border-white/20 outline-none" placeholder="Título" value={notifTitle} onChange={(e)=>setNotifTitle(e.target.value)} />
                    <textarea className="w-full bg-white/10 text-white placeholder-blue-300 rounded-2xl px-5 py-4 text-sm border border-white/20 outline-none h-32 resize-none" placeholder="Mensaje" value={notifBody} onChange={(e)=>setNotifBody(e.target.value)} />
                    <button onClick={sendPushNotification} disabled={loading} className="w-full py-4 bg-white text-indigo-900 rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-blue-100 transition-all shadow-lg flex items-center justify-center gap-2">
                        {loading ? "..." : <><span>🚀</span> Enviar a Todos</>}
                    </button>
                </div>
            </div>
        </div>

        {/* --- LISTADO DE LIBROS Y SOLICITUDES --- */}
        {requests.length > 0 && (
          <div className="mb-20">
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-amber-600 mb-8 flex items-center gap-4">
              Solicitudes <span className="h-px flex-1 bg-amber-100"></span>
            </h3>
            <div className="grid gap-4">
              {requests.map((req) => (
                <div key={req.id} className="bg-amber-50 border border-amber-100 rounded-[2rem] p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 font-bold text-xs">?</div>
                    <div>
                      <p className="font-bold text-gray-900">{req.userEmail}</p>
                      <p className="text-[10px] uppercase tracking-widest text-amber-600">Libro: {req.bookTitle}</p>
                      {req.whatsapp && <p className="text-[9px] text-green-600 font-bold">📞 {req.whatsapp}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => authorizeUser(req.bookId, req.userEmail, req.id)} className="px-6 py-3 bg-green-600 text-white rounded-full text-[9px] font-bold uppercase hover:bg-green-700 shadow-lg">Aceptar</button>
                    <button onClick={() => rejectRequest(req.id)} className="px-6 py-3 bg-white text-red-400 border border-gray-200 rounded-full text-[9px] font-bold uppercase hover:bg-red-50">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                      <div className="flex gap-2 mt-1">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${d.isPublic ? 'bg-green-100 text-green-700' : 'bg-amber-50 text-amber-600'}`}>
                            {d.isPublic ? 'Público' : 'Privado'}
                          </span>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest bg-gray-100 text-gray-500">
                            {d.category || "General"}
                          </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-3 justify-end w-full md:w-auto">
                    <button onClick={() => setEditingDoc(d)} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-blue-100">Editar</button>
                    <button onClick={async () => { if(confirm('¿Eliminar?')) { await deleteDoc(doc(db, "documents", d.id)); loadData(); }}} className="px-4 py-2 bg-red-50 text-red-500 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-red-100">Eliminar</button>
                  </div>
                </div>
                
                {!d.isPublic && (
                    <div className="mt-6 pt-6 border-t border-gray-50">
                      <p className="text-[9px] font-black uppercase text-gray-400 mb-3 tracking-widest">Usuarios con acceso:</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {d.authorizedEmails?.map((email: string) => (
                            <div key={email} className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full">
                               <span className="text-xs text-gray-600">{email}</span>
                               <button onClick={() => revokeAccess(d.id, email)} className="w-4 h-4 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-[9px] font-bold hover:bg-red-500 hover:text-white">✕</button>
                            </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input placeholder="Agregar correo..." className="flex-1 bg-gray-50 px-4 py-2 rounded-lg text-xs outline-none" value={userEmailToAuthorize[d.id] || ""} onChange={(e) => setUserEmailToAuthorize({ ...userEmailToAuthorize, [d.id]: e.target.value })} />
                        <button onClick={() => authorizeUser(d.id)} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-[9px] font-bold uppercase hover:bg-amber-600">Autorizar</button>
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