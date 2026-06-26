export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import {
  buildBookRequestMessage,
  buildRegistrationMessage,
  isTelegramConfigured,
  sendTelegramAdminMessage,
} from "@/lib/telegram";
import { getRequestUserName, isPendingRequestStatus } from "@/lib/bookRequests";

const BOOK_ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;
const REQUEST_ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;
const REGISTRATION_WINDOW_MS = 15 * 60 * 1000;
const NOTIFY_LOG = "telegram_notify_log";

type DecodedUser = {
  uid: string;
  email: string;
};

async function verifyAuthenticatedUser(
  request: Request
): Promise<DecodedUser | NextResponse> {
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
    const email = decoded.email?.toLowerCase().trim();

    if (!email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    return { uid: decoded.uid, email };
  } catch {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
}

function parseStrictBody(
  body: unknown
):
  | { type: "book_request"; bookId: string; requestId: string }
  | { type: "user_registration" }
  | NextResponse {
  if (!body || typeof body !== "object") {
    return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 });
  }

  const record = body as Record<string, unknown>;

  if ("message" in record || "text" in record) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const type = record.type;
  if (type === "user_registration") {
    const keys = Object.keys(record);
    if (keys.length !== 1 || keys[0] !== "type") {
      return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 });
    }
    return { type: "user_registration" };
  }

  if (type === "book_request") {
    const keys = Object.keys(record);
    if (
      keys.length !== 3 ||
      !keys.includes("type") ||
      !keys.includes("bookId") ||
      !keys.includes("requestId")
    ) {
      return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 });
    }

    const bookId = record.bookId;
    const requestId = record.requestId;

    if (typeof bookId !== "string" || !BOOK_ID_PATTERN.test(bookId)) {
      return NextResponse.json({ success: false, error: "Invalid bookId" }, { status: 400 });
    }

    if (typeof requestId !== "string" || !REQUEST_ID_PATTERN.test(requestId)) {
      return NextResponse.json({ success: false, error: "Invalid requestId" }, { status: 400 });
    }

    return { type: "book_request", bookId, requestId };
  }

  return NextResponse.json({ success: false, error: "Invalid type" }, { status: 400 });
}

async function wasAlreadyNotified(logId: string): Promise<boolean> {
  if (!adminDb) return false;
  const snap = await adminDb.collection(NOTIFY_LOG).doc(logId).get();
  return snap.exists;
}

async function markNotified(logId: string, type: string): Promise<void> {
  if (!adminDb) return;
  await adminDb.collection(NOTIFY_LOG).doc(logId).set({
    type,
    sentAt: new Date(),
  });
}

async function handleBookRequest(
  user: DecodedUser,
  bookId: string,
  requestId: string
): Promise<NextResponse> {
  if (!adminDb) {
    return NextResponse.json(
      { success: false, error: "Firebase Admin not initialized" },
      { status: 500 }
    );
  }

  const logId = `book_${requestId}`;
  if (await wasAlreadyNotified(logId)) {
    return NextResponse.json({ success: true, skipped: true, reason: "already_notified" });
  }

  const requestSnap = await adminDb.collection("requests").doc(requestId).get();
  if (!requestSnap.exists) {
    return NextResponse.json({ success: false, error: "Request not found" }, { status: 404 });
  }

  const requestData = requestSnap.data() as {
    bookId?: string;
    bookTitle?: string;
    userEmail?: string;
    userName?: string;
    name?: string;
    whatsapp?: string;
    status?: string;
  };

  const requestEmail = requestData.userEmail?.toLowerCase().trim();
  if (requestEmail !== user.email) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  if (requestData.bookId !== bookId) {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  if (!isPendingRequestStatus(requestData.status)) {
    return NextResponse.json({ success: false, error: "Request not pending" }, { status: 409 });
  }

  let bookTitle = requestData.bookTitle?.trim() || "";
  if (!bookTitle) {
    const bookSnap = await adminDb.collection("documents").doc(bookId).get();
    bookTitle = (bookSnap.data()?.title as string | undefined)?.trim() || bookId;
  }

  if (!isTelegramConfigured()) {
    return NextResponse.json({ success: true, skipped: true, reason: "telegram_not_configured" });
  }

  const message = buildBookRequestMessage({
    userName: getRequestUserName({
      id: requestId,
      bookId,
      ...requestData,
    }),
    email: user.email,
    whatsapp: requestData.whatsapp,
    bookTitle,
  });

  const sent = await sendTelegramAdminMessage(message);
  if (sent) {
    await markNotified(logId, "book_request");
  }

  return NextResponse.json({ success: sent, skipped: !sent });
}

async function handleUserRegistration(user: DecodedUser): Promise<NextResponse> {
  if (!adminAuth) {
    return NextResponse.json(
      { success: false, error: "Firebase Admin not initialized" },
      { status: 500 }
    );
  }

  const logId = `reg_${user.uid}`;
  if (await wasAlreadyNotified(logId)) {
    return NextResponse.json({ success: true, skipped: true, reason: "already_notified" });
  }

  const authUser = await adminAuth.getUser(user.uid);
  const createdAt = new Date(authUser.metadata.creationTime).getTime();
  const ageMs = Date.now() - createdAt;

  if (Number.isNaN(createdAt) || ageMs > REGISTRATION_WINDOW_MS) {
    return NextResponse.json(
      { success: false, error: "Registration window expired" },
      { status: 403 }
    );
  }

  if (!isTelegramConfigured()) {
    return NextResponse.json({ success: true, skipped: true, reason: "telegram_not_configured" });
  }

  const date = new Date(createdAt).toLocaleString("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  });

  const message = buildRegistrationMessage({
    email: user.email,
    date,
  });

  const sent = await sendTelegramAdminMessage(message);
  if (sent) {
    await markNotified(logId, "user_registration");
  }

  return NextResponse.json({ success: sent, skipped: !sent });
}

export async function POST(request: Request) {
  try {
    const authResult = await verifyAuthenticatedUser(request);
    if (authResult instanceof NextResponse) return authResult;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = parseStrictBody(body);
    if (parsed instanceof NextResponse) return parsed;

    if (parsed.type === "book_request") {
      return handleBookRequest(authResult, parsed.bookId, parsed.requestId);
    }

    return handleUserRegistration(authResult);
  } catch (error) {
    console.error("[telegram/notify] ERROR:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
