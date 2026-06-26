"use client";

import { useEffect, useState, useMemo } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  addDoc,
  serverTimestamp,
  where,
  deleteDoc,
  doc, 
  setDoc,
  limit,      
  onSnapshot  
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { getMessaging, getToken } from "firebase/messaging";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation"; 
import Header from "@/components/Header";
import Link from "next/link";
import InstallGuideModal from "@/components/InstallGuideModal";
import { hasPendingRequestForBook, isPendingRequestStatus } from "@/lib/bookRequests";
import { useLanguage } from "@/lib/language";
import { notifyTelegramBookRequest } from "@/lib/telegramNotifyClient";

type DocItem = {
  id: string;
  title: string;
  coverUrl?: string;
  isPublic?: boolean;
  category?: string; // NUEVO: Campo para la carpeta
  authorizedEmails?: string[];
  createdAt?: any;
};

// Función para ordenar numéricamente (Vol. 1, Vol. 2...)
const getBookNumber = (title: string) => {
  if (!title) return Infinity;
  const match = title.match(/(?:numero|número|num|no\.?|vol\.?)\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : Infinity;
};

export default function BibliotecaPage() {
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [requestedBookIds, setRequestedBookIds] = useState<string[]>([]);
  const [savedBookIds, setSavedBookIds] = useState<string[]>([]); 
  
  const [showInstallModal, setShowInstallModal] = useState(false);
  
  // ESTADO PARA EL AVISO INTELIGENTE
  const [ultimoAviso, setUltimoAviso] = useState<{ id: string, title: string } | null>(null);

  // ESTADO PARA CARPETAS
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  const router = useRouter();
  const { t } = useLanguage();

  // 1. BANNER INTELIGENTE (CON MEMORIA LOCAL)
  useEffect(() => {
    const q = query(collection(db, "documents"), orderBy("createdAt", "desc"), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
        const docId = snapshot.docs[0].id;
        const titulo = docData.title;
        const fechaDoc = docData.createdAt?.toDate ? docData.createdAt.toDate().getTime() : Date.now();
        const hace48Horas = Date.now() - (48 * 60 * 60 * 1000); // Mostramos avisos de hasta 48hrs

        // VERIFICAMOS SI YA LO VIO
        const yaVisto = localStorage.getItem(`aviso_visto_${docId}`);

        if (fechaDoc > hace48Horas && !yaVisto) {
          setUltimoAviso({ id: docId, title: titulo });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const cerrarAviso = () => {
    if (ultimoAviso) {
      localStorage.setItem(`aviso_visto_${ultimoAviso.id}`, "true");
      setUltimoAviso(null);
    }
  };

  // 2. AUTH Y CARGA DE LIBROS
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const email = user.email?.toLowerCase() || "";
        setUserEmail(email);
        setUserId(user.uid);

        // Cargar datos de usuario en paralelo para mayor velocidad
        Promise.all([
            getDocs(query(collection(db, "requests"), where("userEmail", "==", email))),
            getDocs(query(collection(db, "user_favorites"), where("userId", "==", user.uid), where("type", "==", "book")))
        ]).then(([reqSnap, favSnap]) => {
            setRequestedBookIds(
              reqSnap.docs
                .filter((d) => isPendingRequestStatus(d.data().status))
                .map((d) => d.data().bookId)
                .filter(Boolean)
            );
            setSavedBookIds(favSnap.docs.map((d) => d.data().contentId));
        }).catch(e => console.error("Error cargando datos de usuario", e));

      } else {
        setUserEmail(null);
        setUserId(null);
      }
    });

    // Cargar Documentos
    (async () => {
      try {
        const q = query(collection(db, "documents"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        
        let fetchedDocs = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        // Ordenamiento inteligente
        fetchedDocs = fetchedDocs.sort((a, b) => {
          const numA = getBookNumber(a.title);
          const numB = getBookNumber(b.title);
          if (numA !== Infinity && numB !== Infinity) return numA - numB;
          return 0; // Si no tienen número, mantener orden de fecha (el query ya lo trae por fecha)
        });

        setDocs(fetchedDocs);
        setLoading(false);
      } catch (error) { setLoading(false); }
    })();

    return () => unsub();
  }, [router]);

  // 3. LÓGICA DE CARPETAS (Detecta categorías automáticamente)
  const categories = useMemo(() => {
    const cats = new Set(docs.map(d => d.category || "General"));
    return ["Todos", ...Array.from(cats).sort()];
  }, [docs]);

  // 4. FILTRADO
  const term = searchTerm.toLowerCase();
  
  const filteredDocs = docs.filter((d) => {
    const matchesSearch = (d.title || "").toLowerCase().includes(term);
    const matchesCategory = selectedCategory === "Todos" 
        ? true 
        : (d.category || "General") === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const filteredPrivate = filteredDocs.filter((d) => !d.isPublic);
  const filteredPublic = filteredDocs.filter((d) => d.isPublic);


  // ACCIONES
  const toggleFavorite = async (item: DocItem) => {
    if (!userId) return alert(t.library.loginToSave);
    const isSaved = savedBookIds.includes(item.id);
    
    // Optimistic UI (Actualiza visualmente antes de esperar a la base de datos)
    setSavedBookIds(prev => isSaved ? prev.filter(id => id !== item.id) : [...prev, item.id]);

    try {
        if (isSaved) {
            const q = query(collection(db, "user_favorites"), where("userId", "==", userId), where("contentId", "==", item.id));
            const snap = await getDocs(q);
            snap.forEach(async (d) => { await deleteDoc(doc(db, "user_favorites", d.id)); });
        } else {
            await addDoc(collection(db, "user_favorites"), {
                userId, contentId: item.id, type: "book", title: item.title, coverUrl: item.coverUrl || "", createdAt: serverTimestamp()
            });
        }
    } catch (error) {
        // Revertir si falla
        setSavedBookIds(prev => isSaved ? [...prev, item.id] : prev.filter(id => id !== item.id));
    }
  };

  const handleEnableNotifications = async () => {
    if (!("Notification" in window)) return alert("Tu navegador no soporta notificaciones.");
    
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return alert("⚠️ Permiso bloqueado. Toca el candado 🔒 y permite las notificaciones.");

    try {
        new Notification("¡Bienvenido a la Biblioteca!", {
            body: "Avisos activados correctamente.", icon: "/icon-192.png"
        });

        let registration;
        try {
            if ('serviceWorker' in navigator) {
                registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            }
        } catch (e) { console.warn("SW registration issue", e); }

        const messaging = getMessaging();
        const token = await getToken(messaging, { 
            vapidKey: "BFlxGRnMNZ9xXK5WT7K0LzAt56PKDZ64kyPfb8OIOCWimsg4zupJdFcs3G2wnyRMOqxREywZBl1Rdzo5G6es03E",
            serviceWorkerRegistration: registration 
        });
        
        if (token) {
            await setDoc(doc(db, "fcm_tokens", token), {
                token, email: userEmail || "anonimo", createdAt: serverTimestamp(), lastActive: serverTimestamp(), device: navigator.userAgent
            });
            alert("✅ ¡Avisos activados con éxito!");
        }
    } catch (error) {
        console.error(error);
        alert("Error técnico al activar avisos. Intenta recargar.");
    }
  };

  return (
    <main className="ambient-page min-h-screen bg-[#fcfaf7] font-serif select-none overflow-x-hidden">
      <Header />

      {/* --- BANNER INTELIGENTE --- */}
      {ultimoAviso && (
        <div className="fixed top-24 left-0 right-0 z-50 px-4 animate-in slide-in-from-top-4 duration-700 pointer-events-none">
            <div className="max-w-md mx-auto bg-amber-600/95 backdrop-blur-md text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center justify-between border-2 border-white/20 pointer-events-auto">
                <div className="flex items-center gap-3">
                    <span className="text-xl">✨</span>
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-amber-100 tracking-widest">{t.library.newBadge}</span>
                        <span className="text-sm font-bold leading-tight line-clamp-1">{ultimoAviso.title}</span>
                    </div>
                </div>
                <button onClick={cerrarAviso} className="ml-4 p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors">✕</button>
            </div>
        </div>
      )}

      {/* --- HERO SECTION --- */}
      <section className="max-w-6xl mx-auto px-6 pt-16 sm:pt-24 md:pt-32 pb-6 sm:pb-10 text-center animate-in">
        <h1 className="text-4xl sm:text-5xl md:text-8xl font-bold text-gray-900 mb-6 tracking-tighter leading-none">
          {t.library.title}
        </h1>
        <p className="text-base sm:text-xl md:text-2xl text-amber-900/50 font-medium italic mb-4 max-w-2xl mx-auto">
          {t.library.subtitle}
        </p>
        {t.library.spanishMaterialsNote && (
          <p className="text-[11px] text-gray-400 max-w-md mx-auto mb-4 leading-relaxed">
            {t.library.spanishMaterialsNote}
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-3 mb-8">
            <button onClick={() => setShowInstallModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-white/80 border border-amber-200 rounded-full text-[10px] font-bold uppercase tracking-widest text-amber-800 hover:scale-105 transition-all">
              <span className="text-lg">📲</span> {t.library.installApp}
            </button>
            <button onClick={handleEnableNotifications} className="flex items-center gap-2 px-5 py-2.5 bg-black/5 border border-gray-200 rounded-full text-[10px] font-bold uppercase tracking-widest text-gray-700 hover:bg-black hover:text-white hover:scale-105 transition-all">
              <span className="text-lg">🔔</span> {t.library.enableNotifications}
            </button>
        </div>
      </section>

      {/* --- BUSCADOR Y FILTROS --- */}
      <section className="max-w-6xl mx-auto px-6 pb-4 md:pb-8 md:sticky md:top-4 z-40 space-y-3 md:space-y-4">
        {/* Input Buscador */}
        <div className="relative max-w-xl mx-auto">
          <div className="relative backdrop-blur-xl bg-white/80 p-1.5 rounded-full border border-white shadow-xl ring-1 ring-black/5">
            <input
              type="text"
              placeholder={t.library.searchPlaceholder}
              className="w-full pl-12 pr-6 py-3 bg-transparent rounded-full focus:bg-white focus:ring-2 focus:ring-amber-200 outline-none transition-all font-sans text-sm placeholder:text-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500/50 text-lg">🔍</span>
          </div>
        </div>

        {/* --- CARPETAS / CATEGORÍAS (Horizontal Scroll) --- */}
        {categories.length > 1 && (
            <div className="flex justify-center overflow-x-auto pb-2 no-scrollbar">
                <div className="flex gap-2 px-4 py-2 bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                                selectedCategory === cat 
                                ? "bg-black text-white shadow-lg scale-105" 
                                : "bg-transparent text-gray-500 hover:bg-amber-100 hover:text-amber-800"
                            }`}
                        >
                            {cat === "Todos" ? t.library.viewAll : cat}
                        </button>
                    ))}
                </div>
            </div>
        )}
      </section>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        
        {loading ? (
          <div className="flex flex-col items-center py-20 opacity-50">
            <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mb-4"></div>
            <p className="text-xs uppercase tracking-widest">{t.library.loading}</p>
          </div>
        ) : (
          <>
            {/* SECCIÓN PRIVADA */}
            {filteredPrivate.length > 0 && (
                <div className="mb-16">
                    <div className="flex items-center gap-4 mb-8">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                            {selectedCategory === "Todos" ? t.library.privateCollection : selectedCategory}
                        </h3>
                        <div className="h-px flex-1 bg-amber-100"></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-8 sm:gap-y-12 lg:gap-y-16 gap-x-8 lg:gap-x-12">
                        {filteredPrivate.map((d, i) => (
                            <BookCard 
                                key={d.id} doc={d} index={i} 
                                hasAccess={d.authorizedEmails?.includes(userEmail || "")}
                                alreadyRequested={requestedBookIds.includes(d.id)}
                                userEmail={userEmail} isSaved={savedBookIds.includes(d.id)}
                                onToggleFavorite={() => toggleFavorite(d)}
                                onRequestSubmitted={(bookId: string) =>
                                  setRequestedBookIds((prev) =>
                                    prev.includes(bookId) ? prev : [...prev, bookId]
                                  )
                                }
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* SECCIÓN PÚBLICA */}
            {filteredPublic.length > 0 && (
                <div>
                     <div className="flex items-center gap-4 mb-8">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                           {t.library.publicDocuments}
                        </h3>
                        <div className="h-px flex-1 bg-gray-200"></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-8 sm:gap-y-12 lg:gap-y-16 gap-x-8 lg:gap-x-12">
                        {filteredPublic.map((d, i) => (
                            <BookCard 
                                key={d.id} doc={d} index={i} hasAccess={true} alreadyRequested={false}
                                userEmail={userEmail} isSaved={savedBookIds.includes(d.id)}
                                onToggleFavorite={() => toggleFavorite(d)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {filteredPrivate.length === 0 && filteredPublic.length === 0 && (
                <div className="text-center py-20 text-gray-400">
                    <p>{t.library.noDocuments}</p>
                    <button onClick={() => setSelectedCategory("Todos")} className="mt-4 text-amber-600 underline text-sm">{t.library.seeAll}</button>
                </div>
            )}
          </>
        )}
      </section>

      <footer className="bg-white/40 backdrop-blur-sm border-t border-amber-100 py-12 md:py-24 text-center">
        <img src="/icon-512.png" className="w-12 h-12 mx-auto mb-6 grayscale opacity-20" alt="" />
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Jose Enrique Perez Leon</p>
      </footer>

      <InstallGuideModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} />
    </main>
  );
}

// --- SUBCOMPONENTE DE TARJETA (OPTIMIZADO) ---
function BookCard({
  doc,
  index,
  hasAccess,
  alreadyRequested,
  userEmail,
  isSaved,
  onToggleFavorite,
  onRequestSubmitted,
}: any) {
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [userName, setUserName] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [localRequested, setLocalRequested] = useState(alreadyRequested);
  const [duplicateNotice, setDuplicateNotice] = useState(false);

  useEffect(() => {
    setLocalRequested(alreadyRequested);
  }, [alreadyRequested]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) return;

    setSending(true);
    setDuplicateNotice(false);
    try {
      const reqSnap = await getDocs(
        query(collection(db, "requests"), where("userEmail", "==", userEmail))
      );
      const userRequests = reqSnap.docs.map((d) => d.data() as { bookId?: string; status?: string });

      if (hasPendingRequestForBook(userRequests, doc.id)) {
        setLocalRequested(true);
        onRequestSubmitted?.(doc.id);
        setShowModal(false);
        setDuplicateNotice(true);
        return;
      }

      const requestRef = await addDoc(collection(db, "requests"), {
        bookTitle: doc.title,
        bookId: doc.id,
        userEmail: userEmail,
        userName: userName.trim() || undefined,
        whatsapp: phone,
        status: "pendiente",
        createdAt: serverTimestamp(),
      });
      notifyTelegramBookRequest(doc.id, requestRef.id);
      setLocalRequested(true);
      onRequestSubmitted?.(doc.id);
      setShowModal(false);
    } catch {
      alert(t.library.sendError);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="card-enter group relative flex flex-col items-center"
      style={{ "--stagger": `${Math.min(index, 8) * 45}ms` } as React.CSSProperties}
    >
        {/* CONTENEDOR PORTADA */}
        <div className={`relative w-48 sm:w-56 aspect-[2/3] transition-all duration-500 ${hasAccess ? 'group-hover:-translate-y-4 group-hover:shadow-2xl' : 'opacity-80 grayscale-[0.5]'}`}>
            
            {/* BOTÓN FAVORITO FLOTANTE */}
            {userEmail && (
                <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }} className={`absolute -right-3 -top-3 z-20 p-2.5 rounded-full shadow-lg transition-transform hover:scale-110 ${isSaved ? "bg-amber-500 text-white" : "bg-white text-gray-300"}`}>
                    <svg className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" /></svg>
                </button>
            )}

            {/* CANDADO */}
            {!hasAccess && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[1px] rounded-r-lg">
                    <span className="text-3xl">🔒</span>
                </div>
            )}

            {/* IMAGEN */}
            {doc.coverUrl ? (
                <img src={doc.coverUrl} className="w-full h-full object-cover rounded-r-xl shadow-xl border-l-4 border-black/80" alt={doc.title} />
            ) : (
                <div className="w-full h-full bg-neutral-900 rounded-r-xl border-l-4 border-black/80 flex items-center justify-center p-6 text-center">
                    <span className="text-white/50 text-xs font-bold">{doc.title}</span>
                </div>
            )}
        </div>

        {/* INFO Y BOTONES */}
        <div className="mt-6 text-center w-full max-w-[200px] space-y-3">
            <h3 className="text-gray-900 font-bold text-sm leading-tight line-clamp-2 h-10">{doc.title}</h3>
            
            {/* ETIQUETA DE CARPETA */}
            {doc.category && (
                <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-500 text-[9px] uppercase tracking-wider rounded-md mb-2">
                    {doc.category}
                </span>
            )}

            {hasAccess ? (
                <Link href={`/documentos/${doc.id}`} className="block w-full py-2.5 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-amber-600 transition-colors shadow-lg">
                    {t.library.readNow}
                </Link>
            ) : localRequested ? (
                <div className="w-full py-2 px-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-[9px] font-bold text-amber-800 uppercase tracking-widest leading-snug">
                    {t.library.alreadyRequested}
                  </p>
                  <p className="text-[8px] text-amber-600 mt-0.5 leading-snug">
                    {t.library.waitAuthorization}
                  </p>
                </div>
            ) : (
                <button
                  onClick={() => {
                    setDuplicateNotice(false);
                    setShowModal(true);
                  }}
                  className="w-full py-2.5 bg-white border border-gray-200 text-gray-600 text-[10px] font-bold uppercase tracking-widest rounded-full hover:border-amber-400 hover:text-amber-600 transition-colors"
                >
                    {t.library.request}
                </button>
            )}

            {duplicateNotice && (
              <p className="text-[8px] text-amber-700 leading-snug px-1">
                {t.library.pendingRequest}
              </p>
            )}
        </div>

        {/* MODAL DE SOLICITUD */}
        {showModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
                    <h3 className="text-center font-bold text-gray-900 mb-2">{t.library.requestTitle}</h3>
                    <p className="text-center text-[11px] text-gray-500 mb-6 leading-relaxed">
                      {t.library.oneRequestPerBook}
                    </p>
                    <form onSubmit={handleRequest} className="space-y-4">
                        <input
                          type="text"
                          placeholder={t.library.yourName}
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-black"
                        />
                        <input required type="tel" placeholder={t.library.yourWhatsapp} value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-black" />
                        <button type="submit" disabled={sending} className="w-full py-3 bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-green-600 transition-colors">
                            {sending ? t.library.sending : t.library.send}
                        </button>
                        <button type="button" onClick={() => setShowModal(false)} className="w-full py-2 text-xs text-gray-400 font-bold hover:text-red-500">{t.library.cancel}</button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
}