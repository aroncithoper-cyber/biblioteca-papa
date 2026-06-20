export type BookRequestStatus = "pendiente" | "aprobada" | "rechazada";

export interface BookRequest {
  id: string;
  bookId: string;
  bookTitle?: string;
  userEmail?: string;
  userName?: string;
  name?: string;
  whatsapp?: string;
  status?: BookRequestStatus | string;
  createdAt?: unknown;
  approvedAt?: unknown;
  approvedBy?: string;
  notifiedAt?: unknown;
  notifiedBy?: string;
}

export function getRequestUserName(req: BookRequest): string {
  const name = (req.userName || req.name || "").trim();
  return name;
}

export function getRequestStatus(req: BookRequest): BookRequestStatus {
  const status = (req.status || "pendiente").toLowerCase();
  if (status === "aprobada" || status === "approved") return "aprobada";
  if (status === "rechazada" || status === "rejected") return "rechazada";
  return "pendiente";
}

export type ApprovedNotifyFilter = "todas" | "no_avisadas" | "avisadas";

export function isRequestNotified(req: BookRequest): boolean {
  return Boolean(req.notifiedAt);
}

/** Formatea timestamp de Firestore para mostrar en tarjetas. */
export function formatRequestTimestamp(value: unknown): string | null {
  if (!value) return null;

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date })
      .toDate()
      .toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
  }

  if (value instanceof Date) {
    return value.toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
  }

  return null;
}

export function matchesApprovedNotifyFilter(
  req: BookRequest,
  filter: ApprovedNotifyFilter
): boolean {
  if (filter === "todas") return true;
  const notified = isRequestNotified(req);
  if (filter === "avisadas") return notified;
  return !notified;
}

/** Limpia el número y aplica prefijo México (52) si no lo trae. */
export function normalizeWhatsAppNumber(raw: string | undefined | null): string | null {
  if (!raw?.trim()) return null;

  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  if (digits.startsWith("52")) {
    return digits;
  }

  return `52${digits}`;
}

export function buildAuthorizationMessage(bookTitle: string, userName?: string): string {
  const title = bookTitle.trim() || "el libro solicitado";
  const greeting = userName?.trim()
    ? `Paz a vos, hermano(a) ${userName.trim()}.`
    : "Paz a vos.";

  return `${greeting}

Se ha autorizado tu acceso al libro:

"${title}"

Puedes ingresar a la plataforma Consejero del Obrero con tu correo registrado y consultarlo desde la sección Biblioteca.

Este material es para consulta y edificación. Te pedimos usarlo con respeto y conforme al propósito para el que fue compartido.

Dios te bendiga.`;
}

export function buildWhatsAppUrl(phone: string | undefined | null, message: string): string | null {
  const normalized = normalizeWhatsAppNumber(phone);
  if (!normalized) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function requestMatchesSearch(req: BookRequest, term: string): boolean {
  if (!term.trim()) return true;
  const q = term.trim().toLowerCase();
  const fields = [
    getRequestUserName(req),
    req.userEmail || "",
    req.whatsapp || "",
    req.bookTitle || "",
  ];
  return fields.some((f) => f.toLowerCase().includes(q));
}
