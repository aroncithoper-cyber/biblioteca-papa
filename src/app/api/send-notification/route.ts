import { NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    const { title, body } = await request.json();

    // 1. Buscamos los tokens en Firestore
    const tokensSnapshot = await adminDb.collection("fcm_tokens").get();
    const tokens = tokensSnapshot.docs
      .map((doc) => doc.data().token)
      .filter((token) => token);

    if (tokens.length === 0) {
      return NextResponse.json({ success: false, sentCount: 0, message: "No hay dispositivos" });
    }

    // 2. Intentamos el envío real
    const message = {
      notification: { title, body },
      tokens: tokens,
    };

    const response = await adminMessaging.sendEachForMulticast(message);

    return NextResponse.json({ 
      success: true, 
      sentCount: response.successCount 
    });

  } catch (error: any) {
    console.error("ERROR CRÍTICO:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}