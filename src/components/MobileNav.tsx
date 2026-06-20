"use client";

import Link from "next/link";
import { useEffect } from "react";

type NavItem = {
  href: string;
  label: string;
  icon?: string;
  badge?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onLogout: () => void;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/biblioteca", label: "Libros", icon: "📚" },
  { href: "/ensenanzas", label: "Enseñanzas", icon: "🎧", badge: "NUEVO" },
  { href: "/aprender", label: "Aprender", icon: "📺" },
  { href: "/estante", label: "Mi Estante", icon: "📑" },
  { href: "/galeria", label: "Galería", icon: "🖼️" },
  { href: "/biografia", label: "Autor", icon: "✍️" },
  { href: "/instalar", label: "Instalar", icon: "📲" },
];

export default function MobileNav({ isOpen, onClose, isAdmin, onLogout }: Props) {
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] md:hidden">
      <button
        type="button"
        aria-label="Cerrar menú"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <nav
        className="absolute top-0 right-0 h-full w-[min(100%,320px)] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        aria-label="Menú principal"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-amber-100">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-900">
            Menú
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors text-lg font-bold"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 px-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 min-h-[48px] px-4 py-3 rounded-2xl text-sm font-bold text-gray-800 hover:bg-amber-50 hover:text-amber-900 transition-colors active:bg-amber-100"
            >
              {item.icon && <span className="text-lg w-7 text-center flex-shrink-0">{item.icon}</span>}
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}

          {isAdmin && (
            <Link
              href="/admin"
              onClick={onClose}
              className="flex items-center gap-3 min-h-[48px] px-4 py-3 mt-1 rounded-2xl text-sm font-bold text-amber-800 bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-colors"
            >
              <span className="text-lg w-7 text-center flex-shrink-0">⚙️</span>
              <span className="flex-1">Panel Admin</span>
            </Link>
          )}
        </div>

        <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-amber-100">
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full min-h-[48px] flex items-center justify-center gap-2 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-amber-700 transition-colors active:scale-[0.98]"
          >
            Salir
          </button>
        </div>
      </nav>
    </div>
  );
}
