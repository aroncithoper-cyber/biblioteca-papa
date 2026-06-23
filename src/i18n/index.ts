import es, { type Dictionary } from "./es";
import en from "./en";

export type Locale = "es" | "en";

export const DEFAULT_LOCALE: Locale = "es";
export const STORAGE_KEY = "app_locale";

const dictionaries: Record<Locale, Dictionary> = { es, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? es;
}

export function detectLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "es" || stored === "en") return stored;

  if (navigator.language?.toLowerCase().startsWith("en")) return "en";

  return DEFAULT_LOCALE;
}

export type { Dictionary };
