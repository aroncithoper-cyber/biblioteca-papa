"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user && pathname !== "/login") {
        router.push("/login");
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router, pathname]);

  if (loading) return <div>Cargando…</div>;

  return <>{children}</>;
}
