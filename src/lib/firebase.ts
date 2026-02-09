import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore"; // 1. Importamos esto
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAQ0AWFa60v9BKkrPzTL1iexowg2wOvRdY",
  authDomain: "consejerodelobrero-31110.firebaseapp.com",
  projectId: "consejerodelobrero-31110",
  storageBucket: "consejerodelobrero-31110.firebasestorage.app",
  messagingSenderId: "185054276664",
  appId: "1:185054276664:web:761b4e7c260efddc288acd",
};

// Inicializamos la App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// --- CÓDIGO NUEVO PARA MODO OFFLINE ---
// Solo ejecutamos esto en el navegador (cliente), no en el servidor
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db)
    .catch((err) => {
      if (err.code == 'failed-precondition') {
        // Falló porque hay muchas pestañas abiertas a la vez.
        // Solo la primera pestaña tendrá persistencia.
        console.warn("Persistencia de Firebase limitada a una pestaña.");
      } else if (err.code == 'unimplemented') {
        // El navegador no soporta esta función (muy raro hoy en día).
        console.warn("El navegador no soporta persistencia offline.");
      }
    });
}