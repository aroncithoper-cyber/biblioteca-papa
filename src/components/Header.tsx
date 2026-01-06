"use client";

import Link from "next/link";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  // Lista de administradores autorizados
  const ADMIN_EMAILS = ["aroncithoper@gmail.com", "e_perezleon@hotmail.com"];

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

  // Verificamos si el usuario actual es administrador
  const isAdmin = user && ADMIN_EMAILS.includes(user.email?.toLowerCase() || "");

  return (
    <header className="bg-white/70 backdrop-blur-xl sticky top-0 z-50 border-b border-amber-100/50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Identidad Visual Pro */}
        <Link
          href="/"
          className="group flex items-center gap-4 transition-transform active:scale-95"
        >
          <div className="relative">
            <div className="absolute -inset-1 bg-amber-200 rounded-full blur opacity-0 group-hover:opacity-40 transition-opacity" />
            <img
              src="/icon-192.png
              className="relative w-8 h-8 rounded-full grayscale group-hover:grayscale-0 transition-all duration-500 border border-amber-100 p-0.5 bg-white"
              alt="Logo"
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

        {/* Navegación Refinada */}
        <nav className="flex items-center gap-8">
          {user ? (
            <>
              {/* Si es admin, el link principal es el Panel, si no, la Biblioteca */}
              {isAdmin ? (
                <Link
                  href="/admin"
                  className="text-[10px] font-bold tracking-[0.2em] uppercase text-amber-700 hover:text-amber-900 transition-colors bg-amber-50 px-4 py-2 rounded-full border border-amber-100"
                >
                  Panel de Control
                </Link>
              ) : (
                <Link
                  href="/biblioteca"
                  className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 hover:text-black transition-colors"
                >
                  Biblioteca
                </Link>
              )}

              <Link
                href="/galeria"
                className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 hover:text-black transition-colors"
              >
                Galería
              </Link>

              <button
                onClick={logout}
                className="text-[10px] font-bold tracking-[0.2em] uppercase bg-black text-white px-5 py-2.5 rounded-full hover:bg-amber-700 transition-all shadow-lg shadow-black/5 active:scale-90"
              >
                Salir
              </button>
            </>
          ) : (
            <Link
              href="/biblioteca"
              className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-900 bg-amber-100/50 px-6 py-2.5 rounded-full hover:bg-amber-200 transition-all border border-amber-200"
            >
              Ir a Biblioteca
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}