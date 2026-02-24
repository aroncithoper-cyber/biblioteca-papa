"use client";

import Link from "next/link";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query } from "firebase/firestore";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<{ docs: any[]; videos: any[] }>({
    docs: [],
    videos: [],
  });
  const [searching, setSearching] = useState(false);

  const ADMIN_EMAILS = useMemo(
    () => ["aroncithoper@gmail.com", "e_perezleon@hotmail.com"],
    []
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Búsqueda
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults({ docs: [], videos: [] });
      return;
    }

    const delay = setTimeout(async () => {
      setSearching(true);
      try {
        const term = searchTerm.toLowerCase();

        const qDocs = query(collection(db, "documents"));
        const snapDocs = await getDocs(qDocs);
        const filteredDocs = snapDocs.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((d: any) => d.title?.toLowerCase().includes(term));

        const qVids = query(collection(db, "videos"));
        const snapVids = await getDocs(qVids);
        const filteredVids = snapVids.docs
          .map((v) => ({ id: v.id, ...v.data() }))
          .filter(
            (v: any) =>
              v.title?.toLowerCase().includes(term) ||
              v.description?.toLowerCase().includes(term)
          );

        setSearchResults({ docs: filteredDocs, videos: filteredVids });
      } catch {}
      setSearching(false);
    }, 400);

    return () => clearTimeout(delay);
  }, [searchTerm]);

  const logout = async () => {
    try {
      await signOut(auth);
    } finally {
      router.push("/");
    }
  };

  const isAdmin =
    !!user && ADMIN_EMAILS.includes((user.email || "").toLowerCase());

  return (
    <>
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-amber-100/40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/icon-512.png"
              alt="Consejero del Obrero"
              className="w-10 h-10 rounded-full border border-amber-100 p-0.5 bg-white object-cover"
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900 leading-none">
                Consejero del Obrero
              </span>
              <span className="text-[10px] text-amber-600/70 tracking-widest uppercase">
                Archivo personal
              </span>
            </div>
          </Link>

          {/* NAV */}
          <nav className="flex items-center gap-6 text-[11px] font-semibold uppercase tracking-widest text-gray-500">

            <Link href="/biblioteca" className="hover:text-black transition-colors">
              Biblioteca
            </Link>

            <Link href="/biografia" className="hover:text-black transition-colors">
              Autor
            </Link>

            <Link href="/galeria" className="hidden sm:block hover:text-black transition-colors">
              Galería
            </Link>

            <Link href="/aprender" className="hidden md:block hover:text-black transition-colors">
              Aprender
            </Link>

            {/* Buscador */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="text-gray-400 hover:text-black transition-colors"
              title="Buscar"
            >
              🔎
            </button>

            {isAdmin && (
              <Link
                href="/admin"
                className="text-amber-700 hover:text-amber-900"
              >
                Panel
              </Link>
            )}

            {user ? (
              <button
                onClick={logout}
                className="text-black border border-gray-300 px-4 py-1 rounded-full hover:bg-black hover:text-white transition-all"
              >
                Salir
              </button>
            ) : (
              <Link
                href="/biblioteca"
                className="text-black border border-gray-300 px-4 py-1 rounded-full hover:bg-black hover:text-white transition-all"
              >
                Entrar
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* MODAL BUSCADOR */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[200] bg-white/95 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto px-6 pt-20 h-full flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Buscar</h2>
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchTerm("");
                }}
                className="text-gray-400 hover:text-red-500 text-xl"
              >
                ✕
              </button>
            </div>

            <input
              autoFocus
              type="text"
              placeholder="Escribe un tema o título..."
              className="w-full border-b-2 border-gray-200 text-2xl py-3 outline-none focus:border-amber-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {searching && (
              <div className="mt-6 text-sm text-gray-400">
                Buscando...
              </div>
            )}

            <div className="mt-8 space-y-4 overflow-y-auto">
              {searchResults.docs.map((d) => (
                <Link
                  key={d.id}
                  href={`/documentos/${d.id}`}
                  onClick={() => setIsSearchOpen(false)}
                  className="block p-4 border border-gray-100 rounded-xl hover:border-amber-300 transition"
                >
                  <p className="font-semibold text-gray-900">{d.title}</p>
                </Link>
              ))}

              {searchResults.videos.map((v) => (
                <Link
                  key={v.id}
                  href="/aprender"
                  onClick={() => setIsSearchOpen(false)}
                  className="block p-4 border border-gray-100 rounded-xl hover:border-amber-300 transition"
                >
                  <p className="font-semibold text-gray-900">{v.title}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}