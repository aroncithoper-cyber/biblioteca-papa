import { NextResponse } from "next/server";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "@/lib/firebase";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json({ error: "missing path" }, { status: 400 });
    }

    // Normaliza: quita "/" inicial si viene como "/pdfs/..."
    const cleanPath = path.replace(/^\/+/, "");

    // URL firmada de Firebase Storage (server-side)
    const url = await getDownloadURL(ref(storage, cleanPath));

    // Trae el PDF desde el server (evita CORS del navegador)
    const res = await fetch(url, {
      // importante para evitar caché raro en despliegues
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
        // Para que el navegador lo trate como documento (no descarga forzada)
        "Content-Disposition": 'inline; filename="documento.pdf"',
        // Evita caché
        "Cache-Control": "no-store, max-age=0",
        // Esto ayuda a que varios visores/pdfjs no fallen en algunos casos
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
