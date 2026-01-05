import { NextResponse } from "next/server";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "@/lib/firebase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");
  if (!path) return NextResponse.json({ error: "missing path" }, { status: 400 });

  // Obtiene URL firmada de Firebase
  const url = await getDownloadURL(ref(storage, path));

  // Descarga el PDF desde el servidor (no hay CORS en server)
  const res = await fetch(url);
  if (!res.ok) return NextResponse.json({ error: "fetch failed" }, { status: 502 });

  const bytes = await res.arrayBuffer();

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "no-store",
    },
  });
}
