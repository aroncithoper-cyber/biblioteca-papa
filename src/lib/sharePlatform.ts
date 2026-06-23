import { getDictionary, type Locale } from "@/i18n";

export const PLATFORM_SHARE_TITLE = "Consejero del Obrero";

export const PLATFORM_SHARE_MESSAGE =
  "Te comparto la plataforma Consejero del Obrero, una herramienta de apoyo para consulta, enseñanzas y edificación espiritual.";

export function getPlatformShareContent(locale: Locale = "es") {
  const t = getDictionary(locale).share;
  return { title: t.title, message: t.message };
}

export function getPlatformShareUrl(): string {
  if (typeof window === "undefined") {
    return "https://www.consejerodelobrero.org";
  }
  return window.location.origin;
}

export function getPlatformShareText(locale: Locale = "es"): string {
  const { message } = getPlatformShareContent(locale);
  return `${message}\n\n${getPlatformShareUrl()}`;
}

async function copyPlatformLink(locale: Locale = "es"): Promise<void> {
  const text = getPlatformShareText(locale);
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const input = document.createElement("textarea");
    input.value = text;
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
  }
}

/** Comparte solo la plataforma (origen), nunca rutas de libros ni PDFs. */
export async function sharePlatform(locale: Locale = "es"): Promise<"shared" | "copied"> {
  const url = getPlatformShareUrl();
  const { title, message } = getPlatformShareContent(locale);

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({
        title,
        text: message,
        url,
      });
      return "shared";
    } catch (err) {
      if ((err as Error)?.name === "AbortError") {
        throw err;
      }
    }
  }

  await copyPlatformLink(locale);
  return "copied";
}
