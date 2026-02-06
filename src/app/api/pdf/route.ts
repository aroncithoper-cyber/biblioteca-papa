import { NextResponse } from "next/server";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { verifyFirebaseToken } from "@/lib/firebase-admin";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token =
      authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

    if (!token) {
      return NextResponse.json(
        { error: "missing auth", message: "Authorization: Bearer <token> requerido" },
        { status: 401 }
      );
    }

    const result = await verifyFirebaseToken(token);
    if (!result.ok) {
      return NextResponse.json(
        { error: "invalid auth", message: "Token inválido o expirado" },
        { status: 401 }
      );
    }

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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      { error: "internal error", message },
      { status: 500 }
    );
  }
}
