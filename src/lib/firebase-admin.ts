/**
 * Firebase Admin (solo servidor). Se usa para verificar el token ID del usuario
 * en rutas API. Opcional: si no hay credenciales, verifyIdToken devolverá null
 * y la API puede decidir no bloquear (por ejemplo en desarrollo).
 *
 * Configuración: define FIREBASE_SERVICE_ACCOUNT_JSON con el JSON de la cuenta
 * de servicio de Firebase (Project settings > Service accounts > Generate new key).
 */

import * as admin from "firebase-admin";

let app: admin.app.App | null = null;

function getAdminApp(): admin.app.App | null {
  if (app) return app;
  if (typeof process === "undefined") return null;

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      const cred = JSON.parse(json) as admin.ServiceAccount;
      app = admin.initializeApp({ credential: admin.credential.cert(cred) });
      return app;
    } catch {
      // invalid JSON
    }
  }

  // Opcional: credenciales por archivo (GOOGLE_APPLICATION_CREDENTIALS)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      app = admin.initializeApp({ credential: admin.credential.applicationDefault() });
      return app;
    } catch {
      // not available
    }
  }

  return null;
}

export type VerifyResult =
  | { ok: true; decoded?: admin.auth.DecodedIdToken }
  | { ok: false };

/**
 * Verifica el token ID de Firebase Auth.
 * - Si Admin no está configurado: devuelve { ok: true } (se permite la petición en dev).
 * - Si Admin está configurado y el token es válido: { ok: true, decoded }.
 * - Si Admin está configurado y el token es inválido: { ok: false }.
 */
export async function verifyFirebaseToken(idToken: string): Promise<VerifyResult> {
  const a = getAdminApp();
  if (!a) return { ok: true };
  try {
    const decoded = await a.auth().verifyIdToken(idToken);
    return { ok: true, decoded };
  } catch {
    return { ok: false };
  }
}
