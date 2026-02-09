importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Configuración exacta de tu proyecto
const firebaseConfig = {
  apiKey: "AIzaSyAQ0AWFa60v9BKkrPzTL1iexowg2wOvRdY",
  authDomain: "consejerodelobrero-31110.firebaseapp.com",
  projectId: "consejerodelobrero-31110",
  storageBucket: "consejerodelobrero-31110.firebasestorage.app",
  messagingSenderId: "185054276664",
  appId: "1:185054276664:web:761b4e7c260efddc288acd",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Esto hace que la notificación se muestre incluso con la app cerrada
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Notificación recibida:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192.png' // Icono de la app
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});