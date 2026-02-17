import { adminDb, adminMessaging } from "@/lib/firebaseAdmin"; // Necesitaremos configurar esto
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { title, body } = await request.json();

    // 1. Obtenemos todos los tokens de los hermanos suscritos
    const tokensSnapshot = await adminDb.collection("fcm_tokens").get();
    const tokens = tokensSnapshot.docs.map(doc => doc.data().token);

    if (tokens.length === 0) {
      return NextResponse.json({ message: "No hay suscriptores aún" });
    }

    // 2. Creamos el paquete de notificación
    const message = {
      notification: { title, body },
      tokens: tokens, // Aquí va la lista de todos
    };

    // 3. ¡EL ENVÍO MASIVO!
    const response = await adminMessaging.sendEachForMulticast(message);
    
    return NextResponse.json({ 
      success: true, 
      sentCount: response.successCount 
    });

  } catch (error) {
    return NextResponse.json({ error: "Error al enviar" }, { status: 500 });
  }
}