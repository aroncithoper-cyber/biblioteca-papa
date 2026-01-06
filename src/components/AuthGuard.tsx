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
  const PUBLIC_ROUTES = ["/", "/instalar", "/login"];

  const isPublic = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Si la ruta es pública, NO bloqueamos
  if (isPublic) {
    return <>{children}</>;
  }

  // Cargando sesión (spinner ligero, bien para celular)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfaf7]">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Ruta privada y SIN usuario → mandar a login
  if (!user) {
    router.push("/login");
    return null;
  }

  // Ruta privada y CON usuario
  return <>{children}</>;
}
