export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { adminAuth, adminDb, adminMessaging } from "@/lib/firebaseAdmin";
import { isAdminEmail } from "@/lib/adminEmails";

async function verifyAdminRequest(request: Request) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const idToken = authHeader.slice(7).trim();
  if (!idToken) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!adminAuth) {
    return NextResponse.json(
      { success: false, error: "Firebase Admin not initialized" },
      { status: 500 }
    );
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);

    if (!isAdminEmail(decoded.email)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    return null;
  } catch {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const authError = await verifyAdminRequest(request);
    if (authError) return authError;

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
