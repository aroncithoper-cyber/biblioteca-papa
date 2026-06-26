import { auth } from "@/lib/firebase";

type NotifyType = "book_request" | "user_registration";

type BookRequestPayload = {
  type: "book_request";
  bookId: string;
  requestId: string;
};

type RegistrationPayload = {
  type: "user_registration";
};

type NotifyPayload = BookRequestPayload | RegistrationPayload;

/** Llama a la API de avisos sin bloquear la UX si falla. */
export async function notifyTelegramAdmin(payload: NotifyPayload): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const idToken = await user.getIdToken();

    await fetch("/api/telegram/notify", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn("[telegram] No se pudo enviar aviso al admin:", err);
  }
}

export function notifyTelegramBookRequest(
  bookId: string,
  requestId: string
): void {
  void notifyTelegramAdmin({ type: "book_request", bookId, requestId });
}

export function notifyTelegramRegistration(): void {
  void notifyTelegramAdmin({ type: "user_registration" });
}
