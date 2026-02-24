"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

function isMobileNow() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches;
}

export default function FlipbookViewer({ fileUrl }: Props) {
  const bookRef = useRef<any>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [currentRender, setCurrentRender] = useState(0);
  const [errMsg, setErrMsg] = useState("");

  // Progreso / Resume
  const [currentPage, setCurrentPage] = useState(1);
  const [resumeMsg, setResumeMsg] = useState("");

  // UI
  const [zoom, setZoom] = useState(1);
  const [theme, setTheme] = useState<Theme>("light");
  const [targetPage, setTargetPage] = useState("");

  const [viewMode, setViewMode] = useState<ViewMode>("flip");
  const [bookDimensions, setBookDimensions] = useState({ width: 380, height: 560 });

  // Responsivo real
  const [isMobile, setIsMobile] = useState(false);

  // Ajuste: flip solo desktop; en móvil forzamos scroll
  useEffect(() => {
    const apply = () => {
      const m = isMobileNow();
      setIsMobile(m);
      if (m) setViewMode("scroll");
    };
    apply();

    let t: any = null;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(apply, 120);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isZoomedFlip = zoom > 1.01;

  // Render scale adaptativo (mejor memoria en móvil)
  const renderScale = useMemo(() => {
    // Ajuste fino: scroll en móvil necesita menos resolución para que no truene memoria
    const base = isMobile ? 1.55 : 2.0;

    // Si el usuario sube zoom mucho en scroll, subimos un poquito la base para mantener legibilidad,
    // pero sin pasarnos.
    const zoomBoost = viewMode === "scroll" ? clamp(0.15 * (zoom - 1), 0, 0.35) : 0;

    // DevicePixelRatio puede ser alto en móviles; lo acotamos.
    const dpr = typeof window !== "undefined" ? clamp(window.devicePixelRatio || 1, 1, 2) : 1;

    return clamp(base + zoomBoost, 1.35, 2.2) * (dpr > 1.4 ? 1.05 : 1.0);
  }, [isMobile, viewMode, zoom]);

  // --- GUARDADO DE PROGRESO ---
  const storageKey = `progress_${fileUrl}`;

  const saveProgress = useCallback(
    (pageNum: number) => {
      if (pageNum > 0) {
        localStorage.setItem(storageKey, pageNum.toString());
        setCurrentPage(pageNum);
      }
    },
    [storageKey]
  );

  // Recuperar progreso al cargar
  useEffect(() => {
    if (!loading && totalPages > 0) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const p = parseInt(saved, 10);
        if (p > 1 && p <= totalPages) {
          setTimeout(() => {
            manualGoToPage(p);
            setResumeMsg(`Retomando en pág. ${p}`);
            setTimeout(() => setResumeMsg(""), 2500);
          }, 450);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, totalPages, storageKey]);

  // --- PROTECCIÓN (más sobria en el mensaje) ---
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (k === "p" || k === "s" || k === "c")) {
        e.preventDefault();
        alert("Contenido protegido.");
      }
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true } as any);
  }, []);

  // --- RENDERIZADO PDF ---
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

        const res = await fetch(fileUrl, { cache: "force-cache", signal: ac.signal });
        if (!res.ok) throw new Error("Error cargando documento");

        const data = await res.arrayBuffer();
        // @ts-ignore
        pdfDoc = await pdfjsLib.getDocument({ data }).promise;
        if (cancelled) return;

        setTotalPages(pdfDoc.numPages);

        // Medidas libro basadas en la primera página (desktop)
        const firstPage = await pdfDoc.getPage(1);
        const vp1 = firstPage.getViewport({ scale: 1 });
        const ratio = vp1.width / vp1.height;

        const baseHeight = 560;
        const width = clamp(Math.floor(baseHeight * ratio), 320, 560);
        setBookDimensions({ width, height: baseHeight });

        const userMark = auth.currentUser?.email || "Copia de Lectura";
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

          await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;

          // Watermark sutil, centrado (pro y no estorboso)
          ctx.save();
          const fontSize = Math.floor(canvas.width / 24);
          ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI`;
          ctx.fillStyle = "rgba(0, 0, 0, 0.035)";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate(-Math.PI / 4);
          ctx.fillText(`Consejero del Obrero • ${userMark}`, 0, 0);
          ctx.restore();

          imgs[i - 1] = canvas.toDataURL("image/jpeg", isMobile ? 0.78 : 0.82);

          // Progresivo para UX
          if (i === 1 || i % 3 === 0 || i === pdfDoc.numPages) {
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
  }, [fileUrl, renderScale, isMobile]);

  // --- INTERSECTION OBSERVER (SCROLL tracking PRO) ---
  useEffect(() => {
    if (viewMode !== "scroll") return;
    if (loading || pages.length === 0) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(
      (entries) => {
        // Elegimos la página con mayor visibilidad (más pro)
        let best: IntersectionObserverEntry | null = null;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          if (!best || e.intersectionRatio > best.intersectionRatio) best = e;
        }
        if (!best) return;

        const index = parseInt(best.target.id.replace("page-", ""), 10);
        if (!isNaN(index)) saveProgress(index + 1);
      },
      { threshold: [0.35, 0.5, 0.65, 0.8] }
    );

    pages.forEach((_, idx) => {
      const el = document.getElementById(`page-${idx}`);
      if (el) observer.current?.observe(el);
    });

    return () => observer.current?.disconnect();
  }, [viewMode, loading, pages, saveProgress]);

  const progressPct = totalPages ? Math.round((currentPage / totalPages) * 100) : 0;
  const renderPct = totalPages ? Math.round((currentRender / totalPages) * 100) : 0;

  const themeStyles = useMemo(() => {
    return {
      light: "bg-white border-gray-100",
      sepia: "bg-[#f4ecd8] border-[#e6d5b8]",
      dark: "bg-[#0f0f0f] border-gray-800",
    };
  }, []);

  const shellBg = useMemo(() => {
    if (theme === "dark") return "bg-[#111] text-gray-200";
    if (theme === "sepia") return "bg-[#fcfaf7] text-amber-900";
    return "bg-[#fcfaf7] text-gray-800";
  }, [theme]);

  // Ir a página (flip/scroll)
  const manualGoToPage = (p: number) => {
    if (!Number.isFinite(p) || p < 1 || p > totalPages) return;

    if (viewMode === "flip") {
      bookRef.current?.pageFlip()?.turnToPage(p - 1);
      saveProgress(p);
    } else {
      const el = document.getElementById(`page-${p - 1}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        saveProgress(p);
      }
    }
  };

  const handleGoToSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    manualGoToPage(parseInt(targetPage, 10));
    setTargetPage("");
  };

  // flip page change
  const onFlip = useCallback(
    (e: any) => {
      saveProgress(e.data + 1);
    },
    [saveProgress]
  );

  const FlipBookComponent: any = HTMLFlipBook;

  // UI helpers
  const canToggleMode = !isMobile; // flip/scroll manual solo desktop

  const decreaseZoom = () => setZoom((z) => clamp(+((z - 0.1).toFixed(2)), 0.7, 2.4));
  const increaseZoom = () => setZoom((z) => clamp(+((z + 0.1).toFixed(2)), 0.7, 2.4));

  return (
    <div
      className={`w-full ${shellBg} min-h-[70vh]`}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Resume toast sobrio */}
      {resumeMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] bg-black/80 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-xl backdrop-blur-md flex items-center gap-2">
          <span>📖 {resumeMsg}</span>
          <button
            onClick={() => setResumeMsg("")}
            className="ml-1 text-white/70 hover:text-white"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      )}

      {/* Toolbar editorial (limpia, pro, no “startup”) */}
      <div className="sticky top-4 z-50 mx-auto max-w-6xl px-3">
        <div
          className={`flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-3 py-2 rounded-full border shadow-sm backdrop-blur-xl ${
            theme === "dark" ? "bg-black/60 border-gray-800" : "bg-white/80 border-amber-100"
          }`}
        >
          {/* Toggle modo (solo desktop) */}
          {canToggleMode && (
            <button
              onClick={() => setViewMode(viewMode === "flip" ? "scroll" : "flip")}
              className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition ${
                theme === "dark"
                  ? "bg-transparent border-gray-700 text-gray-200 hover:bg-white/10"
                  : "bg-transparent border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
              title="Cambiar modo de lectura"
            >
              {viewMode === "flip" ? "Vista continua" : "Libro"}
            </button>
          )}

          {/* Themes */}
          <div
            className={`flex items-center gap-1 p-1 rounded-full border ${
              theme === "dark" ? "border-gray-700" : "border-gray-200"
            }`}
          >
            {(["light", "sepia", "dark"] as Theme[]).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`w-7 h-7 rounded-full border transition ${
                  theme === t ? "ring-2 ring-amber-500" : "opacity-70 hover:opacity-100"
                } ${
                  t === "light"
                    ? "bg-white border-gray-200"
                    : t === "sepia"
                    ? "bg-[#f4ecd8] border-[#e6d5b8]"
                    : "bg-[#2a2a2a] border-gray-700"
                }`}
                aria-label={`Tema ${t}`}
                title={`Tema ${t}`}
              />
            ))}
          </div>

          {/* Zoom */}
          <div
            className={`flex items-center rounded-full border px-2 ${
              theme === "dark" ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <button
              className={`px-2 py-1 font-black ${
                theme === "dark" ? "text-gray-200 hover:text-white" : "text-gray-800 hover:text-black"
              }`}
              onClick={decreaseZoom}
              aria-label="Disminuir zoom"
              title="Disminuir"
            >
              –
            </button>
            <span className="text-[10px] w-12 text-center font-black">
              {Math.round(zoom * 100)}%
            </span>
            <button
              className={`px-2 py-1 font-black ${
                theme === "dark" ? "text-gray-200 hover:text-white" : "text-gray-800 hover:text-black"
              }`}
              onClick={increaseZoom}
              aria-label="Aumentar zoom"
              title="Aumentar"
            >
              +
            </button>
          </div>

          {/* Go to page */}
          <form onSubmit={handleGoToSubmit} className="flex items-center gap-2">
            <span className={`text-[10px] uppercase tracking-widest ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
              Pág
            </span>
            <input
              type="number"
              inputMode="numeric"
              placeholder={currentPage.toString()}
              className={`w-14 px-2 py-1 text-[11px] text-center rounded-lg border outline-none focus:border-amber-500 ${
                theme === "dark"
                  ? "bg-black/40 text-white border-gray-700"
                  : "bg-white text-gray-900 border-gray-200"
              }`}
              value={targetPage}
              onChange={(e) => setTargetPage(e.target.value)}
            />
            <button
              type="submit"
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition ${
                theme === "dark"
                  ? "border-gray-700 text-gray-200 hover:bg-white/10"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Ir
            </button>
          </form>

          {/* Progreso */}
          <div className="flex items-center gap-2">
            <span className={`text-[10px] uppercase tracking-widest ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
              {currentPage}/{totalPages || "—"}
            </span>
            <div className={`w-24 h-2 rounded-full overflow-hidden border ${theme === "dark" ? "border-gray-800" : "border-gray-200"}`}>
              <div
                className="h-full bg-amber-600"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="flex flex-col items-center justify-center py-14 rounded-3xl bg-white/60 border border-amber-100 shadow-sm">
            <div className="relative w-14 h-14 mb-4">
              <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-xs text-amber-700 font-bold uppercase tracking-widest">
              Preparando lectura… {renderPct}%
            </p>
            <p className="text-[11px] text-gray-400 mt-2">
              Esto puede tardar un poco en teléfonos.
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {errMsg && !loading && (
        <div className="max-w-3xl mx-auto px-6 py-10">
          <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 text-sm font-medium shadow-sm">
            ⚠️ {errMsg}
          </div>
        </div>
      )}

      {/* --- MODO LIBRO (FLIP) — Desktop --- */}
      {viewMode === "flip" && !loading && pages.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 pt-6">
          <div className={`border rounded-[2rem] p-4 sm:p-10 shadow-sm ${themeStyles[theme]}`}>
            <div
              className="mx-auto"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top center",
                transition: "transform 180ms ease-out",
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
                className="book-main"
                style={{ margin: "0 auto" }}
                startPage={0}
                onFlip={onFlip}
                usePortrait={true}
                flippingTime={760}
                maxShadowOpacity={0.45}
                showPageCorners={true}
                clickEventForward={!isZoomedFlip}
                disableFlipByClick={isZoomedFlip}
                useMouseEvents={!isZoomedFlip}
                swipeDistance={isZoomedFlip ? 9999 : 30}
              >
                {pages.map((src, idx) => (
                  <div key={idx} className="bg-white overflow-hidden relative">
                    {/* Capa protección */}
                    <div className="absolute inset-0 z-10 w-full h-full" />
                    <div className="w-full h-full p-2 flex items-center justify-center">
                      <img
                        src={src}
                        alt={`Pág ${idx + 1}`}
                        className="max-w-full max-h-full object-contain pointer-events-none select-none"
                        draggable={false}
                        style={{
                          filter: theme === "dark" ? "brightness(0.9) contrast(1.05)" : "none",
                        }}
                      />
                    </div>
                    <div className="absolute bottom-3 w-full text-center text-[9px] text-gray-400 font-serif opacity-60">
                      — {idx + 1} —
                    </div>
                  </div>
                ))}
              </FlipBookComponent>
            </div>
          </div>
        </div>
      )}

      {/* --- MODO LECTURA CONTINUA (SCROLL) — Móvil / Opción desktop --- */}
      {viewMode === "scroll" && !loading && pages.length > 0 && (
        <div className="max-w-4xl mx-auto px-0 sm:px-6 pb-24 pt-6">
          {/* Header mínimo de lectura */}
          <div className="px-4 sm:px-0 mb-4">
            <div
              className={`rounded-2xl border px-4 py-3 text-center text-[11px] ${
                theme === "dark"
                  ? "bg-black/40 border-gray-800 text-gray-200"
                  : theme === "sepia"
                  ? "bg-[#f4ecd8]/70 border-[#e6d5b8] text-amber-900"
                  : "bg-white/60 border-gray-200 text-gray-700"
              }`}
            >
              Vista continua • {progressPct}% leído
            </div>
          </div>

          <div
            className="w-full origin-top transition-transform duration-150 ease-out"
            style={{
              transform: `scale(${zoom})`,
              overscrollBehavior: "contain",
            }}
          >
            {pages.map((src, idx) => (
              <div
                key={idx}
                id={`page-${idx}`}
                className={`w-full relative mb-3 border ${themeStyles[theme]} ${
                  theme === "dark" ? "shadow-none" : "shadow-sm"
                }`}
              >
                {/* Capa protección */}
                <div className="absolute inset-0 z-20 w-full h-full bg-transparent" />

                <img
                  src={src}
                  alt={`Página ${idx + 1}`}
                  className="w-full h-auto block pointer-events-none select-none"
                  loading="lazy"
                  draggable={false}
                  style={{
                    filter:
                      theme === "dark"
                        ? "invert(0.92) hue-rotate(180deg) contrast(0.9)"
                        : theme === "sepia"
                        ? "sepia(0.22) contrast(1.03)"
                        : "none",
                  }}
                />

                <div className="absolute bottom-2 right-2 bg-black/40 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                  {idx + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estilos globales del viewer (sin romper toda la app) */}
      <style jsx global>{`
        .book-main {
          background: transparent;
        }
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        /* Bloqueo solo dentro del lector (NO global a toda la app) */
        .book-main,
        .book-main * {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
      `}</style>
    </div>
  );
}