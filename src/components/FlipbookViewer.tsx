"use client";

import { useEffect, useRef, useState, useMemo } from "react";
// @ts-ignore
import HTMLFlipBook from "react-pageflip";
import * as pdfjsLib from "pdfjs-dist";
import { auth } from "@/lib/firebase";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

type Props = { fileUrl: string };
type Theme = "light" | "sepia" | "dark";
type ViewMode = "flip" | "scroll";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function FlipbookViewer({ fileUrl }: Props) {
  const bookRef = useRef<any>(null);

  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [currentRender, setCurrentRender] = useState(0);
  const [errMsg, setErrMsg] = useState("");

  const [zoom, setZoom] = useState(1);
  const [theme, setTheme] = useState<Theme>("light");
  const [targetPage, setTargetPage] = useState("");

  const [viewMode, setViewMode] = useState<ViewMode>("flip");
  const [bookDimensions, setBookDimensions] = useState({ width: 380, height: 560 });

  const isZoomedFlip = zoom > 1.01;
  const renderScale = 2.0;

  // Auto-detectar móvil para poner modo Scroll (Ebook) por defecto
  useEffect(() => {
    const apply = () => {
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      if (isMobile) setViewMode("scroll");
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  // Bloqueo de seguridad (Ctrl+P, Ctrl+S)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (k === "p" || k === "s")) e.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKeyDown, { capture: true } as any);
  }, []);

  // Renderizar PDF (una sola vez por fileUrl)
  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();
    let pdfDoc: any = null;

    async function renderPdf() {
      try {
        setErrMsg("");
        setLoading(true);
        setPages([]);
        setTotalPages(0);
        setCurrentRender(0);

        const res = await fetch(fileUrl, { cache: "no-store", signal: ac.signal });
        if (!res.ok) throw new Error("No se pudo descargar el PDF");

        const data = await res.arrayBuffer();
        // @ts-ignore
        pdfDoc = await pdfjsLib.getDocument({ data }).promise;

        if (cancelled) return;

        setTotalPages(pdfDoc.numPages);

        // Calcular tamaño ideal del libro basado en la primera página
        const firstPage = await pdfDoc.getPage(1);
        const vp1 = firstPage.getViewport({ scale: 1 });
        const ratio = vp1.width / vp1.height;
        const baseHeight = 560;
        const width = clamp(Math.floor(baseHeight * ratio), 320, 560);
        setBookDimensions({ width, height: baseHeight });

        const userMark = auth.currentUser?.email || "Copia Protegida";

        // Array fijo para mantener orden y evitar rearmar todo
        const imgs: string[] = new Array(pdfDoc.numPages);

        for (let i = 1; i <= pdfDoc.numPages; i++) {
          if (cancelled) return;

          setCurrentRender(i);

          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: renderScale });

          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;

          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);

          // pdfjs v5 pide también canvas en los tipos
          await page
            .render({ canvasContext: ctx, viewport, canvas } as any)
            .promise;

          // Marca de agua sutil
          ctx.save();
          const fontSize = Math.floor(canvas.width / 20);
          ctx.font = `bold ${fontSize}px serif`;
          ctx.fillStyle = "rgba(120, 120, 120, 0.08)";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate(-Math.PI / 4);
          ctx.fillText(userMark, 0, 0);
          ctx.restore();

          imgs[i - 1] = canvas.toDataURL("image/jpeg", 0.85);

          // Progresivo sin filter(Boolean) (evita rearmar masivo cada vez)
          if (i === 1 || i % 4 === 0 || i === pdfDoc.numPages) {
            const partial = imgs.slice(0, i).filter(Boolean);
            setPages(partial);
          }
        }

        if (cancelled) return;
        setPages(imgs.filter(Boolean));
        setLoading(false);
      } catch (e: any) {
        if (cancelled) return;
        if (e?.name === "AbortError") return;
        setErrMsg("No se pudo cargar el documento.");
        setLoading(false);
      }
    }

    renderPdf();

    return () => {
      cancelled = true;
      ac.abort();
      try {
        pdfDoc?.destroy?.();
      } catch {}
    };
  }, [fileUrl]);

  const progress = totalPages ? Math.round((currentRender / totalPages) * 100) : 0;

  const themeStyles = useMemo(() => {
    return {
      light: "bg-[#fdfdfd]",
      sepia: "bg-[#f4ecd8] border-[#e6d5b8]",
      dark: "bg-[#0f0f0f] border-gray-800",
    };
  }, []);

  const headerBg = useMemo(() => {
    if (theme === "dark") return "bg-black/60";
    if (theme === "sepia") return "bg-[#f4ecd8]/80";
    return "bg-white/80";
  }, [theme]);

  const goToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(targetPage, 10);
    if (!Number.isFinite(p) || p < 1 || p > totalPages) return;

    if (viewMode === "flip") {
      bookRef.current?.pageFlip()?.turnToPage(p - 1);
    } else {
      document.getElementById(`page-${p - 1}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    setTargetPage("");
  };

  const FlipBookComponent: any = HTMLFlipBook;

  return (
    <div
      className={`w-full flex flex-col items-center gap-4 py-4 select-none transition-colors duration-500 min-h-screen ${
        theme === "dark" ? "bg-[#121212]" : "bg-gray-50"
      }`}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* --- BARRA DE HERRAMIENTAS --- */}
      <div className="sticky top-4 z-50 flex flex-wrap items-center justify-center gap-3 px-4 py-2 bg-white/95 backdrop-blur-xl border border-amber-100 rounded-full shadow-xl mx-4 max-w-full">
        <button
          onClick={() => setViewMode(viewMode === "flip" ? "scroll" : "flip")}
          className="flex items-center gap-2 px-4 py-1.5 bg-black text-white rounded-full text-[10px] font-bold uppercase hover:bg-amber-600 transition-colors shadow-md"
        >
          {viewMode === "flip" ? "📱 Modo Ebook" : "📖 Modo Libro 3D"}
        </button>

        <div className="w-px h-4 bg-gray-300 hidden sm:block" />

        <div className="flex gap-1 bg-gray-100 p-1 rounded-full">
          {(["light", "sepia", "dark"] as Theme[]).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`w-6 h-6 rounded-full border transition-transform ${
                theme === t ? "ring-2 ring-amber-500 scale-110" : "opacity-50"
              } ${
                t === "light"
                  ? "bg-white"
                  : t === "sepia"
                  ? "bg-[#f4ecd8]"
                  : "bg-[#2c2c2c]"
              }`}
            />
          ))}
        </div>

        {viewMode === "flip" && (
          <>
            <div className="w-px h-4 bg-gray-300 hidden sm:block" />
            <div className="flex items-center border rounded-full px-2 bg-white">
              <button
                className="px-2 font-bold hover:text-amber-600"
                onClick={() => setZoom((z) => clamp(+((z - 0.1).toFixed(2)), 0.7, 1.6))}
              >
                –
              </button>
              <span className="text-[10px] w-10 text-center font-black">
                {Math.round(zoom * 100)}%
              </span>
              <button
                className="px-2 font-bold hover:text-amber-600"
                onClick={() => setZoom((z) => clamp(+((z + 0.1).toFixed(2)), 0.7, 1.6))}
              >
                +
              </button>
            </div>
          </>
        )}

        <form onSubmit={goToPage} className="flex items-center gap-1 border-l pl-3 border-gray-200">
          <input
            type="number"
            placeholder="#"
            className="w-12 px-2 py-1 text-[10px] text-center border rounded outline-none focus:border-amber-500"
            value={targetPage}
            onChange={(e) => setTargetPage(e.target.value)}
          />
          <button type="submit" className="text-[10px] font-bold uppercase text-amber-700">
            Ir
          </button>
        </form>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
          <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mb-4" />
          <p className="text-xs text-amber-800 font-bold uppercase tracking-widest">
            Preparando Obra... {progress}%
          </p>
        </div>
      )}

      {errMsg && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
          {errMsg}
        </div>
      )}

      {/* --- MODO LIBRO 3D (FLIP) --- */}
      {viewMode === "flip" && !loading && pages.length > 0 && (
        <div
          className={`w-full max-w-6xl border rounded-[2.5rem] p-4 sm:p-10 shadow-inner transition-colors ${themeStyles[theme]} ${
            theme === "dark" ? "border-gray-800" : "border-gray-100"
          }`}
        >
          <div
            className="mx-auto"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top center",
              transition: "transform 180ms ease-out",
              willChange: "transform",
            }}
          >
            <FlipBookComponent
              ref={bookRef}
              width={bookDimensions.width}
              height={bookDimensions.height}
              size="fixed"
              minWidth={320}
              maxWidth={600}
              minHeight={420}
              maxHeight={820}
              drawShadow={true}
              showCover={true}
              mobileScrollSupport={false}
              className="book-main shadow-2xl"
              style={{ margin: "0 auto" }}
              startPage={0}
              startZIndex={0}
              autoSize={true}
              usePortrait={true}
              flippingTime={900}
              maxShadowOpacity={0.5}
              showPageCorners={true}
              clickEventForward={!isZoomedFlip}
              disableFlipByClick={isZoomedFlip}
              useMouseEvents={!isZoomedFlip}
              swipeDistance={isZoomedFlip ? 9999 : 30}
            >
              {pages.map((src, idx) => (
                <div key={idx} className="bg-white border-l border-gray-50 overflow-hidden relative">
                  <div className="w-full h-full p-2 flex items-center justify-center">
                    <img
                      src={src}
                      alt={`Pág ${idx + 1}`}
                      className="max-w-full max-h-full object-contain pointer-events-none"
                      draggable={false}
                    />
                  </div>
                  <div className="absolute bottom-2 w-full text-center text-[8px] text-gray-400 font-serif">
                    — {idx + 1} —
                  </div>
                </div>
              ))}
            </FlipBookComponent>
          </div>
        </div>
      )}

      {/* --- MODO EBOOK (SCROLL) --- */}
      {viewMode === "scroll" && !loading && pages.length > 0 && (
        <div className="w-full max-w-3xl px-0 flex flex-col gap-0 pb-32">
          <div className={`text-center py-3 text-[10px] text-gray-500 uppercase tracking-widest sticky top-0 z-10 ${headerBg} backdrop-blur-sm`}>
            Lectura Continua
          </div>

          <div
            className="w-full"
            style={{
              overscrollBehavior: "contain",
              WebkitOverflowScrolling: "touch",
              touchAction: "pan-y pinch-zoom",
            }}
          >
            {pages.map((src, idx) => (
              <div
                key={idx}
                id={`page-${idx}`}
                className={`w-full relative shadow-sm ${themeStyles[theme]} mb-2`}
              >
                <img
                  src={src}
                  alt={`Página ${idx + 1}`}
                  className="w-full h-auto block"
                  loading="lazy"
                  style={{
                    filter:
                      theme === "dark"
                        ? "invert(0.9) hue-rotate(180deg)"
                        : theme === "sepia"
                        ? "sepia(0.3)"
                        : "none",
                  }}
                />

                <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-0.5 rounded text-[9px] font-bold opacity-30 hover:opacity-100 transition-opacity">
                  {idx + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx global>{`
        .book-main { background: transparent; }
        input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}
