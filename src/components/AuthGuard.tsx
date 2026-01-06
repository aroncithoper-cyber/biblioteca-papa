"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import LoginScreen from "./LoginScreen"; // Importamos tu nueva pantalla

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfaf7]">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Si no hay usuario, mostramos la "Tarjeta de Presentación" (Login/Registro)
  if (!user) {
    return <LoginScreen />;
  }

  // Si hay usuario, mostramos el contenido de la biblioteca
  return <>{children}</>;
}