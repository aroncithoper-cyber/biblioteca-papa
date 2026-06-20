export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { adminAuth } from "@/lib/firebaseAdmin";

async function verifyAuthenticatedRequest(request: Request) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const idToken = authHeader.slice(7).trim();
  if (!idToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!adminAuth) {
    return NextResponse.json(
      { error: "Firebase Admin not initialized" },
      { status: 500 }
    );
  }

  try {
    await adminAuth.verifyIdToken(idToken);
    return null;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function GET(req: Request) {
  try {
    const authError = await verifyAuthenticatedRequest(req);
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json({ error: "missing path" }, { status: 400 });
    }

    const cleanPath = path.replace(/^\/+/, "");

    const url = await getDownloadURL(ref(storage, cleanPath));

    const res = await fetch(url, {
      cache: "no-store",
      redirect: "follow",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "fetch failed", status: res.status },
        { status: 502 }
      );
    }

    const bytes = await res.arrayBuffer();

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="documento.pdf"',
        "Cache-Control": "no-store, max-age=0",
        "Accept-Ranges": "bytes",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "internal error", message: err?.message || "unknown" },
      { status: 500 }
    );
  }
}
