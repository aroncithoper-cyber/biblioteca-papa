importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// --- AQUÍ DEBE PEGAR SUS DATOS REALES DE FIREBASE ---
// (Búsquelos en Firebase -> Configuración del proyecto -> General -> Sus apps)
firebase.initializeApp({
  apiKey: "AIzaSyAQ0AWFa60v9BKkrPzTL1iexowg2wOvRdY",           // Ejemplo: "AIzaSyD..."
  authDomain: "consejerodelobrero-31110.firebaseapp.com",
  projectId: "consejerodelobrero-31110",
  storageBucket: "consejerodelobrero-31110.firebasestorage.app",
  messagingSenderId: "185054276664",   // Ejemplo: "123456..."
  appId: "1:185054276664:web:761b4e7c260efddc288acd"                   // Ejemplo: "1:123456:web:..."
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje recibido: ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192.png',
    vibrate: [200, 100, 200]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});