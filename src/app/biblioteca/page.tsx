"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Header from "@/components/Header";
import Link from "next/link";

type DocItem = {
  id: string;
  title: string;
  coverUrl?: string;
  isPublic?: boolean;
  authorizedEmails?: string[];
  createdAt?: any;
};

export default function BibliotecaPage() {
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserEmail(user?.email?.toLowerCase() || null);
    });

    (async () => {
      const q = query(collection(db, "documents"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const fetchedDocs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setDocs(fetchedDocs);
      setLoading(false);
    })().catch(() => setLoading(false));

    return () => unsub();
  }, []);

  const filteredPrivate = docs.filter(d => !d.isPublic && d.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredPublic = docs.filter(d => d.isPublic && d.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <main className="min-h-screen bg-[#fcfaf7] font-serif select-none overflow-x-hidden">
      <Header />

      <section className="max-w-6xl mx-auto px-6 pt-32 pb-20 text-center animate-in">
        <div className="flex justify-center items-center gap-6 mb-10">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-200"></div>
          <img src="/icon.png" className="w-14 h-14 grayscale opacity-40 hover:opacity-100 transition-opacity duration-700" alt="Logo" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-200"></div>
        </div>
        <h1 className="text-6xl md:text-8xl font-bold text-gray-900 mb-8 tracking-tighter leading-none">
          Sala de Estudio
        </h1>
        <p className="text-xl md:text-2xl text-amber-900/50 font-medium italic mb-12 max-w-2xl mx-auto">
          Obra literaria y espiritual de Jose Enrique Perez Leon
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12 sticky top-4 z-40">
        <div className="relative max-w-xl mx-auto">
          <div className="relative backdrop-blur-xl bg-white/60 p-2 rounded-full border border-white shadow-2xl">
            <input 
              type="text"
              placeholder="Buscar por título, año o tema..."
              className="w-full pl-14 pr-8 py-5 bg-white rounded-full shadow-inner focus:ring-2 focus:ring-amber-200 outline-none transition-all font-sans text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute left-7 top-7 text-amber-400/60 text-xl">🔍</span>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex items-center justify-between mb-16 border-b border-amber-100 pb-8">
          <div className="space-y-1">
            <h3 className="text-[12px] uppercase tracking-[0.6em] font-black text-gray-400">Colección Editorial</h3>
            <p className="text-[10px] text-amber-600/60 font-bold uppercase tracking-widest italic">Acceso restringido para formación</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20 italic text-gray-400">Consultando archivos...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-32 gap-x-16">
            {filteredPrivate.map((d, index) => {
              const hasAccess = d.authorizedEmails?.includes(userEmail || "");
              return (
                <BookCard key={d.id} doc={d} index={index} hasAccess={hasAccess} userEmail={userEmail} />
              );
            })}
          </div>
        )}
      </section>

      {filteredPublic.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 pb-40 mt-20">
          <div className="flex items-center justify-between mb-16 border-b border-gray-200 pb-8">
            <div className="space-y-1">
              <h3 className="text-[12px] uppercase tracking-[0.6em] font-black text-gray-400">Historia y Legado</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">Documentos de interés público</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-32 gap-x-16">
            {filteredPublic.map((d, index) => (
              <BookCard key={d.id} doc={d} index={index} hasAccess={true} userEmail={userEmail} />
            ))}
          </div>
        </section>
      )}

      <footer className="bg-white/40 backdrop-blur-sm border-t border-amber-100 py-32 text-center">
          <img src="/icon.png" className="w-14 h-14 mx-auto mb-10 grayscale opacity-20" alt="" />
          <p className="text-[12px] uppercase tracking-[0.8em] text-gray-400 font-bold mb-8">Jose Enrique Perez Leon</p>
          <p className="text-[10px] text-gray-300 italic">Protección de derechos RV1909</p>
      </footer>
    </main>
  );
}

function BookCard({ doc, index, hasAccess, userEmail }: { doc: DocItem, index: number, hasAccess: boolean | undefined, userEmail: string | null }) {
  const [showModal, setShowModal] = useState(false);
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await addDoc(collection(db, "requests"), {
        bookTitle: doc.title,
        bookId: doc.id,
        userEmail: userEmail,
        whatsapp: phone,
        status: "pendiente",
        createdAt: serverTimestamp(),
      });
      alert("Solicitud enviada con éxito. El administrador te contactará pronto. ✅");
      setShowModal(false);
      setPhone("");
    } catch (error) {
      alert("Error al enviar la solicitud.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="group flex flex-col items-center animate-in" style={{ animationDelay: `${index * 100}ms` }}>
      <div className={`relative w-64 h-80 transition-all duration-1000 ${hasAccess ? 'group-hover:-translate-y-6 group-hover:rotate-3 group-hover:scale-105' : 'opacity-80 shadow-none'}`}>
        
        {!hasAccess && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px] rounded-r-2xl">
            <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mb-4 border border-white/20">
              <span className="text-2xl text-white">🔒</span>
            </div>
            <span className="text-[8px] font-black text-white uppercase tracking-[0.4em]">Contenido Protegido</span>
          </div>
        )}

        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[85%] h-10 bg-black/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
        
        {doc.coverUrl ? (
          <div className="relative w-full h-full rounded-r-2xl shadow-2xl overflow-hidden border-l-[10px] border-black ring-1 ring-white/10">
            <img src={doc.coverUrl} alt={doc.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
          </div>
        ) : (
          <div className="relative w-full h-full bg-[#121212] rounded-r-2xl shadow-2xl border-l-[12px] border-black overflow-hidden flex flex-col justify-between p-10 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/60 opacity-50"></div>
            <div className="space-y-3 relative z-10">
              <div className="w-10 h-0.5 bg-amber-500/50 mx-auto rounded-full"></div>
              <span className="block text-[9px] tracking-[0.6em] text-amber-500/90 font-black uppercase">Edición</span>
            </div>
            <h4 className="text-white text-base font-bold leading-relaxed font-serif relative z-10 line-clamp-4">{doc.title}</h4>
            <img src="/icon.png" className="w-6 h-6 mx-auto opacity-30 relative z-10" alt="" />
          </div>
        )}
      </div>

      <div className="mt-14 text-center w-full max-w-[280px] space-y-6">
        <h3 className="text-gray-900 font-black text-xl h-14 line-clamp-2 leading-tight tracking-tighter">{doc.title}</h3>
        
        {hasAccess ? (
          <Link href={`/documento/${doc.id}`} className="inline-flex items-center justify-center w-full py-5 bg-black text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-full hover:bg-amber-600 transition-all shadow-xl active:scale-95">
            Iniciar Lectura
          </Link>
        ) : (
          <button 
            onClick={() => setShowModal(true)}
            className="w-full py-5 bg-white text-amber-600 text-[10px] font-black uppercase tracking-[0.3em] rounded-full border-2 border-amber-100 hover:bg-amber-50 transition-all shadow-lg active:scale-95"
          >
            Solicitar Acceso
          </button>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl animate-in zoom-in duration-300 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-gray-300 hover:text-black transition-colors">✕</button>
            <div className="text-center mb-8">
               <span className="text-2xl mb-4 block">📖</span>
               <h3 className="text-2xl font-bold text-gray-900 tracking-tighter">Solicitar Volumen</h3>
               <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-2">Déjanos tu WhatsApp para darte acceso</p>
            </div>
            
            <form onSubmit={handleRequest} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-amber-600 ml-2">Usuario</label>
                <div className="w-full bg-gray-50 rounded-2xl px-5 py-3 text-xs text-gray-400 italic border border-gray-100">
                  {userEmail || "Inicia sesión primero"}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-amber-600 ml-2">WhatsApp / Teléfono</label>
                <input 
                  required
                  type="tel"
                  placeholder="+52 55..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#fcfaf7] border border-amber-100 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-200 transition-all"
                />
              </div>
              <button 
                type="submit"
                disabled={sending || !userEmail}
                className="w-full py-4 bg-black text-white rounded-full font-bold text-[10px] uppercase tracking-[0.4em] hover:bg-amber-600 transition-all disabled:opacity-20 shadow-xl shadow-black/10"
              >
                {sending ? "Enviando..." : "Enviar Solicitud"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}