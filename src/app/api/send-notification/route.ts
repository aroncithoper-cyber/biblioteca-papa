import { NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    const { title, body } = await request.json();

    if (!title || !body) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    // 1. Buscamos TODOS los tokens guardados en la colección fcm_tokens
    const tokensSnapshot = await adminDb.collection("fcm_tokens").get();
    
    // Extraemos solo los tokens válidos
    const tokens = tokensSnapshot.docs
      .map((doc) => doc.data().token)
      .filter((token) => token); // Filtramos vacíos

    if (tokens.length === 0) {
      return NextResponse.json({ success: false, message: "No hay dispositivos registrados aún" });
    }

    console.log(`🚀 Enviando a ${tokens.length} dispositivos...`);

    // 2. Enviamos el mensaje masivo
    const message = {
      notification: {
        title: title,
        body: body,
      },
      tokens: tokens,
    };

    const response = await adminMessaging.sendEachForMulticast(message);

    return NextResponse.json({ 
      success: true, 
      sentCount: response.successCount, 
      failureCount: response.failureCount 
    });

  } catch (error: any) {
    console.error("Error enviando notificaciones:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}