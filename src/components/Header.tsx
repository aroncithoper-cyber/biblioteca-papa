"use client";



import Link from "next/link";

import { signOut, onAuthStateChanged, User } from "firebase/auth";

import { auth, db } from "@/lib/firebase";

import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";

import { collection, getDocs, query } from "firebase/firestore";

import MobileNav from "@/components/MobileNav";
import { isAdminEmail } from "@/lib/adminEmails";
import { LanguageSelector, useLanguage } from "@/lib/language";



const iconBtnClass =

  "min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full transition-all flex-shrink-0";



export default function Header() {

  const router = useRouter();
  const { t } = useLanguage();

  const [user, setUser] = useState<User | null>(null);

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);



  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const [searchResults, setSearchResults] = useState<{
    docs: any[];
    videos: any[];
    ensenanzas: any[];
  }>({
    docs: [],
    videos: [],
    ensenanzas: [],
  });

  const [searching, setSearching] = useState(false);



  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {

      setUser(currentUser);

    });

    return () => unsubscribe();

  }, []);



  useEffect(() => {

    if (searchTerm.length < 2) {

      setSearchResults({ docs: [], videos: [], ensenanzas: [] });

      return;

    }



    const delayDebounceFn = setTimeout(async () => {

      setSearching(true);

      try {

        const term = searchTerm.toLowerCase();



        const qDocs = query(collection(db, "documents"));

        const snapDocs = await getDocs(qDocs);

        const filteredDocs = snapDocs.docs

          .map((d) => ({ id: d.id, ...d.data() }))

          .filter((d: any) => d.title.toLowerCase().includes(term));



        const qVids = query(collection(db, "videos"));

        const snapVids = await getDocs(qVids);

        const filteredVids = snapVids.docs

          .map((v) => ({ id: v.id, ...v.data() }))

          .filter(

            (v: any) =>

              v.title.toLowerCase().includes(term) ||

              v.description?.toLowerCase().includes(term)

          );



        const qEns = query(collection(db, "ensenanzas"));

        const snapEns = await getDocs(qEns);

        const filteredEns = snapEns.docs

          .map((e) => ({ id: e.id, ...e.data() }))

          .filter((e: any) => {

            const haystack = [e.title, e.description, e.category, e.predicador]

              .filter(Boolean)

              .join(" ")

              .toLowerCase();

            return haystack.includes(term);

          });



        setSearchResults({ docs: filteredDocs, videos: filteredVids, ensenanzas: filteredEns });

      } catch (error) {

        console.error("Error en búsqueda", error);

      } finally {

        setSearching(false);

      }

    }, 400);



    return () => clearTimeout(delayDebounceFn);

  }, [searchTerm]);



  const logout = async () => {

    try {

      await signOut(auth);

    } finally {

      router.push("/");

    }

  };



  const isAdmin = isAdminEmail(user?.email);



  const handleSupport = () => {

    const message = encodeURIComponent(

      "Hola, necesito ayuda con la plataforma Consejero del Obrero."

    );

    window.open(`https://wa.me/5215530270067?text=${message}`, "_blank");

  };



  return (

    <>

      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-amber-100/50 transition-all duration-300">

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-2 min-w-0">

          {/* LOGO */}

          <Link

            href="/"

            className="group flex items-center gap-2 md:gap-4 active:scale-95 transition-transform min-w-0 flex-shrink"

          >

            <div className="relative flex-shrink-0">

              <div className="absolute -inset-1 bg-amber-200 rounded-full blur opacity-0 group-hover:opacity-40 transition-opacity duration-500" />

              <img

                src="/icon-512.png"

                alt="Logo"

                className="relative w-9 h-9 md:w-10 md:h-10 rounded-full grayscale group-hover:grayscale-0 transition-all duration-500 border border-amber-100 p-0.5 bg-white object-cover shadow-sm"

              />

            </div>

            <div className="flex flex-col text-left min-w-0">

              <span className="text-[11px] md:text-xs font-black tracking-[0.25em] md:tracking-[0.3em] uppercase text-gray-900 leading-none mb-0.5 truncate">

                Consejero

              </span>

              <span className="hidden sm:block text-[8px] uppercase tracking-[0.4em] text-amber-600/60 font-bold leading-none">

                Legacy Digital

              </span>

            </div>

          </Link>



          {/* ACCIONES + NAVEGACIÓN */}

          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-6 flex-shrink-0">

            <button

              type="button"

              onClick={() => setIsSearchOpen(true)}

              className={`${iconBtnClass} text-gray-400 hover:bg-gray-100 hover:text-amber-600`}

              title={t.nav.search}

              aria-label={t.nav.search}

            >

              <svg

                xmlns="http://www.w3.org/2000/svg"

                fill="none"

                viewBox="0 0 24 24"

                strokeWidth={2}

                stroke="currentColor"

                className="w-5 h-5"

              >

                <path

                  strokeLinecap="round"

                  strokeLinejoin="round"

                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"

                />

              </svg>

            </button>



            <button

              type="button"

              onClick={handleSupport}

              className={`${iconBtnClass} bg-green-50 text-green-600 border border-green-100 hover:bg-green-600 hover:text-white shadow-sm`}

              title={t.nav.support}

              aria-label={t.nav.support}

            >

              <span className="text-base font-bold">?</span>

            </button>



            <LanguageSelector />

            {user ? (

              <>

                {/* --- NAVEGACIÓN DESKTOP --- */}

                <nav className="hidden md:flex items-center gap-6">

                  {isAdmin ? (

                    <Link

                      href="/admin"

                      className="text-[10px] font-bold tracking-[0.2em] uppercase text-amber-700 bg-amber-50 px-4 py-2 rounded-full border border-amber-100 shadow-sm hover:bg-amber-100 transition-colors"

                    >

                      {t.nav.panel}

                    </Link>

                  ) : null}



                  <Link

                    href="/biblioteca"

                    className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500 hover:text-black transition-colors"

                  >

                    {t.nav.books}

                  </Link>



                  <Link

                    href="/estante"

                    className="text-[10px] font-bold tracking-[0.2em] uppercase text-amber-700 hover:text-amber-900 transition-colors"

                  >

                    {t.nav.myShelf}

                  </Link>



                  <Link

                    href="/aprender"

                    className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 hover:text-amber-600 transition-colors"

                  >

                    {t.nav.learn}

                  </Link>



                  <Link

                    href="/ensenanzas"

                    className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 hover:text-amber-600 transition-colors flex items-center gap-1.5"

                  >

                    {t.nav.teachings}

                    <span className="bg-amber-100 text-amber-700 text-[6px] px-1.5 py-0.5 rounded-full border border-amber-200 animate-pulse">

                      {t.nav.new}

                    </span>

                  </Link>



                  <Link

                    href="/biografia"

                    className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 hover:text-amber-600 transition-colors"

                  >

                    {t.nav.author}

                  </Link>



                  <Link

                    href="/galeria"

                    className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 hover:text-amber-600 transition-colors"

                  >

                    {t.nav.gallery}

                  </Link>



                  <button

                    type="button"

                    onClick={logout}

                    className="text-[10px] font-bold tracking-[0.2em] uppercase bg-black text-white px-5 py-2.5 rounded-full hover:bg-amber-700 transition-all shadow-lg active:scale-90"

                  >

                    {t.nav.signOut}

                  </button>

                </nav>



                {/* --- MENÚ MÓVIL --- */}

                <button

                  type="button"

                  onClick={() => setIsMobileNavOpen(true)}

                  className={`md:hidden ${iconBtnClass} bg-gray-900 text-white hover:bg-amber-700`}

                  aria-label={t.nav.openMenu}

                  aria-expanded={isMobileNavOpen}

                >

                  <svg

                    xmlns="http://www.w3.org/2000/svg"

                    fill="none"

                    viewBox="0 0 24 24"

                    strokeWidth={2}

                    stroke="currentColor"

                    className="w-5 h-5"

                  >

                    <path

                      strokeLinecap="round"

                      strokeLinejoin="round"

                      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"

                    />

                  </svg>

                </button>

              </>

            ) : (

              <Link

                href="/biblioteca"

                className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-900 bg-white border border-gray-200 px-4 md:px-6 min-h-[44px] flex items-center rounded-full hover:bg-black hover:text-white hover:border-black transition-all shadow-sm"

              >

                {t.nav.enter}

              </Link>

            )}

          </div>

        </div>

      </header>

      {user && (
        <MobileNav
          isOpen={isMobileNavOpen}
          onClose={() => setIsMobileNavOpen(false)}
          isAdmin={isAdmin}
          onLogout={logout}
        />
      )}

      {/* --- MODAL DE BÚSQUEDA --- */}

      {isSearchOpen && (

        <div className="fixed inset-0 z-[200] bg-white/95 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200">

          <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 h-full flex flex-col">

            <div className="flex justify-between items-center mb-6 sm:mb-8">

              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tighter">

                {t.search.title}

              </h2>

              <button

                type="button"

                onClick={() => {

                  setIsSearchOpen(false);

                  setSearchTerm("");

                }}

                className="min-w-[44px] min-h-[44px] rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors text-xl font-bold flex items-center justify-center"

                aria-label={t.search.close}

              >

                ✕

              </button>

            </div>



            <div className="relative mb-8 sm:mb-12">

              <input

                autoFocus

                type="text"

                placeholder={t.search.placeholder}

                className="w-full bg-transparent border-b-[3px] border-gray-100 text-xl sm:text-3xl md:text-5xl py-3 sm:py-4 outline-none focus:border-amber-500 transition-colors font-serif placeholder:text-gray-200 text-gray-900"

                value={searchTerm}

                onChange={(e) => setSearchTerm(e.target.value)}

              />

              {searching && (

                <div className="absolute right-0 top-1/2 -translate-y-1/2">

                  <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />

                </div>

              )}

            </div>



            <div className="flex-1 overflow-y-auto pb-20 custom-scrollbar grid md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 content-start">

              <div>

                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-6 flex items-center gap-2">

                  {t.search.booksFound}{" "}

                  <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">

                    {searchResults.docs.length}

                  </span>

                </h3>

                <div className="space-y-3">

                  {searchResults.docs.map((d) => (

                    <Link

                      key={d.id}

                      href={`/documentos/${d.id}`}

                      onClick={() => setIsSearchOpen(false)}

                      className="group flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:border-amber-300 hover:shadow-lg transition-all"

                    >

                      <div className="w-12 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">

                        {d.coverUrl ? (

                          <img src={d.coverUrl} className="w-full h-full object-cover" alt="" />

                        ) : (

                          <div className="w-full h-full flex items-center justify-center text-[10px]">

                            📖

                          </div>

                        )}

                      </div>

                      <div className="min-w-0">

                        <p className="font-bold text-gray-900 group-hover:text-amber-700 transition-colors line-clamp-1">

                          {d.title}

                        </p>

                        <p className="text-[9px] uppercase tracking-wider text-gray-400">

                          {t.search.goToReading}

                        </p>

                      </div>

                    </Link>

                  ))}

                  {searchTerm.length > 2 && searchResults.docs.length === 0 && (

                    <p className="text-sm text-gray-300 italic">{t.search.noBooks}</p>

                  )}

                </div>

              </div>



              <div>

                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-6 flex items-center gap-2">

                  {t.search.studyVideos}{" "}

                  <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full">

                    {searchResults.videos.length}

                  </span>

                </h3>

                <div className="space-y-3">

                  {searchResults.videos.map((v) => (

                    <Link

                      key={v.id}

                      href="/aprender"

                      onClick={() => setIsSearchOpen(false)}

                      className="group flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:border-red-300 hover:shadow-lg transition-all"

                    >

                      <div className="w-16 h-12 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden relative">

                        <img

                          src={`https://img.youtube.com/vi/${v.youtubeId}/default.jpg`}

                          className="w-full h-full object-cover"

                          alt=""

                        />

                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-transparent transition-all">

                          <span className="text-white text-xs">▶</span>

                        </div>

                      </div>

                      <div className="min-w-0">

                        <p className="font-bold text-gray-900 group-hover:text-red-700 transition-colors line-clamp-1">

                          {v.title}

                        </p>

                        <p className="text-[9px] text-gray-400 line-clamp-1">{v.description}</p>

                      </div>

                    </Link>

                  ))}

                  {searchTerm.length > 2 && searchResults.videos.length === 0 && (

                    <p className="text-sm text-gray-300 italic">{t.search.noVideos}</p>

                  )}

                </div>

              </div>

              <div>

                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-6 flex items-center gap-2">

                  {t.nav.teachings}{" "}

                  <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">

                    {searchResults.ensenanzas.length}

                  </span>

                </h3>

                <div className="space-y-3">

                  {searchResults.ensenanzas.map((e) => (

                    <Link

                      key={e.id}

                      href={`/ensenanzas/${e.id}`}

                      onClick={() => setIsSearchOpen(false)}

                      className="group flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:border-amber-300 hover:shadow-lg transition-all"

                    >

                      <div className="w-12 h-12 bg-amber-50 rounded-xl flex-shrink-0 flex items-center justify-center text-xl border border-amber-100">

                        🎧

                      </div>

                      <div className="min-w-0 flex-1">

                        <p className="font-bold text-gray-900 group-hover:text-amber-700 transition-colors line-clamp-1">

                          {e.title}

                        </p>

                        <p className="text-[9px] uppercase tracking-wider text-amber-600 font-bold">

                          {t.search.teachingLabel}{e.category ? ` · ${e.category}` : ""}

                        </p>

                        {e.predicador && (

                          <p className="text-[9px] text-gray-400 line-clamp-1 mt-0.5">{e.predicador}</p>

                        )}

                      </div>

                    </Link>

                  ))}

                  {searchTerm.length > 2 && searchResults.ensenanzas.length === 0 && (

                    <p className="text-sm text-gray-300 italic">{t.search.noTeachings}</p>

                  )}

                </div>

              </div>

            </div>

          </div>

        </div>

      )}

    </>

  );

}


