import { NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    const { title, body } = await request.json();

    const tokensSnapshot = await adminDb.collection("fcm_tokens").get();
    const tokens = tokensSnapshot.docs
      .map((doc) => doc.data().token)
      .filter((token) => token);

    if (tokens.length === 0) {
      return NextResponse.json({ success: false, sentCount: 0 });
    }

    // CONFIGURACIÓN MEJORADA PARA FORZAR EL "BIP"
    const message = {
      notification: { title, body },
      tokens: tokens,
      // Esto es para Android: Fuerza que suene y despierte
      android: {
        priority: "high" as const,
        notification: {
          sound: "default",
          clickAction: "FLUTTER_NOTIFICATION_CLICK", // Ayuda a que al picar abra la app
        },
      },
      // Esto es para iPhone/Web: Prioridad máxima
      webpush: {
        headers: {
          Urgency: "high",
        },
        notification: {
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          requireInteraction: true, // La notificación no se quita hasta que el usuario la vea
        }
      }
    };

    const response = await adminMessaging.sendEachForMulticast(message);

    return NextResponse.json({ 
      success: true, 
      sentCount: response.successCount 
    });

  } catch (error: any) {
    console.error("ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}