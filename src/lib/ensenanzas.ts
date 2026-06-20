/**
 * Modelo de la colección Firestore `ensenanzas`.
 * Solo se guardan links (Telegram / YouTube), nunca archivos de audio.
 *
 * TODO: Configurar reglas de Firestore para que la escritura en `ensenanzas`
 * quede restringida únicamente a usuarios administradores autenticados.
 */

export type EnsenanzaStatus = "published" | "coming_soon";

export type Ensenanza = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  predicador?: string;
  fecha?: string;
  duration?: string;
  telegram_url?: string;
  youtube_url?: string;
  status?: EnsenanzaStatus;
  order?: number;
  createdAt?: { toDate?: () => Date };
  updatedAt?: { toDate?: () => Date };
};

export const AVISO_INSTITUCIONAL =
  "Herramienta local de apoyo ministerial. Este sitio no representa una página oficial de la Administración General ni sustituye los canales oficiales de la Iglesia.";

export const TELEGRAM_CHANNEL_INVITE_URL =
  "https://t.me/+kFyWGajduUcxNTIx";

export const AVISO_COMPARTIR =
  "Los audios se comparten por Telegram para edificación espiritual. Puedes compartirlos con otros hermanos procurando hacerlo con respeto y sin alterar el contenido.";

export const AVISO_USO_RECOMENDADO =
  "Uso recomendado: escucha el audio en Telegram y compártelo con otros hermanos para edificación. Evita modificar el contenido o presentarlo fuera de contexto.";

export type ShareEnsenanzaResult = "shared" | "copied" | "failed";

export function hasTelegramShareUrl(item: Ensenanza): boolean {
  return !!item.telegram_url?.trim();
}

export function buildEnsenanzaShareText(item: Ensenanza): string | null {
  const telegram = item.telegram_url?.trim();
  if (!telegram) return null;

  return [
    "Te comparto esta enseñanza para edificación espiritual:",
    "",
    `"${item.title}"`,
    "",
    "Escúchala en Telegram:",
    telegram,
    "",
    "Si aún no puedes abrir el audio, entra primero al canal:",
    TELEGRAM_CHANNEL_INVITE_URL,
  ].join("\n");
}

export async function shareEnsenanza(item: Ensenanza): Promise<ShareEnsenanzaResult> {
  const text = buildEnsenanzaShareText(item);
  if (!text) return "failed";

  const telegram = item.telegram_url!.trim();

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: item.title,
        text,
        url: telegram,
      });
      return "shared";
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return "failed";
      }
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}

/** Audio disponible solo si está publicado y tiene link de Telegram. */
export function isAudioAvailable(item: Ensenanza): boolean {
  return item.status !== "coming_soon" && !!item.telegram_url?.trim();
}

export function sortEnsenanzas(items: Ensenanza[]): Ensenanza[] {
  return [...items].sort((a, b) => {
    const orderA = typeof a.order === "number" ? a.order : 9999;
    const orderB = typeof b.order === "number" ? b.order : 9999;
    if (orderA !== orderB) return orderA - orderB;

    const dateA = a.createdAt?.toDate?.()?.getTime() ?? 0;
    const dateB = b.createdAt?.toDate?.()?.getTime() ?? 0;
    return dateB - dateA;
  });
}

export function openExternalUrl(url: string) {
  if (!url?.trim()) return;
  window.open(url.trim(), "_blank", "noopener,noreferrer");
}
