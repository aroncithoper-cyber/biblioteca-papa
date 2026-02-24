import admin from "firebase-admin";

let adminDb: admin.firestore.Firestore | null = null;
let adminMessaging: admin.messaging.Messaging | null = null;

const hasCredentials =
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY;

if (!admin.apps.length && hasCredentials) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID as string,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL as string,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    }),
  });
}

if (admin.apps.length) {
  adminDb = admin.firestore();
  adminMessaging = admin.messaging();
}

export { adminDb, adminMessaging };