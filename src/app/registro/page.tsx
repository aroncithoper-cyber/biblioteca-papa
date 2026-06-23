"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { isAdminEmail } from "@/lib/adminEmails";
import { useLanguage } from "@/lib/language";

export default function RegistroPage() {
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace(isAdminEmail(user.email) ? "/admin" : "/biblioteca");
      } else {
        router.replace("/login?register=1");
      }
    });
    return () => unsub();
  }, [router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#fcfaf7] gap-4 font-serif">
      <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-900/40 animate-pulse">
        {t.auth.redirecting}
      </p>
    </main>
  );
}
