"use client";

import { useCallback, useState } from "react";
import { sharePlatform } from "@/lib/sharePlatform";
import { useLanguage } from "@/lib/language";

type Variant = "nav" | "inline" | "footer";

type Props = {
  variant?: Variant;
  className?: string;
  onAfterShare?: () => void;
};

export default function SharePlatformButton({
  variant = "inline",
  className = "",
  onAfterShare,
}: Props) {
  const [copied, setCopied] = useState(false);
  const { locale, t } = useLanguage();

  const handleShare = useCallback(async () => {
    try {
      const result = await sharePlatform(locale);
      if (result === "copied") {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2500);
      }
      onAfterShare?.();
    } catch {
      // Usuario canceló el diálogo nativo
    }
  }, [onAfterShare, locale]);

  const baseNav =
    "mobile-nav-link flex min-h-[48px] w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-amber-50 hover:text-amber-900 active:bg-amber-100";
  const baseInline =
    "btn-premium inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border border-gray-200 bg-white/90 text-gray-700 shadow-sm hover:bg-amber-50 hover:border-amber-200 active:scale-[0.98]";
  const baseFooter =
    "text-[10px] uppercase tracking-[0.25em] text-gray-400 hover:text-amber-400 transition-colors font-bold";

  const classNames =
    variant === "nav"
      ? `${baseNav} ${className}`
      : variant === "footer"
      ? `${baseFooter} ${className}`
      : `${baseInline} ${className}`;

  const wrapperClass =
    variant === "nav"
      ? "relative w-full"
      : variant === "footer"
      ? "relative flex flex-col items-center"
      : "relative flex w-full flex-col items-center sm:inline-flex sm:w-auto";

  return (
    <div className={wrapperClass}>
      <button type="button" onClick={handleShare} className={classNames}>
        <span className={variant === "nav" ? "w-7 flex-shrink-0 text-center text-lg" : "text-base"}>
          📤
        </span>
        <span className={variant === "nav" ? "flex-1 text-left" : undefined}>
          {t.share.platform}
        </span>
      </button>
      {copied && (
        <p
          className={
            variant === "nav"
              ? "mt-2 text-center text-[10px] text-amber-700 font-medium animate-in fade-in"
              : variant === "footer"
              ? "mt-3 text-[10px] text-amber-400 font-medium animate-in fade-in"
              : "absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/80 px-3 py-1.5 text-[10px] text-white font-medium animate-in fade-in"
          }
          role="status"
        >
          {t.share.linkCopied}
        </p>
      )}
    </div>
  );
}
