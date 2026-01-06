"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
// @ts-ignore
import HTMLFlipBook from "react-pageflip";
import * as pdfjsLib from "pdfjs-dist";
import { auth } from "@/lib/firebase";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

type Props = { fileUrl: string };

type Theme = "light" | "sepia" | "dark";
type ViewMode = "flip" | "scroll";

type Highlight = {
  id: string;
  // Coordenadas normalizadas (0..1) relativas al contenedor de la página
  x: number;
  y: number;
  w: number;
  h: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Componente de página para modo ebook (scroll):
 * - Pinch zoom (móvil) con Pointer Events
 * - Doble tap (móvil) para zoom
 * - Pan al arrastrar cuando zoom > 1
 * - Resaltado "tipo subrayado" (rectángulos) encima de la imagen
 */
function ZoomablePage({
  src,
  pageIndex,
  theme,
  enableHighlight,
  highlights,
  setHighlights,
}: {
  src: string;
  pageIndex: number;
  theme: Theme;
  enableHighlight: boolean;
  highlights: Highlight[];
  setHighlights: (next: Highlight[]) => void;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Transform state
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);

  // Pointer tracking for pinch/pan
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const gesture = useRef<{
    startScale: number;
    startTx: number;
    startTy: number;
    startDist: number;
    midX: number;
    midY: number;
  } | null>(null);

  // Highlight drawing
  const drawing = useRef<{
    startX: number;
    startY: number;
    currX: number;
    currY: number;
    active: boolean;
  }>({ startX: 0, startY: 0, currX: 0, currY: 0, active: false });

  const [previewRect, setPreviewRect] = useState<null | { x: number; y: number; w: number; h: number }>(null);

  const isZoomed = scale > 1.01;

  const themeBg =
    theme === "dark"
      ? "bg-[#111]"
      : theme === "sepia"
      ? "bg-[#f4ecd8]"
      : "bg-white";

  const themeBorder =
    theme === "dark"
      ? "border-gray-800"
      : theme === "sepia"
      ? "border-[#e6d5b8]"
      : "border-gray-100";

  // Double tap to zoom (mobile friendly)
  const lastTap = useRef<number>(0);
  const onDoubleTap = () => {
    const now = Date.now();
    const dt = now - lastTap.current;
    lastTap.current = now;
    if (dt < 280) {
      // toggle zoom
      if (scale < 1.2) {
        setScale(2);
      } else {
        setScale(1);
        setTx(0);
        setTy(0);
      }
    }
  };

  const normalizePoint = (clientX: number, clientY: number) => {
    const el = wrapRef.current;
    if (!el) return { nx: 0, ny: 0, px: 0, py: 0, rect: null as DOMRect | null };
    const rect = el.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const nx = clamp(px / rect.width, 0, 1);
    const ny = clamp(py / rect.height, 0, 1);
    return { nx, ny, px, py, rect };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    // Si estamos en modo resaltar, no queremos que el gesto de zoom/pan interfiera
    if (enableHighlight) {
      const el = wrapRef.current;
      if (!el) return;
      el.setPointerCapture(e.pointerId);

      const { px, py, rect } = normalizePoint(e.clientX, e.clientY);
      if (!rect) return;

      drawing.current = { startX: px, startY: py, currX: px, currY: py, active: true };
      setPreviewRect({ x: px, y: py, w: 0, h: 0 });
      return;
    }

    // Normal gesture (zoom/pan)
    const el = wrapRef.current;
    if (!el) return;

    el.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // init gesture
    if (pointers.current.size === 1) {
      gesture.current = null;
    }

    onDoubleTap();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const el = wrapRef.current;
    if (!el) return;

    // highlight draw
    if (enableHighlight && drawing.current.active) {
      const rect = el.getBoundingClientRect();
      const px = clamp(e.clientX - rect.left, 0, rect.width);
      const py = clamp(e.clientY - rect.top, 0, rect.height);
      drawing.current.currX = px;
      drawing.current.currY = py;

      const x = Math.min(drawing.current.startX, px);
      const y = Math.min(drawing.current.startY, py);
      const w = Math.abs(px - drawing.current.startX);
      const h = Math.abs(py - drawing.current.startY);

      setPreviewRect({ x, y, w, h });
      return;
    }

    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const rect = el.getBoundingClientRect();

    // Pinch zoom if two pointers
    if (pointers.current.size >= 2) {
      const pts = Array.from(pointers.current.values()).slice(0, 2);
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      const dist = Math.hypot(dx, dy);

      const midX = (pts[0].x + pts[1].x) / 2 - rect.left;
      const midY = (pts[0].y + pts[1].y) / 2 - rect.top;

      if (!gesture.current) {
        gesture.current = {
          startScale: scale,
          startTx: tx,
          startTy: ty,
          startDist: dist,
          midX,
          midY,
        };
      } else {
        const g = gesture.current;
        const ratio = dist / (g.startDist || dist);
        const nextScale = clamp(g.startScale * ratio, 1, 4);

        // Mantener el punto medio “anclado”
        // (aprox) Ajuste de traslación para que el zoom se sienta natural
        const scaleDelta = nextScale / (scale || 1);
        const cx = g.midX - rect.width / 2;
        const cy = g.midY - rect.height / 2;

        const nextTx = g.startTx - cx * (scaleDelta - 1);
        const nextTy = g.startTy - cy * (scaleDelta - 1);

        setScale(nextScale);
        setTx(nextTx);
        setTy(nextTy);
      }
      return;
    }

    // Pan with one pointer if zoomed
    if (pointers.current.size === 1 && isZoomed) {
      const pt = pointers.current.get(e.pointerId)!;
      // We need previous pt: use movementX/Y as a stable fallback
      setTx((v) => v + e.movementX);
      setTy((v) => v + e.movementY);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const el = wrapRef.current;
    if (!el) return;

    // finish highlight
    if (enableHighlight && drawing.current.active) {
      el.releasePointerCapture(e.pointerId);

      const rect = el.getBoundingClientRect();
      const startX = drawing.current.startX;
      const startY = drawing.current.startY;
      const endX = drawing.current.currX;
      const endY = drawing.current.currY;

      const x = Math.min(startX, endX);
      const y = Math.min(startY, endY);
      const w = Math.abs(endX - startX);
      const h = Math.abs(endY - startY);

      drawing.current.active = false;
      setPreviewRect(null);

      // evita highlights súper pequeños por error
      if (w < 8 || h < 8) return;

      const nx = clamp(x / rect.width, 0, 1);
      const ny = clamp(y / rect.height, 0, 1);
      const nw = clamp(w / rect.width, 0, 1);
      const nh = clamp(h / rect.height, 0, 1);

      const next: Highlight = { id: uid(), x: nx, y: ny, w: nw, h: nh };
      setHighlights([...highlights, next]);
      return;
    }

    // gesture finish
    try {
      el.releasePointerCapture(e.pointerId);
    } catch {}

    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) {
      gesture.current = null;
    }
  };

  const clearHighlights = () => setHighlights([]);

  return (
    <div className={`relative w-full ${themeBg} border ${themeBorder} rounded-2xl overflow-hidden shadow-lg`}>
      {/* Toolbar per page (only when highlight mode is on) */}
      {enableHighlight && (
        <div className="absolute top-2 left-2 z-20 flex gap-2">
          <button
            type="button"
            onClick={clearHighlights}
            className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-white/90 border border-gray-200 hover:bg-gray-50"
          >
            Borrar resaltados
          </button>
        </div>
      )}

      <div
        ref={wrapRef}
        className="relative w-full touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          // contenedor “estable”
          userSelect: "none",
        }}
      >
        {/* Content */}
        <div
          className="relative w-full"
          style={{
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            transformOrigin: "center center",
            transition: pointers.current.size ? "none" : "transform 120ms ease-out",
            willChange: "transform",
          }}
        >
          <img
            src={src}
            alt={`Página ${pageIndex + 1}`}
            className="w-full h-auto block pointer-events-none"
            draggable={false}
            loading="lazy"
          />
        </div>

        {/* Highlights overlay (not affected by transform) */}
        <div className="absolute inset-0 pointer-events-none">
          {highlights.map((h) => (
            <div
              key={h.id}
              style={{
                position: "absolute",
                left: `${h.x * 100}%`,
                top: `${h.y * 100}%`,
                width: `${h.w * 100}%`,
                height: `${h.h * 100}%`,
                background: "rgba(255, 214, 102, 0.38)",
                border: "1px solid rgba(255, 214, 102, 0.55)",
                borderRadius: 10,
                boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
              }}
            />
          ))}

          {previewRect && (
            <div
              style={{
                position: "absolute",
                left: previewRect.x,
                top: previewRect.y,
                width: previewRect.w,
                height: previewRect.h,
                background: "rgba(255, 214, 102, 0.25)",
                border: "1px dashed rgba(255, 214, 102, 0.8)",
                borderRadius: 10,
              }}
            />
          )}
        </div>
      </div>

      {/* Page number */}
      <div className="absolute bottom-2 right-2 z-20 bg-black/65 text-white px-3 py-1 rounded-full text-[10px] font-bold">
        {pageIndex + 1}
      </div>
    </div>
  );
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
  const [bookDimensions, setBookDimensions] = useState({ width: 380, height: 550 });

  // Ebook highlight mode (scroll)
  const [highlightMode, setHighlightMode] = useState(false);
  // highlightsByPageIndex
  const [highlights, setHighlights] = useState<Record<number, Highlight[]>>({});

  const isZoomedFlip = zoom > 1.01;

  // Ajuste de calidad / estabilidad
  const renderScale = 1.9; // más estable que 2.5 (evita bugs/memoria)

  // Auto: móvil => scroll
  useEffect(() => {
    const setModeByWidth = () => {
      if (window.innerWidth < 768) setViewMode("scroll");
    };
    setModeByWidth();
    window.addEventListener("resize", setModeByWidth);
    return () => window.removeEventListener("resize", setModeByWidth);
  }, []);

  // Bloqueos básicos (print/save)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (k === "p" || k === "s")) e.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true } as any);
  }, []);

  // Render PDF -> imágenes
  useEffect(() => {
    let cancelled = false;

    async function renderPdf() {
      try {
        setErrMsg("");
        setLoading(true);
        setPages([]);
        setTotalPages(0);
        setCurrentRender(0);

        const res = await fetch(fileUrl, { cache: "no-store" });
        if (!res.ok) throw new Error("No se pudo descargar el PDF");

        const data = await res.arrayBuffer();
        // @ts-ignore
        const pdf = await pdfjsLib.getDocument({ data }).promise;
        if (cancelled) return;

        setTotalPages(pdf.numPages);

        // Calcular ratio para dimensiones del flipbook (evita “palabras cortadas”)
        const firstPage = await pdf.getPage(1);
        const vp1 = firstPage.getViewport({ scale: 1 });
        const ratio = vp1.width / vp1.height;

        const baseHeight = 560;
        const width = clamp(Math.floor(baseHeight * ratio), 320, 520);
        setBookDimensions({ width, height: baseHeight });

        const userMark = auth.currentUser?.email || "Copia Protegida";
        const imgs: string[] = new Array(pdf.numPages);

        // render loop
        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;
          setCurrentRender(i);

          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: renderScale });

          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;

          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);

          // ✅ Compatibilidad TS/pdfjs v5
          const renderTask = page.render({
            canvasContext: ctx,
            viewport,
            canvas,
          } as any);
          await renderTask.promise;

          // watermark
          ctx.save();
          const fontSize = Math.floor(canvas.width / 18);
          ctx.font = `bold ${fontSize}px serif`;
          ctx.fillStyle = "rgba(120, 120, 120, 0.10)";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate(-Math.PI / 4);
          ctx.fillText(userMark, 0, 0);
          ctx.restore();

          imgs[i - 1] = canvas.toDataURL("image/jpeg", 0.85);

          // Pintado incremental para que no “parpadee” tanto
          if (i === 1 || i % 3 === 0 || i === pdf.numPages) {
            setPages(imgs.filter(Boolean));
          }
        }

        if (cancelled) return;
        setPages(imgs.filter(Boolean));
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setErrMsg("No se pudo cargar el documento.");
          setLoading(false);
        }
      }
    }

    renderPdf();
    return () => {
      cancelled = true;
    };
  }, [fileUrl, viewMode]);

  const progress = totalPages ? Math.round((currentRender / totalPages) * 100) : 0;

  const themeStyles = useMemo(() => {
    return {
      light: "bg-[#fdfdfd] border-gray-100",
      sepia: "bg-[#f4ecd8] border-[#e6d5b8]",
      dark: "bg-[#0f0f0f] border-gray-800",
    };
  }, []);

  const goToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(targetPage, 10);
    if (!Number.isFinite(p) || p < 1 || p > totalPages) return;

    if (viewMode === "flip") {
      bookRef.current?.pageFlip()?.turnToPage(p - 1);
    } else {
      const el = document.getElementById(`page-${p - 1}`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setTargetPage("");
  };

  // Cast para librería externa (evita errores de types)
  const FlipBookComponent: any = HTMLFlipBook;

  return (
    <div
      className={`w-full flex flex-col items-center gap-4 py-4 select-none transition-colors duration-500 ${
        theme === "dark" ? "bg-[#121212]" : "bg-gray-50"
      }`}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Toolbar global */}
      <div className="sticky top-4 z-50 flex flex-wrap items-center justify-center gap-3 px-4 py-2 bg-white/90 backdrop-blur-xl border border-amber-100 rounded-full shadow-xl mx-4 max-w-full">
        {/* Mode toggle */}
        <button
          onClick={() => {
            setViewMode(viewMode === "flip" ? "scroll" : "flip");
            // Cuando pasas a scroll, tiene sentido permitir highlight
            // pero lo dejamos apagado por default
            setHighlightMode(false);
          }}
          className="flex items-center gap-2 px-4 py-1.5 bg-black text-white rounded-full text-[10px] font-bold uppercase hover:bg-amber-600 transition-colors shadow-md"
          type="button"
        >
          {viewMode === "flip" ? "📱 Modo Ebook" : "📖 Modo Libro 3D"}
        </button>

        <div className="w-px h-4 bg-gray-300 hidden sm:block" />

        {/* Theme */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-full">
          {(["light", "sepia", "dark"] as Theme[]).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`w-6 h-6 rounded-full border transition-transform ${
                theme === t ? "ring-2 ring-amber-500 scale-110" : "opacity-50"
              } ${t === "light" ? "bg-white" : t === "sepia" ? "bg-[#f4ecd8]" : "bg-[#2c2c2c]"}`}
              type="button"
            />
          ))}
        </div>

        {/* Flip zoom (only in flip mode) */}
        {viewMode === "flip" && (
          <>
            <div className="w-px h-4 bg-gray-300 hidden sm:block" />
            <div className="flex items-center border rounded-full px-2 bg-white">
              <button
                className="px-2 font-bold hover:text-amber-600"
                onClick={() => setZoom((z) => clamp(+((z - 0.1).toFixed(2)), 0.7, 1.6))}
                type="button"
              >
                –
              </button>
              <span className="text-[10px] w-10 text-center font-black">{Math.round(zoom * 100)}%</span>
              <button
                className="px-2 font-bold hover:text-amber-600"
                onClick={() => setZoom((z) => clamp(+((z + 0.1).toFixed(2)), 0.7, 1.6))}
                type="button"
              >
                +
              </button>
            </div>
          </>
        )}

        {/* Ebook highlight toggle (only in scroll mode) */}
        {viewMode === "scroll" && (
          <>
            <div className="w-px h-4 bg-gray-300 hidden sm:block" />
            <button
              type="button"
              onClick={() => setHighlightMode((v) => !v)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase border transition-colors ${
                highlightMode
                  ? "bg-amber-600 text-white border-amber-600"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {highlightMode ? "✍️ Resaltando" : "🖍️ Resaltar"}
            </button>
          </>
        )}

        {/* Page jump */}
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

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mb-4" />
          <p className="text-xs text-amber-800 font-bold uppercase tracking-widest">
            Preparando Obra... {progress}%
          </p>
        </div>
      )}

      {/* Error */}
      {errMsg && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
          {errMsg}
        </div>
      )}

      {/* FLIP MODE */}
      {viewMode === "flip" && !loading && pages.length > 0 && (
        <div
          className={`w-full max-w-6xl border rounded-[2.5rem] p-4 sm:p-10 shadow-inner transition-colors ${themeStyles[theme]}`}
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

              // ✅ Clave: al hacer zoom, bloqueamos flips accidentales
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

      {/* SCROLL / EBOOK MODE */}
      {viewMode === "scroll" && !loading && pages.length > 0 && (
        <div className={`w-full max-w-3xl px-3 sm:px-0 flex flex-col gap-6 pb-24`}>
          <div className="text-center py-2 text-[10px] text-gray-500 uppercase tracking-widest">
            Modo Ebook — {highlightMode ? "Arrastra para resaltar" : "Pellizca para zoom, doble tap para acercar"}
          </div>

          {pages.map((src, idx) => (
            <div key={idx} id={`page-${idx}`} className="w-full">
              <ZoomablePage
                src={src}
                pageIndex={idx}
                theme={theme}
                enableHighlight={highlightMode}
                highlights={highlights[idx] || []}
                setHighlights={(next) => setHighlights((prev) => ({ ...prev, [idx]: next }))}
              />
            </div>
          ))}
        </div>
      )}

      <style jsx global>{`
        .book-main {
          background: transparent;
        }
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
