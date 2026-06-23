"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import SharePlatformButton from "@/components/SharePlatformButton";
import { LanguageSelector, useLanguage } from "@/lib/language";

type NavItem = {
  href: string;
  labelKey: "books" | "teachings" | "learn" | "myShelf" | "gallery" | "author" | "install";
  icon?: string;
  badge?: boolean;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onLogout: () => void;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/biblioteca", labelKey: "books", icon: "📚" },
  { href: "/ensenanzas", labelKey: "teachings", icon: "🎧", badge: true },
  { href: "/aprender", labelKey: "learn", icon: "📺" },
  { href: "/estante", labelKey: "myShelf", icon: "📑" },
  { href: "/galeria", labelKey: "gallery", icon: "🖼️" },
  { href: "/biografia", labelKey: "author", icon: "✍️" },
  { href: "/instalar", labelKey: "install", icon: "📲" },
];

export default function MobileNav({ isOpen, onClose, isAdmin, onLogout }: Props) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  const navLinkCount = NAV_ITEMS.length + (isAdmin ? 1 : 0);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setClosing(false);
    } else if (visible) {
      setClosing(true);
      const timer = window.setTimeout(() => {
        setVisible(false);
        setClosing(false);
      }, 280);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen, visible]);

  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, onClose]);

  if (!visible || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] md:hidden">
      <button
        type="button"
        aria-label={t.nav.closeMenu}
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm ${
          closing ? "mobile-nav-overlay--closing" : "mobile-nav-overlay"
        }`}
        onClick={onClose}
      />

      <nav
        className={`absolute top-0 right-0 flex h-dvh max-h-dvh w-[min(100%,320px)] min-h-0 flex-col bg-white shadow-2xl ${
          closing ? "mobile-nav-drawer--closing" : "mobile-nav-drawer"
        }`}
        aria-label={t.nav.menu}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-amber-100 px-5 py-4">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-900">
            {t.nav.menu}
          </span>
          <div className="flex items-center gap-3">
            <LanguageSelector compact />
            <button
              type="button"
              onClick={onClose}
              aria-label={t.nav.close}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-gray-100 text-lg font-bold text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 active:scale-[0.98]"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
          {NAV_ITEMS.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              style={{ "--nav-index": index } as CSSProperties}
              className="mobile-nav-link flex min-h-[48px] items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-gray-800 transition-colors hover:bg-amber-50 hover:text-amber-900 active:bg-amber-100"
            >
              {item.icon && (
                <span className="w-7 flex-shrink-0 text-center text-lg">{item.icon}</span>
              )}
              <span className="flex-1">{t.nav[item.labelKey]}</span>
              {item.badge && (
                <span className="rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-700">
                  {t.nav.new}
                </span>
              )}
            </Link>
          ))}

          {isAdmin && (
            <Link
              href="/admin"
              onClick={onClose}
              style={{ "--nav-index": NAV_ITEMS.length } as CSSProperties}
              className="mobile-nav-link mt-1 flex min-h-[48px] items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 transition-colors hover:bg-amber-100"
            >
              <span className="w-7 flex-shrink-0 text-center text-lg">⚙️</span>
              <span className="flex-1">{t.nav.adminPanel}</span>
            </Link>
          )}

          <div
            className="mt-3 border-t border-amber-50 pt-3"
            style={{ "--nav-index": navLinkCount } as CSSProperties}
          >
            <SharePlatformButton variant="nav" onAfterShare={onClose} />
          </div>
        </div>

        <div
          style={{ "--nav-count": navLinkCount } as CSSProperties}
          className="mobile-nav-footer flex-shrink-0 border-t border-amber-100 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-black text-xs font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-amber-700 active:scale-[0.98]"
          >
            {t.nav.signOut}
          </button>
        </div>
      </nav>
    </div>,
    document.body
  );
}
