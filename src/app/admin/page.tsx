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
import AdminTabs, { type AdminTabId } from "@/components/admin/AdminTabs";
import { isAdminEmail } from "@/lib/adminEmails";
import { getPushTemplate, PUSH_TEMPLATES } from "@/lib/pushTemplates";
import { pickSuggestedPushMessage } from "@/lib/pushMessageBank";
import {
  type BookRequest,
  type ApprovedNotifyFilter,
  buildAuthorizationMessage,
  buildWhatsAppUrl,
  formatRequestTimestamp,
  getRequestStatus,
  getRequestUserName,
  isRequestNotified,
  matchesApprovedNotifyFilter,
  normalizeWhatsAppNumber,
  requestMatchesSearch,
  type BookRequestStatus,
} from "@/lib/bookRequests";

// Helper para YouTube
const getYouTubeID = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [docs, setDocs] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]); 
  const [videos, setVideos] = useState<any[]>([]); 
  const [ensenanzas, setEnsenanzas] = useState<any[]>([]);
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
  const [vidCategory, setVidCategory] = useState(""); 

  // ENSEÑANZAS (solo links — sin subir audios)
  // TODO: Las reglas de Firestore deben restringir escritura en `ensenanzas` solo a admins.
  const [ensTitle, setEnsTitle] = useState("");
  const [ensDesc, setEnsDesc] = useState("");
  const [ensCategory, setEnsCategory] = useState("");
  const [ensPredicador, setEnsPredicador] = useState("");
  const [ensFecha, setEnsFecha] = useState("");
  const [ensDuration, setEnsDuration] = useState("");
  const [ensTelegram, setEnsTelegram] = useState("");
  const [ensYoutube, setEnsYoutube] = useState("");
  const [ensStatus, setEnsStatus] = useState<"published" | "coming_soon">("published");
  const [ensOrder, setEnsOrder] = useState("0");

  // Estados Notificaciones
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");
  const [pushTemplateId, setPushTemplateId] = useState("");

  // ESTADOS DE EDICIÓN
  const [editingDoc, setEditingDoc] = useState<any>(null); // Para editar libros
  const [editingVideo, setEditingVideo] = useState<any>(null); // Para editar videos
  const [editingEnsenanza, setEditingEnsenanza] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<AdminTabId>("libros");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [requestFilter, setRequestFilter] = useState<BookRequestStatus | "todas">("pendiente");
  const [approvedNotifyFilter, setApprovedNotifyFilter] = useState<ApprovedNotifyFilter>("todas");
  const [requestSearch, setRequestSearch] = useState("");
  const [copiedRequestId, setCopiedRequestId] = useState<string | null>(null);
  const [copiedWhatsAppId, setCopiedWhatsAppId] = useState<string | null>(null);
  const [adminNotice, setAdminNotice] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showAdminNotice = (message: string, type: "success" | "error" = "success") => {
    setAdminNotice({ message, type });
  };

  useEffect(() => {
    if (!adminNotice) return;
    const timer = setTimeout(() => setAdminNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [adminNotice]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleTabChange = (tab: AdminTabId) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user || !isAdminEmail(user.email)) {
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

      const qEns = query(collection(db, "ensenanzas"), orderBy("createdAt", "desc"));
      const snapEns = await getDocs(qEns);
      setEnsenanzas(snapEns.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    } catch (e: any) { console.error("Error:", e); }
  };

  // --- ACTUALIZAR LIBRO ---
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

  // --- ACTUALIZAR VIDEO (NUEVO) ---
  const handleUpdateVideo = async () => {
    if (!editingVideo) return;
    
    // Si cambió el link, validamos el ID nuevo
    let newYoutubeId = editingVideo.youtubeId;
    if (editingVideo.newLink) {
        const extractedId = getYouTubeID(editingVideo.newLink);
        if (extractedId) newYoutubeId = extractedId;
        else return alert("Link de YouTube inválido");
    }

    setLoading(true);
    try {
      const vidRef = doc(db, "videos", editingVideo.id);
      await updateDoc(vidRef, {
        title: editingVideo.title,
        description: editingVideo.description,
        category: editingVideo.category || "General",
        youtubeId: newYoutubeId
      });
      alert("✅ Video actualizado correctamente");
      setEditingVideo(null);
      loadData();
    } catch (e: any) { alert("Error: " + e.message); } 
    finally { setLoading(false); }
  };

  const authorizeUser = async (docId: string, emailOverride?: string, requestId?: string) => {
    const email = emailOverride || userEmailToAuthorize[docId]?.trim().toLowerCase();
    if (!email) {
      showAdminNotice("Correo no válido.", "error");
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, "documents", docId), { authorizedEmails: arrayUnion(email) });

      if (requestId) {
        await updateDoc(doc(db, "requests", requestId), {
          status: "aprobada",
          approvedAt: serverTimestamp(),
          approvedBy: auth.currentUser?.email || "",
        });
        setRequestFilter("aprobada");
        setApprovedNotifyFilter("no_avisadas");
        showAdminNotice("Solicitud aprobada. Ahora puedes avisar por WhatsApp.");
      } else {
        showAdminNotice("Acceso autorizado correctamente.");
      }

      if (!emailOverride) setUserEmailToAuthorize({ ...userEmailToAuthorize, [docId]: "" });
      loadData();
    } catch {
      showAdminNotice("No se pudo autorizar el acceso. Intenta nuevamente.", "error");
    } finally {
      setLoading(false);
    }
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
    if (!confirm("¿Rechazar esta solicitud?")) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "requests", requestId), { status: "rechazada" });
      showAdminNotice("Solicitud rechazada.");
      loadData();
    } catch {
      showAdminNotice("No se pudo rechazar la solicitud. Intenta nuevamente.", "error");
    } finally {
      setLoading(false);
    }
  };

  const copyAuthorizationMessage = async (req: BookRequest) => {
    const message = buildAuthorizationMessage(
      req.bookTitle || "el libro solicitado",
      getRequestUserName(req) || undefined
    );
    try {
      await navigator.clipboard.writeText(message);
      setCopiedRequestId(req.id);
      setTimeout(() => setCopiedRequestId(null), 2500);
      showAdminNotice("Mensaje copiado al portapapeles.");
    } catch {
      showAdminNotice("No se pudo copiar el mensaje.", "error");
    }
  };

  const copyWhatsAppNumber = async (req: BookRequest) => {
    const normalized = normalizeWhatsAppNumber(req.whatsapp);
    if (!normalized) return;
    try {
      await navigator.clipboard.writeText(normalized);
      setCopiedWhatsAppId(req.id);
      setTimeout(() => setCopiedWhatsAppId(null), 2500);
      showAdminNotice("Número de WhatsApp copiado.");
    } catch {
      showAdminNotice("No se pudo copiar el número.", "error");
    }
  };

  const openWhatsAppNotice = (req: BookRequest) => {
    const message = buildAuthorizationMessage(
      req.bookTitle || "el libro solicitado",
      getRequestUserName(req) || undefined
    );
    const url = buildWhatsAppUrl(req.whatsapp, message);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const markRequestNotified = async (requestId: string) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, "requests", requestId), {
        notifiedAt: serverTimestamp(),
        notifiedBy: auth.currentUser?.email || "",
      });
      showAdminNotice("Marcado como avisado.");
      loadData();
    } catch {
      showAdminNotice("No se pudo guardar el aviso. Intenta nuevamente.", "error");
    } finally {
      setLoading(false);
    }
  };

  const pendingRequestsCount = requests.filter(
    (r) => getRequestStatus(r as BookRequest) === "pendiente"
  ).length;

  const filteredRequests = requests.filter((r) => {
    const req = r as BookRequest;
    const status = getRequestStatus(req);
    if (requestFilter !== "todas" && status !== requestFilter) return false;
    if (requestFilter === "aprobada" && !matchesApprovedNotifyFilter(req, approvedNotifyFilter)) {
      return false;
    }
    return requestMatchesSearch(req, requestSearch);
  });

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
        category: vidCategory.trim() || "General", 
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

  const uploadEnsenanza = async () => {
    if (!ensTitle.trim()) return alert("⚠️ Escribe un título");

    setLoading(true);
    try {
      await addDoc(collection(db, "ensenanzas"), {
        title: ensTitle.trim(),
        description: ensDesc.trim(),
        category: ensCategory.trim() || "General",
        predicador: ensPredicador.trim(),
        fecha: ensFecha.trim(),
        duration: ensDuration.trim(),
        telegram_url: ensTelegram.trim(),
        youtube_url: ensYoutube.trim(),
        status: ensStatus,
        order: parseInt(ensOrder, 10) || 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      alert("🎧 Enseñanza publicada");
      setEnsTitle("");
      setEnsDesc("");
      setEnsCategory("");
      setEnsPredicador("");
      setEnsFecha("");
      setEnsDuration("");
      setEnsTelegram("");
      setEnsYoutube("");
      setEnsStatus("published");
      setEnsOrder("0");
      loadData();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEnsenanza = async () => {
    if (!editingEnsenanza) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, "ensenanzas", editingEnsenanza.id), {
        title: editingEnsenanza.title,
        description: editingEnsenanza.description || "",
        category: editingEnsenanza.category || "General",
        predicador: editingEnsenanza.predicador || "",
        fecha: editingEnsenanza.fecha || "",
        duration: editingEnsenanza.duration || "",
        telegram_url: (editingEnsenanza.telegram_url || "").trim(),
        youtube_url: (editingEnsenanza.youtube_url || "").trim(),
        status: editingEnsenanza.status || "published",
        order: parseInt(String(editingEnsenanza.order ?? 0), 10) || 0,
        updatedAt: serverTimestamp(),
      });
      alert("✅ Enseñanza actualizada");
      setEditingEnsenanza(null);
      loadData();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteEnsenanza = async (id: string) => {
    if (!confirm("¿Borrar enseñanza?")) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, "ensenanzas", id));
      loadData();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const applyPushTemplate = (templateId: string) => {
    setPushTemplateId(templateId);
    if (!templateId) return;
    const template = getPushTemplate(templateId);
    if (template) {
      setNotifTitle(template.title);
      setNotifBody(template.body);
    }
  };

  const applySuggestedPushMessage = () => {
    const suggestion = pickSuggestedPushMessage(pushTemplateId);
    if (!suggestion) return;
    setNotifTitle(suggestion.title);
    setNotifBody(suggestion.body);
  };

  const sendPushNotification = async () => {
    if (!notifTitle.trim() || !notifBody.trim()) return alert("⚠️ Escribe título y mensaje.");
    if (!confirm(`¿Enviar a TODOS?\n\n"${notifTitle}"`)) return;

    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        alert("Sesión expirada. Vuelve a iniciar sesión.");
        return;
      }

      const res = await fetch("/api/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: notifTitle, body: notifBody }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ Enviado con éxito.\nDispositivos: ${data.sentCount || 0}`);
        setNotifTitle("");
        setNotifBody("");
        setPushTemplateId("");
      } else if (res.status === 401) {
        alert("Sesión inválida o expirada. Vuelve a iniciar sesión.");
      } else if (res.status === 403) {
        alert("No tienes permiso para enviar notificaciones.");
      } else {
        alert("Error: " + (data.error || "Desconocido"));
      }
    } catch (e: any) { alert("Error conexión: " + e.message); }
    finally { setLoading(false); }
  };

  if (!isAdmin) return <div className="min-h-screen bg-[#fcfaf7] flex items-center justify-center"><p className="animate-pulse">Verificando...</p></div>;

  return (
    <main className="min-h-screen bg-[#fcfaf7] font-serif pb-20 relative overflow-x-hidden">
      <Header />
      
      {/* --- MODAL EDICIÓN LIBROS --- */}
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
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-2">Categoría</label>
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

      {/* --- MODAL EDICIÓN VIDEOS (NUEVO) --- */}
      {editingVideo && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <h3 className="text-xl font-bold mb-6 text-red-900">Editar Video</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-2">Título</label>
                <input 
                  value={editingVideo.title}
                  onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-2">Descripción</label>
                <input 
                  value={editingVideo.description}
                  onChange={(e) => setEditingVideo({ ...editingVideo, description: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-2">Categoría</label>
                <input 
                  value={editingVideo.category || ""}
                  onChange={(e) => setEditingVideo({ ...editingVideo, category: e.target.value })}
                  placeholder="Ej: Estudios, Himnos..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-2">Link YouTube (Opcional si quieres cambiarlo)</label>
                <input 
                  placeholder="Pegar nuevo link..."
                  onChange={(e) => setEditingVideo({ ...editingVideo, newLink: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingVideo(null)} className="flex-1 py-3 text-gray-500 font-bold text-xs uppercase hover:bg-gray-100 rounded-xl">Cancelar</button>
                <button onClick={handleUpdateVideo} disabled={loading} className="flex-1 py-3 bg-red-600 text-white font-bold text-xs uppercase rounded-xl hover:bg-red-800 shadow-lg">{loading ? "..." : "Guardar"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL EDICIÓN ENSEÑANZAS --- */}
      {editingEnsenanza && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-[2rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-300 my-8">
            <h3 className="text-xl font-bold mb-6 text-amber-900">Editar Enseñanza</h3>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
              <input
                value={editingEnsenanza.title}
                onChange={(e) => setEditingEnsenanza({ ...editingEnsenanza, title: e.target.value })}
                placeholder="Título"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none"
              />
              <textarea
                value={editingEnsenanza.description || ""}
                onChange={(e) => setEditingEnsenanza({ ...editingEnsenanza, description: e.target.value })}
                placeholder="Descripción"
                rows={3}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none resize-none"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={editingEnsenanza.category || ""}
                  onChange={(e) => setEditingEnsenanza({ ...editingEnsenanza, category: e.target.value })}
                  placeholder="Categoría"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                />
                <input
                  value={editingEnsenanza.predicador || ""}
                  onChange={(e) => setEditingEnsenanza({ ...editingEnsenanza, predicador: e.target.value })}
                  placeholder="Predicador"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={editingEnsenanza.fecha || ""}
                  onChange={(e) => setEditingEnsenanza({ ...editingEnsenanza, fecha: e.target.value })}
                  placeholder="Fecha (ej. Mar 2025)"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                />
                <input
                  value={editingEnsenanza.duration || ""}
                  onChange={(e) => setEditingEnsenanza({ ...editingEnsenanza, duration: e.target.value })}
                  placeholder="Duración (ej. 45 min)"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                />
              </div>
              <input
                value={editingEnsenanza.telegram_url || ""}
                onChange={(e) => setEditingEnsenanza({ ...editingEnsenanza, telegram_url: e.target.value })}
                placeholder="Link de Telegram (mensaje o canal)"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none"
              />
              <input
                value={editingEnsenanza.youtube_url || ""}
                onChange={(e) => setEditingEnsenanza({ ...editingEnsenanza, youtube_url: e.target.value })}
                placeholder="Link de YouTube (opcional)"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={editingEnsenanza.status || "published"}
                  onChange={(e) => setEditingEnsenanza({ ...editingEnsenanza, status: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none min-h-[44px]"
                >
                  <option value="published">Publicado</option>
                  <option value="coming_soon">Próximamente</option>
                </select>
                <input
                  type="number"
                  value={editingEnsenanza.order ?? 0}
                  onChange={(e) => setEditingEnsenanza({ ...editingEnsenanza, order: e.target.value })}
                  placeholder="Orden"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditingEnsenanza(null)} className="flex-1 py-3 text-gray-500 font-bold text-xs uppercase hover:bg-gray-100 rounded-xl">Cancelar</button>
                <button onClick={handleUpdateEnsenanza} disabled={loading} className="flex-1 py-3 bg-amber-700 text-white font-bold text-xs uppercase rounded-xl hover:bg-amber-900 shadow-lg">{loading ? "..." : "Guardar"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tighter mb-6 md:mb-8 border-b border-amber-100 pb-6 md:pb-8">
          Administración
        </h1>

        <AdminTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          counts={{
            libros: docs.length,
            videos: videos.length,
            ensenanzas: ensenanzas.length,
            solicitudes: pendingRequestsCount,
          }}
        />

        {adminNotice && (
          <p
            role="status"
            className={`mt-4 rounded-xl border px-4 py-3 text-xs animate-in fade-in duration-300 ${
              adminNotice.type === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {adminNotice.message}
          </p>
        )}

        <div className="mt-6 md:mt-8 min-w-0">
          {/* TAB: LIBROS */}
          {activeTab === "libros" && (
            <div className="space-y-8 md:space-y-10">
              <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-8 shadow-2xl border border-amber-50">
                <h2 className="text-lg md:text-xl font-bold mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-[10px]">01</span>
                  Nuevo Volumen
                </h2>
                <div className="space-y-4">
                  <input className="w-full bg-[#fcfaf7] rounded-2xl px-5 py-4 min-h-[44px] text-sm border border-gray-100 outline-none" placeholder="Título del Libro..." value={title} onChange={(e) => setTitle(e.target.value)} />
                  <input className="w-full bg-[#fcfaf7] rounded-2xl px-5 py-4 min-h-[44px] text-sm border border-gray-100 outline-none" placeholder="Categoría (Ej: Ampliación de Lecciones)..." value={category} onChange={(e) => setCategory(e.target.value)} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={`relative min-h-[96px] bg-[#fcfaf7] border-2 border-dashed ${file ? "border-green-500 bg-green-50" : "border-amber-100"} rounded-2xl flex flex-col items-center justify-center`}>
                      <input id="pdfInput" type="file" accept="application/pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                      <span className={`text-[9px] font-bold uppercase ${file ? "text-green-700" : "text-amber-600"}`}>{file ? "PDF Listo" : "Subir PDF"}</span>
                    </div>
                    <div className={`relative min-h-[96px] bg-[#fcfaf7] border-2 border-dashed ${cover ? "border-green-500 bg-green-50" : "border-amber-100"} rounded-2xl flex flex-col items-center justify-center`}>
                      <input id="coverInput" type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setCover(e.target.files?.[0] || null)} />
                      <span className={`text-[9px] font-bold uppercase ${cover ? "text-green-700" : "text-amber-600"}`}>{cover ? "Portada Lista" : "Subir Portada"}</span>
                    </div>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer py-2 min-h-[44px]">
                    <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="accent-black w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase text-gray-400">Hacer Público</span>
                  </label>
                  <button onClick={uploadDoc} disabled={loading} className="w-full min-h-[44px] py-4 bg-black text-white rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-all disabled:opacity-50">
                    {loading ? "Subiendo..." : "Publicar Libro"}
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400 mb-6 flex items-center gap-4">
                  Archivo Existente ({docs.length}) <span className="h-px flex-1 bg-amber-100"></span>
                </h3>
                {docs.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-12 bg-white rounded-[2rem] border border-amber-50">
                    Aún no hay libros publicados. Usa el formulario de arriba para agregar el primero.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {docs.map((d) => (
                      <div key={d.id} className="bg-white border border-amber-50 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 shadow-sm">
                        <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
                          <div className="flex items-center gap-4 min-w-0">
                            {d.coverUrl ? (
                              <img src={d.coverUrl} className="w-14 h-14 md:w-16 md:h-16 rounded-xl object-cover border border-gray-200 flex-shrink-0" alt="Portada" />
                            ) : (
                              <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-[10px] font-bold flex-shrink-0">Sin Foto</div>
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-lg md:text-xl text-gray-900 truncate">{d.title}</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${d.isPublic ? "bg-green-100 text-green-700" : "bg-amber-50 text-amber-600"}`}>
                                  {d.isPublic ? "Público" : "Privado"}
                                </span>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest bg-gray-100 text-gray-500">
                                  {d.category || "General"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 w-full md:w-auto">
                            <button onClick={() => setEditingDoc(d)} className="flex-1 md:flex-none min-h-[44px] px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-blue-100">Editar</button>
                            <button onClick={async () => { if (confirm("¿Eliminar?")) { await deleteDoc(doc(db, "documents", d.id)); loadData(); } }} className="flex-1 md:flex-none min-h-[44px] px-4 py-2.5 bg-red-50 text-red-500 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-red-100">Eliminar</button>
                          </div>
                        </div>
                        {!d.isPublic && (
                          <div className="mt-6 pt-6 border-t border-gray-50">
                            <p className="text-[9px] font-black uppercase text-gray-400 mb-3 tracking-widest">Usuarios con acceso:</p>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {d.authorizedEmails?.map((email: string) => (
                                <div key={email} className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full max-w-full">
                                  <span className="text-xs text-gray-600 truncate">{email}</span>
                                  <button onClick={() => revokeAccess(d.id, email)} className="min-w-[28px] min-h-[28px] bg-red-100 text-red-500 rounded-full flex items-center justify-center text-[9px] font-bold hover:bg-red-500 hover:text-white flex-shrink-0">✕</button>
                                </div>
                              ))}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input placeholder="Agregar correo..." className="flex-1 w-full bg-gray-50 px-4 py-3 min-h-[44px] rounded-lg text-xs outline-none" value={userEmailToAuthorize[d.id] || ""} onChange={(e) => setUserEmailToAuthorize({ ...userEmailToAuthorize, [d.id]: e.target.value })} />
                              <button onClick={() => authorizeUser(d.id)} className="min-h-[44px] px-4 py-2.5 bg-gray-900 text-white rounded-lg text-[9px] font-bold uppercase hover:bg-amber-600 sm:flex-shrink-0">Autorizar</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: VIDEOS */}
          {activeTab === "videos" && (
            <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-8 shadow-2xl border border-red-50">
              <h2 className="text-lg md:text-xl font-bold mb-6 flex items-center gap-3 text-red-700">
                <span className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px]">03</span>
                Videos
              </h2>
              <div className="space-y-6">
                <div className="space-y-4 max-w-xl">
                  <input className="w-full bg-[#fcfaf7] rounded-2xl px-5 py-4 min-h-[44px] text-sm border border-gray-100 outline-none" placeholder="Título" value={vidTitle} onChange={(e) => setVidTitle(e.target.value)} />
                  <input className="w-full bg-[#fcfaf7] rounded-2xl px-5 py-4 min-h-[44px] text-sm border border-gray-100 outline-none" placeholder="Descripción" value={vidDesc} onChange={(e) => setVidDesc(e.target.value)} />
                  <input className="w-full bg-[#fcfaf7] rounded-2xl px-5 py-4 min-h-[44px] text-sm border border-gray-100 outline-none" placeholder="Categoría (Ej: Estudios, Himnos...)" value={vidCategory} onChange={(e) => setVidCategory(e.target.value)} />
                  <input className="w-full bg-[#fcfaf7] rounded-2xl px-5 py-4 min-h-[44px] text-sm border border-gray-100 outline-none" placeholder="Link de YouTube" value={vidLink} onChange={(e) => setVidLink(e.target.value)} />
                  <button onClick={uploadVideo} disabled={loading} className="w-full min-h-[44px] py-4 bg-red-600 text-white rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-all">
                    {loading ? "..." : "Agregar Video"}
                  </button>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-4">Videos registrados ({videos.length})</p>
                  {videos.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-10 bg-[#fcfaf7] rounded-2xl">Aún no hay videos. Agrega uno con el formulario de arriba.</p>
                  ) : (
                    <div className="space-y-3">
                      {videos.map((v) => (
                        <div key={v.id} className="bg-[#fcfaf7] p-3 rounded-xl border border-gray-100 flex gap-3 items-center shadow-sm min-w-0">
                          <img src={`https://img.youtube.com/vi/${v.youtubeId}/default.jpg`} className="w-12 h-12 rounded object-cover flex-shrink-0" alt="" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{v.title}</p>
                            <p className="text-[9px] text-gray-500 uppercase">{v.category || "General"}</p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => setEditingVideo(v)} className="min-w-[44px] min-h-[44px] text-blue-500 hover:bg-blue-50 rounded-full font-bold text-sm flex items-center justify-center">✎</button>
                            <button onClick={() => deleteVideo(v.id)} className="min-w-[44px] min-h-[44px] text-red-500 hover:bg-red-50 rounded-full font-bold text-sm flex items-center justify-center">✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: ENSEÑANZAS */}
          {activeTab === "ensenanzas" && (
            <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-8 shadow-2xl border border-amber-100">
              <h2 className="text-lg md:text-xl font-bold mb-2 flex items-center gap-3 text-amber-800">
                <span className="w-8 h-8 bg-amber-700 text-white rounded-full flex items-center justify-center text-[10px]">05</span>
                Enseñanzas
              </h2>
              <p className="text-xs text-gray-400 mb-6 pl-11">
                Solo links a Telegram / YouTube. No se suben archivos de audio.
              </p>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <input className="w-full bg-[#fcfaf7] rounded-2xl px-5 py-4 min-h-[44px] text-sm border border-gray-100 outline-none" placeholder="Título *" value={ensTitle} onChange={(e) => setEnsTitle(e.target.value)} />
                  <textarea className="w-full bg-[#fcfaf7] rounded-2xl px-5 py-4 text-sm border border-gray-100 outline-none h-24 resize-none" placeholder="Descripción" value={ensDesc} onChange={(e) => setEnsDesc(e.target.value)} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input className="w-full bg-[#fcfaf7] rounded-2xl px-5 py-4 min-h-[44px] text-sm border border-gray-100 outline-none" placeholder="Categoría" value={ensCategory} onChange={(e) => setEnsCategory(e.target.value)} />
                    <input className="w-full bg-[#fcfaf7] rounded-2xl px-5 py-4 min-h-[44px] text-sm border border-gray-100 outline-none" placeholder="Predicador" value={ensPredicador} onChange={(e) => setEnsPredicador(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input className="w-full bg-[#fcfaf7] rounded-2xl px-5 py-4 min-h-[44px] text-sm border border-gray-100 outline-none" placeholder="Fecha" value={ensFecha} onChange={(e) => setEnsFecha(e.target.value)} />
                    <input className="w-full bg-[#fcfaf7] rounded-2xl px-5 py-4 min-h-[44px] text-sm border border-gray-100 outline-none" placeholder="Duración" value={ensDuration} onChange={(e) => setEnsDuration(e.target.value)} />
                  </div>
                  <input className="w-full bg-[#fcfaf7] rounded-2xl px-5 py-4 min-h-[44px] text-sm border border-gray-100 outline-none" placeholder="Link Telegram (t.me/...)" value={ensTelegram} onChange={(e) => setEnsTelegram(e.target.value)} />
                  <input className="w-full bg-[#fcfaf7] rounded-2xl px-5 py-4 min-h-[44px] text-sm border border-gray-100 outline-none" placeholder="Link YouTube (opcional)" value={ensYoutube} onChange={(e) => setEnsYoutube(e.target.value)} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select value={ensStatus} onChange={(e) => setEnsStatus(e.target.value as "published" | "coming_soon")} className="w-full bg-[#fcfaf7] rounded-2xl px-5 py-4 min-h-[44px] text-sm border border-gray-100 outline-none font-bold">
                      <option value="published">Publicado</option>
                      <option value="coming_soon">Próximamente</option>
                    </select>
                    <input type="number" className="w-full bg-[#fcfaf7] rounded-2xl px-5 py-4 min-h-[44px] text-sm border border-gray-100 outline-none" placeholder="Orden" value={ensOrder} onChange={(e) => setEnsOrder(e.target.value)} />
                  </div>
                  <button onClick={uploadEnsenanza} disabled={loading} className="w-full min-h-[44px] py-4 bg-amber-700 text-white rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50">
                    {loading ? "..." : "Publicar Enseñanza"}
                  </button>
                </div>
                <div className="bg-[#fcfaf7] rounded-2xl p-4 md:max-h-[520px] overflow-y-auto custom-scrollbar">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-4">Enseñanzas registradas ({ensenanzas.length})</p>
                  <div className="space-y-3">
                    {ensenanzas.map((e) => (
                      <div key={e.id} className="bg-white p-3 rounded-xl border border-gray-100 flex gap-3 items-start shadow-sm min-w-0">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-lg flex-shrink-0">🎧</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{e.title}</p>
                          <p className="text-[9px] text-gray-500 uppercase">{e.category || "General"} · {e.predicador || "—"}</p>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${e.status === "coming_soon" ? "bg-gray-100 text-gray-500" : "bg-green-50 text-green-700"}`}>
                              {e.status === "coming_soon" ? "Próximo" : "Publicado"}
                            </span>
                            {e.telegram_url && <span className="text-[8px] text-blue-600">TG ✓</span>}
                            {e.youtube_url && <span className="text-[8px] text-red-600">YT ✓</span>}
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => setEditingEnsenanza(e)} className="min-w-[44px] min-h-[44px] text-blue-500 hover:bg-blue-50 rounded-full font-bold text-sm flex items-center justify-center">✎</button>
                          <button onClick={() => deleteEnsenanza(e.id)} className="min-w-[44px] min-h-[44px] text-red-500 hover:bg-red-50 rounded-full font-bold text-sm flex items-center justify-center">✕</button>
                        </div>
                      </div>
                    ))}
                    {ensenanzas.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-10">Aún no hay enseñanzas. Publica la primera con el formulario.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: GALERÍA */}
          {activeTab === "galeria" && (
            <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-8 shadow-2xl border border-amber-50 max-w-xl">
              <h2 className="text-lg md:text-xl font-bold mb-6 flex items-center gap-3 text-amber-700">
                <span className="w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center text-[10px]">02</span>
                Galería
              </h2>
              <div className="space-y-4">
                <div className="relative min-h-[144px] bg-amber-50/30 border-2 border-dashed border-amber-100 rounded-[2rem] flex flex-col items-center justify-center">
                  <input id="galleryInput" type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setGalleryFile(e.target.files?.[0] || null)} />
                  <span className="text-[10px] font-bold uppercase text-amber-600 px-4 text-center">{galleryFile ? galleryFile.name : "Subir Foto"}</span>
                </div>
                <input className="w-full bg-[#fcfaf7] rounded-2xl px-5 py-4 min-h-[44px] text-sm border border-gray-100 outline-none" placeholder="Descripción..." value={galleryDesc} onChange={(e) => setGalleryDesc(e.target.value)} />
                <button onClick={uploadToGallery} disabled={loading} className="w-full min-h-[44px] py-4 bg-amber-600 text-white rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-all">
                  {loading ? "..." : "Añadir a Galería"}
                </button>
              </div>
            </div>
          )}

          {/* TAB: SOLICITUDES */}
          {activeTab === "solicitudes" && (
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-amber-600 mb-4 flex items-center gap-4">
                Solicitudes ({filteredRequests.length}) <span className="h-px flex-1 bg-amber-100"></span>
              </h3>

              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
                <div className="overflow-x-auto -mx-1 px-1 min-w-0">
                  <div className="flex flex-wrap sm:flex-nowrap gap-2 min-w-0">
                  {(
                    [
                      { id: "pendiente", label: "Pendientes" },
                      { id: "aprobada", label: "Aprobadas" },
                      { id: "rechazada", label: "Rechazadas" },
                      { id: "todas", label: "Todas" },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setRequestFilter(f.id);
                        if (f.id !== "aprobada") setApprovedNotifyFilter("todas");
                      }}
                      className={`min-h-[36px] rounded-full px-4 py-2 text-[9px] font-bold uppercase tracking-wider transition-colors flex-shrink-0 ${
                        requestFilter === f.id
                          ? "bg-amber-600 text-white shadow-sm"
                          : "bg-white text-gray-500 border border-gray-200 hover:border-amber-200"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                  </div>
                </div>
                <input
                  type="search"
                  value={requestSearch}
                  onChange={(e) => setRequestSearch(e.target.value)}
                  placeholder="Buscar nombre, correo, WhatsApp o libro..."
                  className="w-full sm:max-w-xs bg-white border border-gray-200 rounded-xl px-4 py-2.5 min-h-[40px] text-xs outline-none focus:border-amber-300 min-w-0"
                />
              </div>

              {requestFilter === "aprobada" && (
                <div className="mb-4 overflow-x-auto -mx-1 px-1">
                  <div className="flex gap-2 pb-1">
                    {(
                      [
                        { id: "todas", label: "Todas las aprobadas" },
                        { id: "no_avisadas", label: "No avisadas" },
                        { id: "avisadas", label: "Avisadas" },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setApprovedNotifyFilter(f.id)}
                        className={`min-h-[32px] rounded-full px-3 py-1.5 text-[8px] font-bold uppercase tracking-wider transition-colors flex-shrink-0 ${
                          approvedNotifyFilter === f.id
                            ? "bg-green-600 text-white shadow-sm"
                            : "bg-white text-gray-500 border border-green-100 hover:border-green-200"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredRequests.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-16 bg-white rounded-[2rem] border border-amber-50">
                  {requests.length === 0
                    ? "No hay solicitudes. Cuando un usuario pida acceso a un libro privado, aparecerá aquí."
                    : "No hay solicitudes que coincidan con el filtro o búsqueda."}
                </p>
              ) : (
                <div className="grid gap-4">
                  {filteredRequests.map((req) => {
                    const item = req as BookRequest;
                    const status = getRequestStatus(item);
                    const userName = getRequestUserName(item);
                    const hasWhatsApp = Boolean(item.whatsapp?.trim());
                    const showWhatsAppActions = status === "aprobada";
                    const notified = isRequestNotified(item);
                    const notifiedAtLabel = formatRequestTimestamp(item.notifiedAt);
                    const normalizedPhone = normalizeWhatsAppNumber(item.whatsapp);

                    return (
                      <div
                        key={item.id}
                        className={`border rounded-[2rem] p-5 md:p-6 flex flex-col gap-4 shadow-sm ${
                          status === "aprobada"
                            ? "bg-green-50/60 border-green-100"
                            : status === "rechazada"
                              ? "bg-gray-50 border-gray-200"
                              : "bg-amber-50 border-amber-100"
                        }`}
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-start">
                          <div className="flex items-start gap-4 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 font-bold text-xs flex-shrink-0">
                              {userName ? userName.charAt(0).toUpperCase() : "?"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 truncate">
                                {userName || item.userEmail}
                              </p>
                              {userName && (
                                <p className="text-[10px] text-gray-500 truncate">{item.userEmail}</p>
                              )}
                              <p className="text-[10px] uppercase tracking-widest text-amber-600 mt-1">
                                Libro: {item.bookTitle}
                              </p>
                              {hasWhatsApp ? (
                                <div className="mt-1 flex flex-wrap items-center gap-2 min-w-0">
                                  <p className="text-[9px] text-green-600 font-bold truncate max-w-full">
                                    📞 {item.whatsapp}
                                  </p>
                                  {normalizedPhone && (
                                    <button
                                      type="button"
                                      onClick={() => copyWhatsAppNumber(item)}
                                      className="text-[8px] font-bold uppercase tracking-wider text-green-700 underline hover:text-green-900 flex-shrink-0"
                                    >
                                      {copiedWhatsAppId === item.id ? "✓ Copiado" : "Copiar WhatsApp"}
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <p className="text-[9px] text-gray-400 font-bold mt-1">Sin WhatsApp</p>
                              )}
                              <span
                                className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                                  status === "aprobada"
                                    ? "bg-green-100 text-green-700"
                                    : status === "rechazada"
                                      ? "bg-gray-200 text-gray-600"
                                      : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {status}
                              </span>
                              {notified && (
                                <span className="inline-block mt-2 ml-1.5 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-blue-100 text-blue-700">
                                  ✓ Avisado
                                </span>
                              )}
                              {notified && (notifiedAtLabel || item.notifiedBy) && (
                                <p className="mt-2 text-[9px] text-blue-700/80 leading-snug truncate max-w-full">
                                  {notifiedAtLabel}
                                  {notifiedAtLabel && item.notifiedBy ? " · " : ""}
                                  {item.notifiedBy ? (
                                    <span className="truncate">{item.notifiedBy}</span>
                                  ) : null}
                                </p>
                              )}
                            </div>
                          </div>

                          {status === "pendiente" && (
                            <div className="flex gap-2 w-full md:w-auto">
                              <button
                                onClick={() => authorizeUser(item.bookId, item.userEmail, item.id)}
                                className="flex-1 md:flex-none min-h-[44px] px-6 py-3 bg-green-600 text-white rounded-full text-[9px] font-bold uppercase hover:bg-green-700 shadow-lg"
                              >
                                Aceptar
                              </button>
                              <button
                                onClick={() => rejectRequest(item.id)}
                                className="min-h-[44px] min-w-[44px] px-4 py-3 bg-white text-red-400 border border-gray-200 rounded-full text-[9px] font-bold uppercase hover:bg-red-50"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </div>

                        {showWhatsAppActions && !notified && (
                          <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-1 border-t border-green-100/80">
                            {hasWhatsApp ? (
                              <button
                                type="button"
                                onClick={() => openWhatsAppNotice(item)}
                                className="flex-1 min-h-[44px] px-4 py-3 bg-[#25D366] text-white rounded-full text-[9px] font-bold uppercase hover:bg-[#1da851] shadow-sm flex items-center justify-center gap-2 sm:min-w-[140px]"
                              >
                                📲 Avisar por WhatsApp
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled
                                className="flex-1 min-h-[44px] px-4 py-3 bg-gray-100 text-gray-400 rounded-full text-[9px] font-bold uppercase cursor-not-allowed sm:min-w-[140px]"
                              >
                                Sin WhatsApp
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => copyAuthorizationMessage(item)}
                              className="min-h-[44px] px-4 py-3 bg-white border border-gray-200 text-gray-600 rounded-full text-[9px] font-bold uppercase hover:bg-gray-50 sm:min-w-[120px]"
                            >
                              {copiedRequestId === item.id ? "✓ Copiado" : "Copiar mensaje"}
                            </button>
                            <button
                              type="button"
                              onClick={() => markRequestNotified(item.id)}
                              disabled={loading}
                              className="min-h-[44px] px-4 py-3 bg-white border border-amber-200 text-amber-700 rounded-full text-[9px] font-bold uppercase hover:bg-amber-50 sm:min-w-[120px]"
                            >
                              {hasWhatsApp ? "Marcar como avisado" : "Marcar como avisado manualmente"}
                            </button>
                          </div>
                        )}

                        {showWhatsAppActions && notified && (
                          <div className="flex flex-wrap gap-2 pt-1 border-t border-green-100/80">
                            <button
                              type="button"
                              onClick={() => copyAuthorizationMessage(item)}
                              className="min-h-[40px] px-4 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-full text-[9px] font-bold uppercase hover:bg-gray-50"
                            >
                              {copiedRequestId === item.id ? "✓ Copiado" : "Copiar mensaje"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: PUSH */}
          {activeTab === "push" && (
            <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-[2rem] md:rounded-[3rem] p-6 md:p-8 shadow-2xl text-white max-w-xl">
              <h2 className="text-lg md:text-xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-white text-indigo-900 rounded-full flex items-center justify-center text-[10px]">04</span>
                Enviar Notificación
              </h2>
              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="push-template"
                    className="block text-[10px] font-bold uppercase tracking-widest text-blue-200 mb-2"
                  >
                    Plantilla
                  </label>
                  <select
                    id="push-template"
                    value={pushTemplateId}
                    onChange={(e) => applyPushTemplate(e.target.value)}
                    className="w-full bg-white/10 text-white rounded-2xl px-5 py-4 min-h-[44px] text-sm border border-white/20 outline-none focus:border-white/40"
                  >
                    <option value="" className="text-gray-900">
                      Escribir manualmente
                    </option>
                    {PUSH_TEMPLATES.map((t) => (
                      <option key={t.id} value={t.id} className="text-gray-900">
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={applySuggestedPushMessage}
                  className="w-full min-h-[44px] py-3.5 bg-white/15 text-white border border-white/25 rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-white/25 transition-all flex items-center justify-center gap-2"
                >
                  <span aria-hidden>🎲</span> Usar mensaje sugerido
                </button>
                <input
                  className="w-full bg-white/10 text-white placeholder-blue-300 rounded-2xl px-5 py-4 min-h-[44px] text-sm border border-white/20 outline-none focus:border-white/40"
                  placeholder="Título"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                />
                <textarea
                  className="w-full bg-white/10 text-white placeholder-blue-300 rounded-2xl px-5 py-4 text-sm border border-white/20 outline-none h-32 resize-none focus:border-white/40"
                  placeholder="Mensaje"
                  value={notifBody}
                  onChange={(e) => setNotifBody(e.target.value)}
                />
                <p className="text-[10px] text-blue-200/80 leading-relaxed">
                  Puedes editar el título y el mensaje antes de enviar.
                </p>
                <button onClick={sendPushNotification} disabled={loading} className="w-full min-h-[44px] py-4 bg-white text-indigo-900 rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-blue-100 transition-all shadow-lg flex items-center justify-center gap-2">
                  {loading ? "..." : <><span>🚀</span> Enviar a Todos</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-4 z-30 min-w-[44px] min-h-[44px] px-4 py-3 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-amber-600 transition-colors"
          aria-label="Volver arriba"
        >
          ↑ Arriba
        </button>
      )}
    </main>
  );
}