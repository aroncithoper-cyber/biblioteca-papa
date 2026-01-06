"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation"; // Importante para la redirección
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
  const router = useRouter();

  // LISTA DE ADMINISTRADORES PARA REDIRECCIÓN AUTOMÁTICA
  const ADMIN_EMAILS = ["aroncithoper@gmail.com", "e_perezleon@hotmail.com"];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        const email = user.email?.toLowerCase() || "";
        setUserEmail(email);

        // REDIRECCIÓN INTELIGENTE: Si eres admin, vas directo al Panel
        if (ADMIN_EMAILS.includes(email)) {
          router.push("/admin");
        }
      } else {
        setUserEmail(null);
      }
    });

    (async () => {
      const q = query(collection(db, "documents"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const fetchedDocs = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setDocs(fetchedDocs);
      setLoading(false);
    })().catch(() => setLoading(false));

    return () => unsub();
  }, [router]);

  const term = searchTerm.toLowerCase();

  const filteredPrivate = docs.filter(
    (d) => !d.isPublic && (d.title || "").toLowerCase().includes(term)
  );
  const filteredPublic = docs.filter(
    (d) => d.isPublic && (d.title || "").toLowerCase().includes(term)
  );

  return (
    <main className="min-h-screen bg-[#fcfaf7] font-serif select-none overflow-x-hidden">
      <Header />

      {/* ENCABEZADO */}
      <section className="max-w-6xl mx-auto px-6 pt-20 sm:pt-32 pb-16 sm:pb-20 text-center animate-in">
        <div className="flex justify-center items-center gap-6 mb-8 sm:mb-10">
          <div className="h-px w-12 sm:w-16 bg-gradient-to-r from-transparent to-amber-200"></div>
          {/* RUTA ACTUALIZADA A 512 */}
          <img
            src="/icon-512.png"
            className="w-12 h-12 sm:w-14 sm:h-14 grayscale opacity-40"
            alt="Logo"
          />
          <div className="h-px w-12 sm:w-16 bg-gradient-to-l from-transparent to-amber-200"></div>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-8xl font-bold text-gray-900 mb-6 tracking-tighter leading-none">
          Sala de Estudio
        </h1>

        <p className="text-base sm:text-xl md:text-2xl text-amber-900/50 font-medium italic mb-8 sm:mb-12 max-w-2xl mx-auto">
          Obra literaria y espiritual de Jose Enrique Perez Leon
        </p>
      </section>

      {/* BUSCADOR */}
      <section className="max-w-6xl mx-auto px-6 py-8 sm:py-12 sticky top-4 z-40">
        <div className="relative max-w-xl mx-auto">
          <div className="relative backdrop-blur-xl bg-white/60 p-2 rounded-full border border-white shadow-2xl">
            <input
              type="text"
              placeholder="Buscar por título, año o tema..."
              className="w-full pl-14 pr-8 py-4 sm:py-5 bg-white rounded-full shadow-inner focus:ring-2 focus:ring-amber-200 outline-none transition-all font-sans text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute left-7 top-6 sm:top-7 text-amber-400/60 text-xl">
              🔍
            </span>
          </div>
        </div>
      </section>

      {/* COLECCIÓN PRIVADA */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex items-center justify-between mb-12 sm:mb-16 border-b border-amber-100 pb-6 sm:pb-8">
          <div className="space-y-1">
            <h3 className="text-[11px] sm:text-[12px] uppercase tracking-[0.6em] font-black text-gray-400">
              Colección Editorial
            </h3>
            <p className="text-[9px] sm:text-[10px] text-amber-600/60 font-bold uppercase tracking-widest italic">
              Acceso restringido para formación
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20 italic text-gray-400">
            Consultando archivos...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-24 sm:gap-y-32 gap-x-12 sm:gap-x-16">
            {filteredPrivate.map((d, index) => {
              const hasAccess = d.authorizedEmails?.includes(userEmail || "");
              return (
                <BookCard
                  key={d.id}
                  doc={d}
                  index={index}
                  hasAccess={hasAccess}
                  userEmail={userEmail}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* COLECCIÓN PÚBLICA */}
      {filteredPublic.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 pb-32 mt-16 sm:mt-20">
          <div className="flex items-center justify-between mb-12 sm:mb-16 border-b border-gray-200 pb-6 sm:pb-8">
            <div className="space-y-1">
              <h3 className="text-[11px] sm:text-[12px] uppercase tracking-[0.6em] font-black text-gray-400">
                Historia y Legado
              </h3>
              <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">
                Documentos de interés público
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-24 sm:gap-y-32 gap-x-12 sm:gap-x-16">
            {filteredPublic.map((d, index) => (
              <BookCard
                key={d.id}
                doc={d}
                index={index}
                hasAccess={true}
                userEmail={userEmail}
              />
            ))}
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="bg-white/40 backdrop-blur-sm border-t border-amber-100 py-24 sm:py-32 text-center">
        {/* RUTA ACTUALIZADA A 512 */}
        <img
          src="/icon-512.png"
          className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-8 sm:mb-10 grayscale opacity-20"
          alt=""
        />
        <p className="text-[11px] sm:text-[12px] uppercase tracking-[0.8em] text-gray-400 font-bold mb-6 sm:mb-8">
          Jose Enrique Perez Leon
        </p>
        <p className="text-[9px] sm:text-[10px] text-gray-300 italic">
          Protección de derechos RV1909
        </p>
      </footer>
    </main>
  );
}

/* BOOK CARD */
function BookCard({
  doc,
  index,
  hasAccess,
  userEmail,
}: {
  doc: DocItem;
  index: number;
  hasAccess: boolean | undefined;
  userEmail: string | null;
}) {
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
    } catch {
      alert("Error al enviar la solicitud.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="group flex flex-col items-center animate-in"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div
        className={`relative w-56 sm:w-64 h-72 sm:h-80 transition-all duration-1000 ${
          hasAccess
            ? "group-hover:-translate-y-6 group-hover:rotate-3 group-hover:scale-105"
            : "opacity-80"
        }`}
      >
        {!hasAccess && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px] rounded-r-2xl">
            <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mb-4 border border-white/20">
              <span className="text-2xl text-white">🔒</span>
            </div>
            <span className="text-[8px] font-black text-white uppercase tracking-[0.4em]">
              Contenido Protegido
            </span>
          </div>
        )}

        {doc.coverUrl ? (
          <div className="relative w-full h-full rounded-r-2xl shadow-2xl overflow-hidden border-l-[10px] border-black">
            <img
              src={doc.coverUrl}
              alt={doc.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
            />
          </div>
        ) : (
          <div className="relative w-full h-full bg-[#121212] rounded-r-2xl shadow-2xl border-l-[12px] border-black overflow-hidden flex flex-col justify-between p-8 sm:p-10 text-center">
            <h4 className="text-white text-sm sm:text-base font-bold leading-relaxed line-clamp-4">
              {doc.title}
            </h4>
            {/* RUTA ACTUALIZADA A 512 */}
            <img
              src="/icon-512.png"
              className="w-6 h-6 mx-auto opacity-30"
              alt=""
            />
          </div>
        )}
      </div>

      <div className="mt-10 sm:mt-14 text-center w-full max-w-[260px] sm:max-w-[280px] space-y-4 sm:space-y-6">
        <h3 className="text-gray-900 font-black text-lg sm:text-xl h-12 sm:h-14 line-clamp-2 tracking-tighter">
          {doc.title}
        </h3>

        {hasAccess ? (
          <Link
            href={`/documentos/${doc.id}`}
            className="inline-flex items-center justify-center w-full py-4 sm:py-5 bg-black text-white text-[10px] sm:text-[11px] font-black uppercase tracking-[0.4em] rounded-full hover:bg-amber-600 transition-all shadow-xl"
          >
            Iniciar Lectura
          </Link>
        ) : (
          <button
            onClick={() => setShowModal(true)}
            className="w-full py-4 sm:py-5 bg-white text-amber-600 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] rounded-full border-2 border-amber-100 hover:bg-amber-50 transition-all shadow-lg"
          >
            Solicitar Acceso
          </button>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 max-w-sm w-full shadow-2xl">
            <form onSubmit={handleRequest} className="space-y-5">
              <h3 className="text-center font-bold text-gray-900">Solicitar Volumen</h3>
              <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest">
                Déjanos tu WhatsApp para coordinar el acceso
              </p>
              <input
                required
                type="tel"
                placeholder="+52 55..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#fcfaf7] border border-amber-100 rounded-2xl px-5 py-3 text-sm outline-none"
              />
              <button
                type="submit"
                disabled={sending || !userEmail}
                className="w-full py-4 bg-black text-white rounded-full font-bold text-[10px] uppercase tracking-[0.4em]"
              >
                {sending ? "Enviando..." : "Enviar Solicitud"}
              </button>
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="w-full text-[9px] uppercase tracking-widest text-gray-300 font-bold"
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}