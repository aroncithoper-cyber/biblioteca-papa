import { NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    const { title, body } = await request.json();

    // 1. Buscamos los tokens en Firestore
    // Aseguramos que busque en la colección correcta
    const tokensSnapshot = await adminDb.collection("fcm_tokens").get();
    
    // Convertimos y limpiamos la lista
    const tokens = tokensSnapshot.docs
      .map((doc) => doc.data().token)
      .filter((token) => token && typeof token === 'string' && token.length > 10);

    // Diagnóstico en consola (lo verás en los logs de Vercel)
    console.log(`🔍 Diagnóstico: Encontrados ${tokens.length} tokens válidos en la base de datos.`);

    if (tokens.length === 0) {
      return NextResponse.json({ 
        success: false, 
        sentCount: 0, 
        message: "La base de datos de tokens está vacía. Nadie se ha registrado aún." 
      });
    }

    // 2. Preparamos el mensaje
    const message = {
      notification: {
        title: title,
        body: body,
      },
      tokens: tokens,
    };

    // 3. Enviamos
    const response = await adminMessaging.sendEachForMulticast(message);

    console.log(`✅ Resultado del envío: ${response.successCount} éxitos, ${response.failureCount} fallos.`);

    // Opcional: Limpiar tokens viejos que dieron error
    if (response.failureCount > 0) {
       console.log("⚠️ Se detectaron tokens inválidos. (Pendiente de limpieza)");
    }

    return NextResponse.json({ 
      success: true, 
      sentCount: response.successCount,
      failureCount: response.failureCount
    });

  } catch (error: any) {
    console.error("❌ ERROR CRÍTICO EN API:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}