"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { usePathname, useRouter } from "next/navigation";

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // RUTAS PÚBLICAS (no piden login)
  // Nota: Agrega aquí cualquier otra ruta que quieras que sea libre
  const PUBLIC_ROUTES = ["/", "/instalar", "/login", "/registro"];

  const isPublic = PUBLIC_ROUTES.includes(pathname);

  // 1. Detectar usuario
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 2. Redirección Segura (Aquí es donde arreglamos el error)
  useEffect(() => {
    // Solo redirigimos si YA cargó, NO es pública y NO hay usuario
    if (!loading && !isPublic && !user) {
      router.push("/login");
    }
  }, [loading, isPublic, user, router]);

  // Si la ruta es pública, dejamos pasar sin bloquear
  if (isPublic) {
    return <>{children}</>;
  }

  // Pantalla de Carga "Super Pro"
  // Se muestra mientras verifica el usuario o mientras redirige
  if (loading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfaf7] gap-4">
        {/* Spinner elegante color Ámbar */}
        <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-900/40 animate-pulse">
          Verificando...
        </p>
      </div>
    );
  }

  // Ruta privada y CON usuario confirmado
  return <>{children}</>;
}