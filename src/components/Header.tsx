"use client";

import Link from "next/link";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

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

  const logout = async () => {
    try {
      await signOut(auth);
    } finally {
      router.push("/");
    }
  };

  const isAdmin = !!user && ADMIN_EMAILS.includes((user.email || "").toLowerCase());

  return (
    <header className="bg-white/70 backdrop-blur-xl sticky top-0 z-50 border-b border-amber-100/50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* LOGO CON EFECTO PRO */}
        <Link href="/" className="group flex items-center gap-4 active:scale-95 transition-transform">
          <div className="relative">
            <div className="absolute -inset-1 bg-amber-200 rounded-full blur opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
            {/* Asegúrate de que la ruta de la imagen sea correcta (icon-192 o icon-512) */}
            <img
              src="/icon-512.png" 
              alt="Logo"
              className="relative w-10 h-10 rounded-full grayscale group-hover:grayscale-0 transition-all duration-500 border border-amber-100 p-0.5 bg-white object-cover shadow-sm"
            />
          </div>

          <div className="flex flex-col text-left">
            <span className="text-xs font-black tracking-[0.3em] uppercase text-gray-900 leading-none mb-1">
              Consejero
            </span>
            <span className="text-[8px] uppercase tracking-[0.4em] text-amber-600/60 font-bold leading-none">
              Legacy Digital
            </span>
          </div>
        </Link>

        {/* NAVEGACIÓN INTELIGENTE */}
        <nav className="flex items-center gap-4 sm:gap-6">
          {user ? (
            <>
              {/* LÓGICA DE ROLES */}
              {isAdmin ? (
                <Link
                  href="/admin"
                  className="hidden sm:block text-[10px] font-bold tracking-[0.2em] uppercase text-amber-700 bg-amber-50 px-4 py-2 rounded-full border border-amber-100 shadow-sm hover:bg-amber-100 transition-colors"
                >
                  Panel Editorial
                </Link>
              ) : (
                <Link
                  href="/biblioteca"
                  className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-500 hover:text-black transition-colors"
                >
                  Biblioteca
                </Link>
              )}

              {/* ENLACE GALERÍA */}
              <Link
                href="/galeria"
                className="hidden sm:block text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 hover:text-amber-600 transition-colors"
              >
                Galería
              </Link>

              {/* BOTÓN SALIR */}
              <button
                onClick={logout}
                className="text-[10px] font-bold tracking-[0.2em] uppercase bg-black text-white px-5 py-2.5 rounded-full hover:bg-amber-700 transition-all shadow-lg active:scale-90"
              >
                Salir
              </button>
            </>
          ) : (
            /* BOTÓN PARA INVITADOS */
            <Link
              href="/biblioteca"
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-900 bg-white border border-gray-200 px-6 py-2.5 rounded-full hover:bg-black hover:text-white hover:border-black transition-all shadow-sm"
            >
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}