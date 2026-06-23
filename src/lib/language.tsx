"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  STORAGE_KEY,
  detectLocale,
  getDictionary,
  type Dictionary,
  type Locale,
} from "@/i18n";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
  ready: boolean;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLocaleState(detectLocale());
    setReady(true);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    localStorage.setItem(STORAGE_KEY, next);
    setLocaleState(next);
    document.documentElement.lang = next;
  }, []);

  useEffect(() => {
    if (ready) {
      document.documentElement.lang = locale;
    }
  }, [locale, ready]);

  const t = useMemo(() => getDictionary(locale), [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, t, ready }),
    [locale, setLocale, t, ready]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}

type LanguageSelectorProps = {
  className?: string;
  compact?: boolean;
};

export function LanguageSelector({ className = "", compact = false }: LanguageSelectorProps) {
  const { locale, setLocale, t } = useLanguage();

  const btnClass = (active: boolean) =>
    `min-h-[32px] px-1.5 transition-colors ${
      active
        ? "text-amber-700 font-black"
        : "text-gray-400 hover:text-gray-700 font-bold"
    }`;

  return (
    <div
      className={`flex items-center gap-0.5 text-[10px] uppercase tracking-wider select-none ${className}`}
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => setLocale("es")}
        className={btnClass(locale === "es")}
        aria-pressed={locale === "es"}
      >
        {t.lang.es}
      </button>
      <span className="text-gray-300 font-light" aria-hidden>
        /
      </span>
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={btnClass(locale === "en")}
        aria-pressed={locale === "en"}
      >
        {t.lang.en}
      </button>
      {!compact && (
        <span className="sr-only">
          {locale === "es" ? "Español" : "English"}
        </span>
      )}
    </div>
  );
}
