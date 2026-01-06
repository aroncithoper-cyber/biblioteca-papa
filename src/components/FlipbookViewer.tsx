"use client";

import { useEffect, useMemo, useRef, useState } from "react";
// @ts-ignore
import HTMLFlipBook from "react-pageflip";
import * as pdfjsLib from "pdfjs-dist";
import { auth } from "@/lib/firebase";

// Worker para pdfjs v5 (compatible en Vercel)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

type Props = { fileUrl: string };

type Theme = "light" | "sepia" | "dark";

export default function FlipbookViewer({ fileUrl }: Props) {
  const bookRef = useRef<any>(null);

  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [currentRender, setCurrentRender] = useState(0);

  const [zoom, setZoom] = useState(1);
  const [theme, setTheme] = useState<Theme>("light");
  const [targetPage, setTargetPage] = useState("");

  // Para que no sea enorme en celular, adaptamos escala/render según pantalla
  const renderScale = useMemo(() => {
    if (typeof window === "undefined") return 1.6;
    const w = window.innerWidth;
    if (w < 420) return 1.35;
    if (w < 768) return 1.6;
    return 2.0;
  }, []);

  // Bloqueos básicos (imprimir/guardar)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (k === "p" || k === "s")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true } as any);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function renderPdfToImages() {
      try {
        setLoading(true);
        setErrMsg("");
        setPages([]);
        setTotalPages(0);
        setCurrentRender(0);

        // IMPORTANTÍSIMO:
        // fileUrl debe ser tu proxy same-origin (/api/pdf?path=...), NO la URL directa de Firebase,
        // porque Firebase Storage bloquea CORS al navegador.
        const res = await fetch(fileUrl, { cache: "no-store" });
        if (!res.ok) throw new Error("No se pudo obtener el PDF.");

        const data = await res.arrayBuffer();
        // @ts-ignore
        const pdf = await pdfjsLib.getDocument({ data }).promise;

        if (cancelled) return;

        setTotalPages(pdf.numPages);

        const userMark = (auth.currentUser?.email || "Copia Protegida").slice(0, 60);

        const imgs: string[] = [];
        const BATCH = 4; // actualiza la UI cada 4 páginas

        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;

          setCurrentRender(i);

          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: renderScale });

          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d", { alpha: false });

          if (!ctx) continue;

          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);

          // pdfjs v5: RenderParameters ahora requiere "canvas" además de canvasContext
          // @ts-ignore
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;

          // Marca de agua simple (estable y rápida)
          ctx.save();
          const fontSize = Math.max(18, Math.floor(canvas.width / 18));
          ctx.font = `700 ${fontSize}px serif`;
          ctx.fillStyle = "rgba(150,150,150,0.16)";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate(-Math.PI / 4);
          ctx.fillText(userMark, 0, 0);

          ctx.font = `700 ${Math.floor(fontSize / 2.6)}px serif`;
          ctx.fillText(userMark, 0, canvas.height / 3.2);
          ctx.fillText(userMark, 0, -canvas.height / 3.2);
          ctx.restore();

          imgs.push(canvas.toDataURL("image/jpeg", 0.78));

          // Actualiza en lotes para que no “parpadee”
          if (i % BATCH === 0 || i === pdf.numPages) {
            if (cancelled) return;
            setPages([...imgs]);
          }
        }

        if (cancelled) return;
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setErrMsg("No se pudo cargar el documento.");
        setLoading(false);
      }
    }

    renderPdfToImages();

    return () => {
      cancelled = true;
    };
  }, [fileUrl, renderScale]);

  const progress = totalPages ? Math.round((currentRender / totalPages) * 100) : 0;

  const themeStyles: Record<Theme, string> = {
    light: "bg-white border-amber-100",
    sepia: "bg-[#f4ecd8] border-[#e6d5b8]",
    dark: "bg-[#121212] border-gray-800",
  };

  const goToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const p = Number(targetPage);
    if (!Number.isFinite(p)) return;
    if (p >= 1 && p <= totalPages) {
      bookRef.current?.pageFlip()?.turnToPage(p - 1);
      setTargetPage("");
    }
  };

  // Para evitar errores de typings de react-pageflip en build (son viejos),
  // lo casteamos a any y le pasamos TODOS los props que pide IProps.
  const FlipBook: any = HTMLFlipBook;

  return (
    <div
      className="w-full flex flex-col items-center gap-6 py-4 select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Barra superior */}
      <div className="flex flex-wrap items-center justify-center gap-3 px-4 py-3 bg-white/90 backdrop-blur border border-amber-100 rounded-2xl shadow-xl sticky top-2 z-50">
        {/* Tema */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-full">
          <button
            aria-label="Tema claro"
            onClick={() => setTheme("light")}
            className={`w-6 h-6 rounded-full bg-white border ${theme === "light" ? "ring-2 ring-amber-500" : ""}`}
          />
          <button
            aria-label="Tema sepia"
            onClick={() => setTheme("sepia")}
            className={`w-6 h-6 rounded-full bg-[#f4ecd8] border ${theme === "sepia" ? "ring-2 ring-amber-500" : ""}`}
          />
          <button
            aria-label="Tema oscuro"
            onClick={() => setTheme("dark")}
            className={`w-6 h-6 rounded-full bg-[#2c2c2c] border ${theme === "dark" ? "ring-2 ring-amber-500" : ""}`}
          />
        </div>

        <div className="w-px h-6 bg-amber-100 hidden sm:block" />

        {/* Ir a página */}
        <form onSubmit={goToPage} className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder="Pág"
            className="w-16 px-2 py-1 text-[10px] border rounded-lg outline-none focus:border-amber-500"
            value={targetPage}
            onChange={(e) => setTargetPage(e.target.value)}
          />
          <button type="submit" className="text-[10px] font-bold uppercase text-amber-700">
            Ir
          </button>
        </form>

        <div className="w-px h-6 bg-amber-100" />

        {/* Zoom */}
        <div className="flex items-center gap-2">
          <button
            className="w-8 h-8 rounded-full border hover:bg-black hover:text-white transition-colors"
            onClick={() => setZoom((z) => Math.max(0.7, +(z - 0.1).toFixed(2)))}
          >
            –
          </button>
          <span className="text-[10px] w-12 text-center font-black">
            {Math.round(zoom * 100)}%
          </span>
          <button
            className="w-8 h-8 rounded-full border hover:bg-black hover:text-white transition-colors"
            onClick={() => setZoom((z) => Math.min(1.4, +(z + 0.1).toFixed(2)))}
          >
            +
          </button>
        </div>

        {/* Navegación */}
        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded-full border text-[10px] font-bold uppercase hover:bg-black hover:text-white transition-all"
            onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
          >
            Anterior
          </button>
          <button
            className="px-4 py-2 rounded-full bg-black text-white text-[10px] font-bold uppercase hover:bg-amber-700 transition-all shadow-lg"
            onClick={() => bookRef.current?.pageFlip()?.flipNext()}
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* Contenedor */}
      <div
        className={`relative flex items-center justify-center rounded-[2.5rem] p-4 sm:p-10 min-h-[520px] sm:min-h-[760px] w-full max-w-6xl overflow-hidden border shadow-inner transition-colors ${themeStyles[theme]}`}
      >
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 z-20 rounded-[2.5rem]">
            <div className="w-12 h-12 border-2 border-amber-200 border-t-amber-600 rounded-full animate-spin mb-4" />
            <p className="text-[11px] uppercase tracking-[0.4em] font-black text-amber-900/40 italic">
              Preparando lectura… {progress}%
            </p>
          </div>
        )}

        {errMsg && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-30 rounded-[2.5rem]">
            <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg border border-red-100">
              {errMsg}
            </p>
          </div>
        )}

        <div
          className="transition-transform duration-300 ease-out"
          style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
        >
          {pages.length > 0 && (
            <FlipBook
              ref={bookRef}
              // Tamaño base (se ve bien en móvil y desktop)
              width={380}
              height={560}
              size="fixed"
              minWidth={320}
              maxWidth={520}
              minHeight={460}
              maxHeight={760}
              autoSize={true}
              showCover={true}
              mobileScrollSupport={true}
              drawShadow={true}
              maxShadowOpacity={0.35}
              flippingTime={850}
              usePortrait={true}
              startPage={0}
              startZIndex={0}
              clickEventForward={true}
              useMouseEvents={true}
              swipeDistance={30}
              showPageCorners={true}
              disableFlipByClick={false}
              className="book-main"
              style={{ margin: "0 auto" }}
            >
              {pages.map((src, idx) => (
                <div key={idx} className="bg-white border-l border-gray-100 relative overflow-hidden">
                  <img
                    src={src}
                    alt={`Página ${idx + 1}`}
                    className="w-full h-full object-contain pointer-events-none"
                    draggable={false}
                  />
                  <div className="absolute bottom-3 w-full text-center text-[9px] text-gray-300 font-serif italic tracking-widest">
                    — {idx + 1} de {totalPages} —
                  </div>
                </div>
              ))}
            </FlipBook>
          )}
        </div>
      </div>

      <div className="text-center opacity-50">
        <p className="text-[10px] uppercase tracking-[0.4em] font-black text-gray-500">
          Jose Enrique Perez Leon
        </p>
        <p className="text-[9px] italic text-gray-400 mt-1">
          Visualización protegida con marca de agua
        </p>
      </div>

      <style jsx global>{`
        .book-main {
          background: transparent;
        }
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
        }
      `}</style>
    </div>
  );
}
