const TELEGRAM_API = "https://api.telegram.org";

export function isTelegramConfigured(): boolean {
  return Boolean(
    process.env.TELEGRAM_BOT_TOKEN?.trim() &&
      process.env.TELEGRAM_ADMIN_CHAT_ID?.trim()
  );
}

export function getAppAdminUrl(): string {
  const base =
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://consejerodelobrero.org");
  return `${base.replace(/\/$/, "")}/admin`;
}

export function formatNotProvided(value?: string | null): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "No proporcionado";
}

export function buildBookRequestMessage(params: {
  userName?: string | null;
  email: string;
  whatsapp?: string | null;
  bookTitle: string;
}): string {
  return `📚 Nueva solicitud de libro

Hermano: ${formatNotProvided(params.userName)}
Correo: ${params.email}
WhatsApp: ${formatNotProvided(params.whatsapp)}
Libro: ${params.bookTitle}

Revisar en el panel:
${getAppAdminUrl()}`;
}

export function buildRegistrationMessage(params: {
  email: string;
  date: string;
}): string {
  return `👤 Nuevo registro en Consejero del Obrero

Correo: ${params.email}
Fecha: ${params.date}

Revisar en el panel:
${getAppAdminUrl()}`;
}

/** Envía mensaje solo al chat admin configurado. No lanza si faltan variables. */
export async function sendTelegramAdminMessage(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID?.trim();

  if (!token || !chatId) {
    console.warn(
      "[telegram] TELEGRAM_BOT_TOKEN o TELEGRAM_ADMIN_CHAT_ID no configurados; aviso omitido"
    );
    return false;
  }

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[telegram] sendMessage falló:", res.status, body);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[telegram] Error enviando mensaje:", err);
    return false;
  }
}
