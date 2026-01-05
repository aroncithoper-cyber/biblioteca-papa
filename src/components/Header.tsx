"use client";

import Link from "next/link";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  // Detectar si hay un usuario logueado para mostrar/ocultar botones
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* Logo / Título con estilo minimalista */}
        <Link href="/" className="group flex flex-col">
          <span className="text-lg font-bold tracking-[0.15em] uppercase text-gray-900 group-hover:text-amber-700 transition-colors">
            Consejero del Obrero
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-sans font-medium">
            Formación y Edificación Espiritual
          </span>
        </Link>

        {/* Navegación Discreta */}
        <nav className="flex items-center gap-6">
          {user ? (
            <>
              {/* Solo visible si está logueado, con estilo muy sobrio */}
              <Link
                href="/admin"
                className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 hover:text-black transition-all border-b border-transparent hover:border-black py-1"
              >
                Gestión Editorial
              </Link>
              
              <button
                onClick={logout}
                className="text-[10px] font-bold tracking-[0.2em] uppercase bg-gray-900 text-white px-4 py-2 rounded-sm hover:bg-black transition-all shadow-sm"
              >
                Salir
              </button>
            </>
          ) : (
            /* Botón de login casi invisible para el público */
            <Link 
              href="/login" 
              className="opacity-0 hover:opacity-100 text-[9px] uppercase tracking-[0.3em] text-gray-300 transition-opacity px-2 py-1"
            >
              Acceso
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}