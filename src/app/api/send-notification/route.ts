export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    const { title, body } = await request.json();

    if (!adminDb || !adminMessaging) {
      return NextResponse.json(
        { success: false, error: "Firebase Admin not initialized" },
        { status: 500 }
      );
    }

    const tokensSnapshot = await adminDb.collection("fcm_tokens").get();
    const tokens = tokensSnapshot.docs
      .map((doc) => doc.data().token)
      .filter((token) => token);

    if (tokens.length === 0) {
      return NextResponse.json({ success: false, sentCount: 0 });
    }

    const message = {
      notification: { title, body },
      tokens,
      android: {
        priority: "high" as const,
        notification: {
          sound: "default",
          clickAction: "FLUTTER_NOTIFICATION_CLICK",
        },
      },
      webpush: {
        headers: {
          Urgency: "high",
        },
        notification: {
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          requireInteraction: true,
        },
      },
    };

    const response = await adminMessaging.sendEachForMulticast(message);

    return NextResponse.json({
      success: true,
      sentCount: response.successCount,
    });

  } catch (error: any) {
    console.error("ERROR:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}