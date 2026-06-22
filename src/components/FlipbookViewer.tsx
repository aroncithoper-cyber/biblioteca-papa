"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
// @ts-ignore
import HTMLFlipBook from "react-pageflip";
import * as pdfjsLib from "pdfjs-dist";
import { auth } from "@/lib/firebase";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

type Props = { fileUrl: string };
type Theme = "light" | "sepia" | "dark";
type ViewMode = "flip" | "scroll";

const MOBILE_INITIAL_PAGES = 4;
const MOBILE_BATCH_SIZE = 2;
const DESKTOP_BATCH_SIZE = 3;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function isMobileReaderDevice(): boolean {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(max-width: 767px)").matches ||
    /Android/i.test(navigator.userAgent)
  );
}

function yieldToMain(ms = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function FlipbookViewer({ fileUrl }: Props) {
  const bookRef = useRef<any>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const pdfDocRef = useRef<any>(null);

  const [pages, setPages] = useState<(string | null)[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [currentRender, setCurrentRender] = useState(0);
  const [backgroundRendering, setBackgroundRendering] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [resumeMsg, setResumeMsg] = useState("");

  const [zoom, setZoom] = useState(1);
  const [theme, setTheme] = useState<Theme>("light");
  const [targetPage, setTargetPage] = useState("");

  const [isMobileReader, setIsMobileReader] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("scroll");
  const [bookDimensions, setBookDimensions] = useState({ width: 380, height: 560 });

  const isZoomedFlip = zoom > 1.01;
  const maxZoom = isMobileReader ? 1.5 : 3.0;

  const storageKey = `progress_${fileUrl}`;

  const saveProgress = useCallback((pageNum: number) => {
    if (pageNum > 0) {
      localStorage.setItem(storageKey, pageNum.toString());
      setCurrentPage(pageNum);
    }
  }, [storageKey]);

  const manualGoToPage = useCallback((p: number) => {
    if (!Number.isFinite(p) || p < 1 || p > totalPages) return;

    if (viewMode === "flip" && !isMobileReader) {
      bookRef.current?.pageFlip()?.turnToPage(p - 1);
      saveProgress(p);
    } else {
      const el = document.getElementById(`page-${p - 1}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        saveProgress(p);
      }
    }
  }, [viewMode, isMobileReader, totalPages, saveProgress]);

  useEffect(() => {
    const mobile = isMobileReaderDevice();
    setIsMobileReader(mobile);
    if (mobile) {
      setViewMode("scroll");
      setZoom((z) => Math.min(z, 1.5));
    } else {
      setViewMode("flip");
    }
  }, []);

  useEffect(() => {
    if (!loading && totalPages > 0) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const p = parseInt(saved, 10);
        if (p > 1 && p <= totalPages) {
          setTimeout(() => {
            manualGoToPage(p);
            setResumeMsg(`📖 Retomando en pág. ${p}`);
            setTimeout(() => setResumeMsg(""), 3000);
          }, 500);
        }
      }
    }
  }, [loading, totalPages, storageKey, manualGoToPage]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (k === "p" || k === "s" || k === "c")) {
        e.preventDefault();
        alert("Contenido protegido por derechos de autor - El Consejo del Obrero");
      }
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKeyDown, { capture: true } as any);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();

    async function renderSinglePage(
      pdfDoc: any,
      pageNum: number,
      scale: number,
      userMark: string
    ): Promise<string> {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas no disponible");

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;

      ctx.save();
      const fontSize = Math.floor(canvas.width / 22);
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = "rgba(0, 0, 0, 0.04)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 4);
      ctx.fillText("Consejero del Obrero - " + userMark, 0, 0);
      ctx.restore();

      const quality = scale <= 1.5 ? 0.72 : 0.8;
      return canvas.toDataURL("image/jpeg", quality);
    }

    async function renderPdf() {
      try {
        setErrMsg("");
        setLoading(true);
        setBackgroundRendering(false);
        setPages([]);
        setTotalPages(0);
        setCurrentRender(0);

        const res = await fetch(fileUrl, { cache: "force-cache", signal: ac.signal });
        if (!res.ok) throw new Error("Error cargando documento");

        const data = await res.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({ data }).promise;
        pdfDocRef.current = pdfDoc;

        if (cancelled) return;

        const mobile = isMobileReaderDevice();
        const renderScale = mobile ? 1.35 : 2.0;
        const numPages = pdfDoc.numPages;
        setTotalPages(numPages);

        const firstPage = await pdfDoc.getPage(1);
        const vp1 = firstPage.getViewport({ scale: 1 });
        const ratio = vp1.width / vp1.height;
        const baseHeight = 560;
        const width = clamp(Math.floor(baseHeight * ratio), 320, 560);
        setBookDimensions({ width, height: baseHeight });

        const userMark = auth.currentUser?.email || "Copia de Lectura";
        const imgs: (string | null)[] = new Array(numPages).fill(null);

        const initialCount = mobile
          ? Math.min(MOBILE_INITIAL_PAGES, numPages)
          : Math.min(DESKTOP_BATCH_SIZE, numPages);

        for (let i = 1; i <= initialCount; i++) {
          if (cancelled) return;
          setCurrentRender(i);
          imgs[i - 1] = await renderSinglePage(pdfDoc, i, renderScale, userMark);
          setPages([...imgs]);
          if (mobile) await yieldToMain(16);
        }

        if (cancelled) return;
        setLoading(false);

        if (initialCount >= numPages) {
          setBackgroundRendering(false);
          return;
        }

        setBackgroundRendering(true);
        const batchSize = mobile ? MOBILE_BATCH_SIZE : DESKTOP_BATCH_SIZE;

        for (let i = initialCount + 1; i <= numPages; i++) {
          if (cancelled) return;
          setCurrentRender(i);
          imgs[i - 1] = await renderSinglePage(pdfDoc, i, renderScale, userMark);
          setPages([...imgs]);

          if (mobile && (i - initialCount) % batchSize === 0) {
            await yieldToMain(32);
          } else if (!mobile && i % batchSize === 0) {
            await yieldToMain(8);
          }
        }

        if (!cancelled) setBackgroundRendering(false);
      } catch (e: any) {
        if (cancelled) return;
        if (e?.name === "AbortError") return;
        setErrMsg("No se pudo cargar el documento.");
        setLoading(false);
        setBackgroundRendering(false);
      }
    }

    renderPdf();

    return () => {
      cancelled = true;
      ac.abort();
      try {
        pdfDocRef.current?.destroy?.();
      } catch {}
      pdfDocRef.current = null;
    };
  }, [fileUrl]);

  useEffect(() => {
    if (viewMode === "scroll" && !loading && pages.length > 0) {
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          const visibleEntry = entries.find((entry) => entry.isIntersecting);
          if (visibleEntry) {
            const index = parseInt(visibleEntry.target.id.replace("page-", ""), 10);
            if (!isNaN(index)) saveProgress(index + 1);
          }
        },
        { threshold: 0.35, rootMargin: "0px 0px -10% 0px" }
      );

      pages.forEach((_, idx) => {
        const el = document.getElementById(`page-${idx}`);
        if (el) observer.current?.observe(el);
      });
    }

    return () => observer.current?.disconnect();
  }, [viewMode, loading, pages, saveProgress]);

  const renderedCount = pages.filter(Boolean).length;
  const progress = totalPages ? Math.round((currentRender / totalPages) * 100) : 0;

  const themeStyles = useMemo(() => {
    return {
      light: "bg-[#fdfdfd]",
      sepia: "bg-[#f4ecd8] border-[#e6d5b8]",
      dark: "bg-[#0f0f0f] border-gray-800",
    };
  }, []);

  const headerBg = useMemo(() => {
    if (theme === "dark") return "bg-black/80 text-gray-200";
    if (theme === "sepia") return "bg-[#f4ecd8]/90 text-amber-900";
    return "bg-white/90 text-gray-600";
  }, [theme]);

  const handleGoToSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    manualGoToPage(parseInt(targetPage, 10));
    setTargetPage("");
  };

  const onFlip = useCallback((e: any) => {
    saveProgress(e.data + 1);
  }, [saveProgress]);

  const FlipBookComponent: any = HTMLFlipBook;
  const effectiveViewMode = isMobileReader ? "scroll" : viewMode;
  const loadedPagesReady = renderedCount > 0;

  return (
    <div
      className={`w-full flex flex-col items-center gap-3 md:gap-4 py-2 md:py-4 transition-colors duration-500 min-h-0 overflow-x-hidden ${
        theme === "dark" ? "bg-[#121212]" : "bg-gray-50"
      } ${isMobileReader ? "flipbook-mobile-reader" : "md:min-h-screen"}`}
      onContextMenu={(e) => e.preventDefault()}
    >
      {resumeMsg && (
        <div className="fixed top-[4.5rem] md:top-20 left-1/2 -translate-x-1/2 z-[60] max-w-[90vw] bg-black/80 text-white px-4 sm:px-6 py-2 rounded-full text-xs font-bold shadow-xl backdrop-blur-md flex items-center gap-2 pointer-events-auto">
          <span className="truncate">{resumeMsg}</span>
          <button type="button" onClick={() => setResumeMsg("")} className="ml-1 min-w-[32px] min-h-[32px] flex items-center justify-center text-gray-400 hover:text-white flex-shrink-0" aria-label="Cerrar aviso">✕</button>
        </div>
      )}

      <div
        className={`sticky top-2 md:top-4 z-40 w-[calc(100%-1rem)] max-w-4xl mx-auto px-3 py-3 md:px-4 md:py-2 backdrop-blur-xl border rounded-2xl md:rounded-full shadow-lg transition-colors duration-300 ${
          theme === "dark" ? "bg-gray-900/90 border-gray-700" : "bg-white/95 border-amber-100"
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3">
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            {!isMobileReader && (
              <>
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === "flip" ? "scroll" : "flip")}
                  className="min-h-[44px] flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-full text-[10px] font-bold uppercase hover:shadow-lg transition-all active:scale-95"
                >
                  {viewMode === "flip" ? "📱 Modo Ebook" : "📖 Modo Libro 3D"}
                </button>
                <div className="w-px h-6 bg-gray-300 hidden sm:block" />
              </>
            )}

            <div
              className={`flex gap-1.5 p-1.5 rounded-full ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"}`}
              role="group"
              aria-label="Tema de lectura"
            >
              {(["light", "sepia", "dark"] as Theme[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-label={t === "light" ? "Tema claro" : t === "sepia" ? "Tema sepia" : "Tema oscuro"}
                  onClick={() => setTheme(t)}
                  className={`min-w-[44px] min-h-[44px] w-11 h-11 md:min-w-0 md:min-h-0 md:w-7 md:h-7 rounded-full border transition-transform ${
                    theme === t ? "ring-2 ring-amber-500 scale-105" : "opacity-60"
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
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap border-t border-gray-200/60 pt-3 sm:border-t-0 sm:pt-0">
            {!isMobileReader && (
              <>
                <div className="w-px h-6 bg-gray-300 hidden sm:block" />
                <div
                  className={`flex items-center border rounded-full ${theme === "dark" ? "bg-black border-gray-700 text-white" : "bg-white text-black border-gray-200"}`}
                >
                  <button
                    type="button"
                    aria-label="Reducir zoom"
                    className="min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 px-3 md:px-2 font-bold hover:text-amber-600 flex items-center justify-center"
                    onClick={() => setZoom((z) => clamp(+((z - 0.1).toFixed(2)), 0.5, maxZoom))}
                  >
                    –
                  </button>
                  <span className="text-[10px] w-12 text-center font-black tabular-nums">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    type="button"
                    aria-label="Aumentar zoom"
                    className="min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 px-3 md:px-2 font-bold hover:text-amber-600 flex items-center justify-center"
                    onClick={() => setZoom((z) => clamp(+((z + 0.1).toFixed(2)), 0.5, maxZoom))}
                  >
                    +
                  </button>
                </div>
              </>
            )}

            <form
              onSubmit={handleGoToSubmit}
              className={`flex items-center gap-2 pl-0 sm:pl-3 ${!isMobileReader ? "sm:border-l border-gray-200" : ""} ${theme === "dark" ? "border-gray-700" : ""}`}
            >
              <input
                type="number"
                inputMode="numeric"
                placeholder={currentPage.toString()}
                aria-label="Número de página"
                className={`w-14 min-h-[44px] md:min-h-0 md:w-12 px-2 py-2 md:py-1 text-xs md:text-[10px] text-center border rounded-lg md:rounded outline-none focus:border-amber-500 ${
                  theme === "dark" ? "bg-gray-800 text-white border-gray-600" : "bg-white border-gray-200"
                }`}
                value={targetPage}
                onChange={(e) => setTargetPage(e.target.value)}
              />
              <button
                type="submit"
                className="min-h-[44px] md:min-h-0 px-4 md:px-0 text-xs md:text-[10px] font-bold uppercase text-amber-600 hover:text-amber-700"
              >
                Ir
              </button>
            </form>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 md:py-32 animate-pulse px-4">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-xs text-amber-600 font-bold uppercase tracking-widest">
            Preparando Biblioteca... {progress}%
          </p>
        </div>
      )}

      {errMsg && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-medium shadow-sm">
          ⚠️ {errMsg}
        </div>
      )}

      {effectiveViewMode === "flip" && !loading && loadedPagesReady && (
        <div
          className={`w-full max-w-6xl border rounded-[2.5rem] p-4 sm:p-10 shadow-inner transition-colors ${themeStyles[theme]} ${
            theme === "dark" ? "border-gray-800 shadow-none" : "border-gray-100"
          }`}
        >
          <div
            className="mx-auto max-w-full overflow-x-hidden"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top center",
              transition: "transform 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
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
              onFlip={onFlip}
              usePortrait={true}
              flippingTime={800}
              maxShadowOpacity={0.5}
              showPageCorners={true}
              clickEventForward={!isZoomedFlip}
              disableFlipByClick={isZoomedFlip}
              useMouseEvents={!isZoomedFlip}
              swipeDistance={isZoomedFlip ? 9999 : 30}
            >
              {pages.map((src, idx) =>
                src ? (
                  <div key={idx} className="bg-white border-l border-gray-50 overflow-hidden relative group">
                    <div className="w-full h-full p-2 flex items-center justify-center relative">
                      <img
                        src={src}
                        alt={`Pág ${idx + 1}`}
                        className="max-w-full max-h-full object-contain pointer-events-none select-none"
                        draggable={false}
                        style={{
                          filter: theme === "dark" ? "brightness(0.9) contrast(1.1)" : "none",
                        }}
                      />
                    </div>
                    <div className="absolute bottom-3 w-full text-center text-[9px] text-gray-400 font-serif opacity-50 pointer-events-none">
                      — {idx + 1} —
                    </div>
                  </div>
                ) : null
              )}
            </FlipBookComponent>
          </div>
        </div>
      )}

      {effectiveViewMode === "scroll" && !loading && loadedPagesReady && (
        <div className="w-full max-w-3xl px-0 flex flex-col gap-0 pb-24 md:pb-32 overflow-x-hidden flipbook-scroll-root">
          <div className={`text-center py-2.5 md:py-3 text-[10px] font-bold uppercase tracking-widest ${headerBg} backdrop-blur-md border-b border-gray-100/10 shadow-sm`}>
            Vista Continua • Pág. {currentPage}{totalPages > 0 ? ` / ${totalPages}` : ""}
            {backgroundRendering && (
              <span className="block mt-1 text-[9px] font-normal normal-case text-amber-600">
                Preparando páginas… {renderedCount}/{totalPages}
              </span>
            )}
          </div>

          <div className="w-full max-w-full overflow-x-hidden">
            {pages.map((src, idx) => (
              <div
                key={idx}
                id={`page-${idx}`}
                className={`w-full relative shadow-sm ${themeStyles[theme]} mb-2 transition-colors duration-300`}
              >
                {src ? (
                  <img
                    src={src}
                    alt={`Página ${idx + 1}`}
                    className="w-full h-auto block pointer-events-none select-none"
                    loading={idx < 6 ? "eager" : "lazy"}
                    draggable={false}
                    style={{
                      filter:
                        theme === "dark"
                          ? "invert(0.92) hue-rotate(180deg) contrast(0.9)"
                          : theme === "sepia"
                          ? "sepia(0.25) contrast(1.05)"
                          : "none",
                    }}
                  />
                ) : (
                  <div className="w-full min-h-[40vh] flex flex-col items-center justify-center gap-2 py-8">
                    <div className="w-6 h-6 border-2 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                      Página {idx + 1}
                    </p>
                  </div>
                )}

                <div className="absolute bottom-2 right-2 bg-black/40 text-white px-2 py-0.5 rounded text-[9px] font-bold pointer-events-none md:opacity-0 md:group-hover:opacity-100">
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

        .flipbook-mobile-reader {
          touch-action: pan-y;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-y: auto;
        }

        .flipbook-mobile-reader .flipbook-scroll-root {
          touch-action: pan-y;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-y: contain;
        }

        .flipbook-mobile-reader * {
          -webkit-user-select: none;
          user-select: none;
        }

        .flipbook-mobile-reader input,
        .flipbook-mobile-reader textarea,
        .flipbook-mobile-reader button {
          -webkit-user-select: text;
          user-select: text;
        }

        @media (min-width: 768px) {
          html { scroll-behavior: smooth; }
        }
      `}</style>
    </div>
  );
}
