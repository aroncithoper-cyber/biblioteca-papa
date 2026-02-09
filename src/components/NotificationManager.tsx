"use client";

import { useEffect } from "react";
import { getMessaging, getToken } from "firebase/messaging";
import { app } from "@/lib/firebase"; 

export default function NotificationManager() {
  useEffect(() => {
    async function requestPermission() {
      try {
        // 1. Pedimos permiso al navegador
        const permission = await Notification.requestPermission();
        
        if (permission === "granted") {
          console.log("🔔 Permiso de notificación concedido.");

          // 2. Obtenemos el Token único del dispositivo
          const messaging = getMessaging(app);
          
          const currentToken = await getToken(messaging, {
            vapidKey: "BFlxGRnMNZ9xXK5WT7K0LzAt56PKDZ64kyPfb8OIOCWimsg4zupJdFcs3G2wnyRMOqxREywZBl1Rdzo5G6es03E"
          });

          if (currentToken) {
            console.log("🎟️ Token generado:", currentToken);
            // En el futuro, aquí guardaremos este token en la base de datos
          } else {
            console.log("No se pudo obtener el token.");
          }
        } else {
          console.log("🔕 Permiso denegado.");
        }
      } catch (error) {
        console.log("Error al activar notificaciones:", error);
      }
    }

    // Ejecutamos la petición
    requestPermission();

  }, []);

  return null; // No muestra nada visual, solo trabaja en el fondo
}