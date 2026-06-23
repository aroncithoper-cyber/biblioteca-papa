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

const MOBILE_INITIAL_PAGES = 2;
const MOBILE_BATCH_SIZE = 2;
const MOBILE_RENDER_DELAY_MS = 120;
const DESKTOP_BATCH_SIZE = 4;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches;
}

function getRenderScale(): number {
  if (typeof window === "undefined") return 2;
  const dpr = window.devicePixelRatio || 1;
  if (isMobileViewport()) {
    return clamp(dpr * 1.35, 1.35, 2.0);
  }
  return 2.0;
}

function yieldToMain(ms = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getVisiblePageCount(pages: (string | null)[]): number {
  if (pages.length === 0) return 0;
  const firstGap = pages.findIndex((p) => !p);
  if (firstGap === -1) return pages.length;
  return firstGap;
}

export default function FlipbookViewer({ fileUrl }: Props) {
  const bookRef = useRef<any>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const pdfDocRef = useRef<any>(null);
  const blobUrlsRef = useRef<string[]>([]);
  const pauseRenderUntilRef = useRef(0);
  const renderLoopRef = useRef<{ cancelled: boolean }>({ cancelled: false });

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
  const [viewMode, setViewMode] = useState<ViewMode>("flip");
  const [bookDimensions, setBookDimensions] = useState({ width: 380, height: 560 });

  const isZoomedFlip = zoom > 1.01;
  const maxZoom = 3.0;
  const storageKey = `progress_${fileUrl}`;

  const pauseBackgroundRender = useCallback((ms = 2000) => {
    pauseRenderUntilRef.current = Date.now() + ms;
  }, []);

  const waitIfPaused = useCallback(async () => {
    while (Date.now() < pauseRenderUntilRef.current) {
      if (renderLoopRef.current.cancelled) return false;
      await yieldToMain(60);
    }
    return !renderLoopRef.current.cancelled;
  }, []);

  const revokeBlobUrls = useCallback(() => {
    blobUrlsRef.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    });
    blobUrlsRef.current = [];
  }, []);

  const saveProgress = useCallback(
    (pageNum: number) => {
      if (pageNum > 0) {
        localStorage.setItem(storageKey, pageNum.toString());
        setCurrentPage(pageNum);
      }
    },
    [storageKey]
  );

  const manualGoToPage = useCallback(
    (p: number) => {
      if (!Number.isFinite(p) || p < 1 || p > totalPages) return;

      if (viewMode === "flip") {
        bookRef.current?.pageFlip()?.turnToPage(p - 1);
        saveProgress(p);
      } else {
        document.getElementById(`page-${p - 1}`)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        saveProgress(p);
      }
    },
    [viewMode, totalPages, saveProgress]
  );

  useEffect(() => {
    const apply = () => {
      if (isMobileViewport()) setViewMode("scroll");
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  useEffect(() => {
    const pause = () => pauseBackgroundRender(2000);
    window.addEventListener("scroll", pause, { passive: true });
    window.addEventListener("touchstart", pause, { passive: true });
    return () => {
      window.removeEventListener("scroll", pause);
      window.removeEventListener("touchstart", pause);
    };
  }, [pauseBackgroundRender]);

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
    renderLoopRef.current.cancelled = false;
    const loop = renderLoopRef.current;

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
      const fontSize = Math.max(10, Math.floor(canvas.width / 24));
      ctx.font = `bold ${fontSize}px serif`;
      ctx.fillStyle = "rgba(120, 120, 120, 0.08)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 4);
      ctx.fillText("Consejero del Obrero - " + userMark, 0, 0);
      ctx.restore();

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85);
      });
      if (!blob) throw new Error("No se pudo convertir la página");

      const objectUrl = URL.createObjectURL(blob);
      blobUrlsRef.current.push(objectUrl);
      return objectUrl;
    }

    async function renderPdf() {
      try {
        revokeBlobUrls();
        setErrMsg("");
        setLoading(true);
        setBackgroundRendering(false);
        setPages([]);
        setTotalPages(0);
        setCurrentRender(0);

        const mobile = isMobileViewport();
        const renderScale = getRenderScale();

        let pdfDoc: any;
        try {
          pdfDoc = await pdfjsLib.getDocument({
            url: fileUrl,
            disableStream: false,
            disableAutoFetch: false,
          }).promise;
        } catch {
          const res = await fetch(fileUrl, { cache: "force-cache" });
          if (!res.ok) throw new Error("Error cargando documento");
          const data = await res.arrayBuffer();
          pdfDoc = await pdfjsLib.getDocument({ data }).promise;
        }

        pdfDocRef.current = pdfDoc;
        if (loop.cancelled) return;

        const numPages = pdfDoc.numPages;
        setTotalPages(numPages);

        const firstPage = await pdfDoc.getPage(1);
        const vp1 = firstPage.getViewport({ scale: 1 });
        const ratio = vp1.width / vp1.height;
        const baseHeight = 560;
        const width = clamp(Math.floor(baseHeight * ratio), 320, 560);
        setBookDimensions({ width, height: baseHeight });

        const userMark = auth.currentUser?.email || "Copia Protegida";
        const imgs: (string | null)[] = new Array(numPages).fill(null);

        const initialCount = mobile
          ? Math.min(MOBILE_INITIAL_PAGES, numPages)
          : Math.min(DESKTOP_BATCH_SIZE, numPages);

        for (let i = 1; i <= initialCount; i++) {
          if (loop.cancelled) return;
          if (!(await waitIfPaused())) return;

          setCurrentRender(i);
          imgs[i - 1] = await renderSinglePage(pdfDoc, i, renderScale, userMark);
          setPages([...imgs]);
          if (mobile) await yieldToMain(48);
        }

        if (loop.cancelled) return;
        setLoading(false);

        if (initialCount >= numPages) {
          setBackgroundRendering(false);
          return;
        }

        setBackgroundRendering(true);
        const batchSize = mobile ? MOBILE_BATCH_SIZE : DESKTOP_BATCH_SIZE;

        for (let i = initialCount + 1; i <= numPages; i++) {
          if (loop.cancelled) return;
          if (!(await waitIfPaused())) return;

          setCurrentRender(i);
          imgs[i - 1] = await renderSinglePage(pdfDoc, i, renderScale, userMark);

          const shouldFlush =
            i === numPages || (i - initialCount) % batchSize === 0;

          if (shouldFlush) {
            setPages([...imgs]);
            if (mobile) await yieldToMain(MOBILE_RENDER_DELAY_MS);
          }
        }

        if (!loop.cancelled) {
          setPages([...imgs]);
          setBackgroundRendering(false);
        }
      } catch {
        if (loop.cancelled) return;
        setErrMsg("No se pudo cargar el documento.");
        setLoading(false);
        setBackgroundRendering(false);
      }
    }

    renderPdf();

    return () => {
      loop.cancelled = true;
      try {
        pdfDocRef.current?.destroy?.();
      } catch {}
      pdfDocRef.current = null;
      revokeBlobUrls();
    };
  }, [fileUrl, revokeBlobUrls, waitIfPaused]);

  const visiblePageCount = getVisiblePageCount(pages);
  const visiblePages = pages.slice(0, visiblePageCount);

  useEffect(() => {
    if (viewMode === "scroll" && !loading && visiblePageCount > 0) {
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          const visibleEntry = entries.find((entry) => entry.isIntersecting);
          if (visibleEntry) {
            const index = parseInt(
              visibleEntry.target.id.replace("page-", ""),
              10
            );
            if (!isNaN(index)) saveProgress(index + 1);
          }
        },
        { threshold: 0.25, root: null, rootMargin: "-10% 0px -10% 0px" }
      );

      visiblePages.forEach((_, idx) => {
        const el = document.getElementById(`page-${idx}`);
        if (el) observer.current?.observe(el);
      });
    }

    return () => observer.current?.disconnect();
  }, [viewMode, loading, visiblePageCount, visiblePages, saveProgress]);

  const progress = totalPages ? Math.round((currentRender / totalPages) * 100) : 0;

  const themeStyles = useMemo(
    () => ({
      light: "bg-[#fdfdfd]",
      sepia: "bg-[#f4ecd8]",
      dark: "bg-[#0f0f0f]",
    }),
    []
  );

  const headerBg = useMemo(() => {
    if (theme === "dark") return "bg-black/80 text-gray-200";
    if (theme === "sepia") return "bg-[#f4ecd8]/90 text-amber-900";
    return "bg-white/90 text-gray-600";
  }, [theme]);

  const pageFilterStyle = useMemo(() => {
    if (theme === "dark") return "invert(0.9) hue-rotate(180deg)";
    if (theme === "sepia") return "sepia(0.3)";
    return "none";
  }, [theme]);

  const handleGoToSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    manualGoToPage(parseInt(targetPage, 10));
    setTargetPage("");
  };

  const onFlip = useCallback(
    (e: any) => {
      saveProgress(e.data + 1);
    },
    [saveProgress]
  );

  const FlipBookComponent: any = HTMLFlipBook;
  const loadedPagesReady = visiblePageCount > 0;

  return (
    <div
      className={`flipbook-viewer w-full flex flex-col items-center gap-3 md:gap-4 py-2 md:py-4 transition-colors duration-500 min-h-0 overflow-x-hidden ${
        theme === "dark" ? "bg-[#121212]" : "bg-gray-50"
      }`}
      onContextMenu={(e) => e.preventDefault()}
    >
      {resumeMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] max-w-[90vw] bg-black/80 text-white px-4 sm:px-6 py-2 rounded-full text-xs font-bold shadow-xl backdrop-blur-md flex items-center gap-2 pointer-events-none">
          <span className="truncate">{resumeMsg}</span>
        </div>
      )}

      <div
        className={`flipbook-toolbar sticky top-2 sm:top-4 z-40 w-[calc(100%-0.5rem)] sm:w-[calc(100%-1rem)] max-w-4xl mx-auto px-3 py-3 md:px-4 md:py-2 backdrop-blur-xl border rounded-full shadow-lg transition-colors duration-300 ${
          theme === "dark" ? "bg-gray-900/90 border-gray-700" : "bg-white/95 border-amber-100"
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3">
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === "flip" ? "scroll" : "flip")}
              className="min-h-[44px] flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-full text-[10px] font-bold uppercase hover:shadow-lg transition-all active:scale-95"
            >
              {viewMode === "flip" ? "📱 Modo Ebook" : "📖 Modo Libro 3D"}
            </button>
            <div
              className={`flex gap-1.5 p-1.5 rounded-full ${
                theme === "dark" ? "bg-gray-800" : "bg-gray-100"
              }`}
            >
              {(["light", "sepia", "dark"] as Theme[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={`min-w-[44px] min-h-[44px] md:min-w-7 md:min-h-7 md:w-7 md:h-7 rounded-full border ${
                    theme === t ? "ring-2 ring-amber-500" : "opacity-60"
                  } ${t === "light" ? "bg-white" : t === "sepia" ? "bg-[#f4ecd8]" : "bg-[#2c2c2c]"}`}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap border-t border-gray-200/60 pt-3 sm:border-t-0 sm:pt-0">
            <div
              className={`flex items-center border rounded-full ${
                theme === "dark"
                  ? "bg-black border-gray-700 text-white"
                  : "bg-white text-black border-gray-200"
              }`}
            >
              <button
                type="button"
                onClick={() =>
                  setZoom((z) => clamp(+((z - 0.1).toFixed(2)), 0.5, maxZoom))
                }
                className="px-3 min-h-[44px] font-bold"
              >
                –
              </button>
              <span className="text-[10px] w-12 text-center font-black">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() =>
                  setZoom((z) => clamp(+((z + 0.1).toFixed(2)), 0.5, maxZoom))
                }
                className="px-3 min-h-[44px] font-bold"
              >
                +
              </button>
            </div>
            <form
              onSubmit={handleGoToSubmit}
              className="flex items-center gap-2 sm:border-l border-gray-200 pl-0 sm:pl-3"
            >
              <input
                type="number"
                inputMode="numeric"
                placeholder={currentPage.toString()}
                className="w-14 min-h-[44px] md:min-h-0 md:w-12 px-2 text-xs text-center border rounded-lg outline-none"
                value={targetPage}
                onChange={(e) => setTargetPage(e.target.value)}
              />
              <button
                type="submit"
                className="min-h-[44px] px-4 text-xs font-bold uppercase text-amber-600"
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
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full" />
            <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin" />
          </div>
          <p className="text-xs text-amber-600 font-bold uppercase tracking-widest">
            Preparando… {progress}%
          </p>
        </div>
      )}

      {errMsg && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-medium shadow-sm">
          ⚠️ {errMsg}
        </div>
      )}

      {viewMode === "flip" && !loading && loadedPagesReady && (
        <div
          className={`w-full max-w-6xl mx-auto border rounded-[2rem] md:rounded-[2.5rem] p-3 sm:p-10 shadow-inner ${themeStyles[theme]} ${
            theme === "dark" ? "border-gray-800" : "border-gray-100"
          }`}
        >
          <div
            className="mx-auto max-w-full overflow-x-hidden"
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
              mobileScrollSupport={true}
              className="book-main shadow-2xl mx-auto"
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
              {visiblePages.map((src, idx) =>
                src ? (
                  <div
                    key={idx}
                    className="bg-white border-l border-gray-50 overflow-hidden relative"
                  >
                    <div className="w-full h-full p-2 flex items-center justify-center">
                      <img
                        src={src}
                        alt={`Pág ${idx + 1}`}
                        className="max-w-full max-h-full object-contain mx-auto"
                        draggable={false}
                        style={{ filter: pageFilterStyle }}
                      />
                    </div>
                  </div>
                ) : null
              )}
            </FlipBookComponent>
          </div>
        </div>
      )}

      {viewMode === "scroll" && !loading && loadedPagesReady && (
        <div className="flipbook-scroll w-full max-w-3xl mx-auto px-0 flex flex-col gap-0 pb-24 md:pb-32">
          <div
            className={`text-center py-2.5 text-[10px] font-bold uppercase tracking-widest sticky top-[4.5rem] sm:top-20 z-20 ${headerBg} backdrop-blur-sm border-b border-gray-100/10`}
          >
            Vista Continua • Pág. {currentPage}
            {totalPages > 0 ? ` / ${totalPages}` : ""}
            {backgroundRendering && (
              <span className="block mt-1 text-[9px] font-normal normal-case text-amber-600">
                Preparando páginas… {currentRender}/{totalPages}
              </span>
            )}
          </div>

          <div
            className="flipbook-scroll-pages w-full mx-auto origin-top transition-transform duration-200 ease-out"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top center",
            }}
          >
            {visiblePages.map((src, idx) => (
              <div
                key={idx}
                id={`page-${idx}`}
                className={`w-full relative shadow-sm mx-auto ${themeStyles[theme]} ${
                  idx > 0 ? "mt-2" : "mt-0"
                }`}
              >
                {src && (
                  <img
                    src={src}
                    alt={`Página ${idx + 1}`}
                    className="w-full h-auto block mx-auto"
                    loading={idx < 3 ? "eager" : "lazy"}
                    decoding="async"
                    draggable={false}
                    style={{ filter: pageFilterStyle }}
                  />
                )}
                <div className="py-1.5 text-center text-[9px] text-gray-400 opacity-60 pointer-events-none">
                  {idx + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx global>{`
        .book-main {
          background: transparent;
          margin-left: auto !important;
          margin-right: auto !important;
        }
        .flipbook-viewer {
          touch-action: auto;
        }
        .flipbook-scroll,
        .flipbook-scroll-pages {
          touch-action: auto;
        }
        .flipbook-scroll-pages img {
          -webkit-user-drag: none;
          user-select: none;
          -webkit-touch-callout: none;
        }
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
