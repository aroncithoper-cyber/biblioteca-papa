"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
// @ts-ignore
import HTMLFlipBook from "react-pageflip";
import * as pdfjsLib from "pdfjs-dist";
import { auth } from "@/lib/firebase";
import { useLanguage } from "@/lib/language";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

type Props = { fileUrl: string };
type Theme = "light" | "sepia" | "dark";
type ViewMode = "flip" | "scroll";

const MOBILE_BOOTSTRAP_PAGES = 8;
const DESKTOP_BOOTSTRAP_PAGES = 12;
const MOBILE_BATCH_SIZE = 2;
const DESKTOP_BATCH_SIZE = 4;
const MOBILE_BATCH_DELAY_MS = 120;
const DESKTOP_BATCH_DELAY_MS = 80;
const FLIP_MIN_PAGES = 2;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches;
}

function getBootstrapTarget(numPages: number): number {
  const target = isMobileViewport() ? MOBILE_BOOTSTRAP_PAGES : DESKTOP_BOOTSTRAP_PAGES;
  return Math.min(target, numPages);
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

function yieldToIdle(mobile: boolean): Promise<void> {
  return new Promise((resolve) => {
    const timeout = mobile ? MOBILE_BATCH_DELAY_MS : DESKTOP_BATCH_DELAY_MS;
    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(() => resolve(), { timeout: timeout + 40 });
    } else {
      setTimeout(resolve, timeout);
    }
  });
}

function getVisiblePageCount(pages: (string | null)[]): number {
  if (pages.length === 0) return 0;
  const firstGap = pages.findIndex((p) => !p);
  if (firstGap === -1) return pages.length;
  return firstGap;
}

function countRenderedPages(pages: (string | null)[]): number {
  return pages.filter(Boolean).length;
}

export default function FlipbookViewer({ fileUrl }: Props) {
  const { t } = useLanguage();
  const bookRef = useRef<any>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const pdfDocRef = useRef<any>(null);
  const pagesRef = useRef<(string | null)[]>([]);
  const blobUrlsRef = useRef<string[]>([]);
  const pauseRenderUntilRef = useRef(0);
  const renderLoopRef = useRef<{ cancelled: boolean }>({ cancelled: false });
  const priorityPageRef = useRef<number | null>(null);
  const priorityWaitRef = useRef<{ page: number; resolve: () => void } | null>(null);
  const renderPageFnRef = useRef<
    ((pageNum: number) => Promise<string>) | null
  >(null);

  const [pages, setPages] = useState<(string | null)[]>([]);
  const [readyToRead, setReadyToRead] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [bootstrapReady, setBootstrapReady] = useState(0);
  const [bootstrapTarget, setBootstrapTarget] = useState(0);
  const [renderedCount, setRenderedCount] = useState(0);
  const [backgroundRendering, setBackgroundRendering] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [resumeMsg, setResumeMsg] = useState("");
  const [pagePrepMsg, setPagePrepMsg] = useState("");

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

  const flushPages = useCallback((imgs: (string | null)[]) => {
    pagesRef.current = imgs;
    setPages([...imgs]);
    setRenderedCount(countRenderedPages(imgs));
  }, []);

  const resolvePriorityWait = useCallback((pageNum: number) => {
    if (priorityWaitRef.current?.page === pageNum) {
      priorityWaitRef.current.resolve();
      priorityWaitRef.current = null;
    }
    if (priorityPageRef.current === pageNum) {
      priorityPageRef.current = null;
    }
  }, []);

  const ensurePageRendered = useCallback(async (pageNum: number) => {
    if (pagesRef.current[pageNum - 1]) return;

    setPagePrepMsg(t.pdf.preparingPage);
    priorityPageRef.current = pageNum;

    await new Promise<void>((resolve) => {
      priorityWaitRef.current = { page: pageNum, resolve };
    });

    setPagePrepMsg("");
  }, [t.pdf.preparingPage]);

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
    if (readyToRead && totalPages > 0) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const p = parseInt(saved, 10);
        if (p > 1 && p <= totalPages) {
          setTimeout(async () => {
            if (!pagesRef.current[p - 1]) {
              await ensurePageRendered(p);
            }
            manualGoToPage(p);
            setResumeMsg(`${t.pdf.resumePage} ${p}`);
            setTimeout(() => setResumeMsg(""), 3000);
          }, 400);
        }
      }
    }
  }, [
    readyToRead,
    totalPages,
    storageKey,
    manualGoToPage,
    ensurePageRendered,
    t.pdf.resumePage,
  ]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (k === "p" || k === "s" || k === "c")) {
        e.preventDefault();
        alert(t.pdf.protectedContent);
      }
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKeyDown, { capture: true } as any);
  }, [t.pdf.protectedContent]);

  const revokeBlobUrls = useCallback(() => {
    blobUrlsRef.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    });
    blobUrlsRef.current = [];
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

    async function renderRemainingPages(
      pdfDoc: any,
      imgs: (string | null)[],
      numPages: number,
      renderScale: number,
      userMark: string,
      mobile: boolean,
      batchSize: number,
      startAfter: number
    ) {
      const renderPage = async (pageNum: number) => {
        if (loop.cancelled || imgs[pageNum - 1]) return;
        if (!(await waitIfPaused())) return;
        imgs[pageNum - 1] = await renderSinglePage(
          pdfDoc,
          pageNum,
          renderScale,
          userMark
        );
        flushPages(imgs);
        resolvePriorityWait(pageNum);
      };

      let cursor = startAfter + 1;

      while (cursor <= numPages && !loop.cancelled) {
        if (priorityPageRef.current) {
          const pp = priorityPageRef.current;
          if (!imgs[pp - 1]) {
            await renderPage(pp);
          } else {
            resolvePriorityWait(pp);
          }
          await yieldToIdle(mobile);
          continue;
        }

        if (!(await waitIfPaused())) return;

        while (cursor <= numPages && imgs[cursor - 1]) cursor++;
        if (cursor > numPages) break;

        const batchEnd = Math.min(cursor + batchSize - 1, numPages);
        for (let p = cursor; p <= batchEnd; p++) {
          if (loop.cancelled) return;
          if (priorityPageRef.current) break;
          if (!(await waitIfPaused())) return;
          if (!imgs[p - 1]) {
            await renderPage(p);
          }
        }

        cursor = batchEnd + 1;
        await yieldToIdle(mobile);
      }

      if (!loop.cancelled) {
        setBackgroundRendering(false);
      }
    }

    async function renderPdf() {
      try {
        revokeBlobUrls();
        setErrMsg("");
        setReadyToRead(false);
        setBackgroundRendering(false);
        setPages([]);
        pagesRef.current = [];
        setTotalPages(0);
        setBootstrapReady(0);
        setBootstrapTarget(0);
        setRenderedCount(0);
        priorityPageRef.current = null;
        priorityWaitRef.current = null;

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
          if (!res.ok) throw new Error(t.pdf.loadError);
          const data = await res.arrayBuffer();
          pdfDoc = await pdfjsLib.getDocument({ data }).promise;
        }

        pdfDocRef.current = pdfDoc;
        if (loop.cancelled) return;

        const numPages = pdfDoc.numPages;
        const bootTarget = getBootstrapTarget(numPages);
        setTotalPages(numPages);
        setBootstrapTarget(bootTarget);

        const firstPage = await pdfDoc.getPage(1);
        const vp1 = firstPage.getViewport({ scale: 1 });
        const ratio = vp1.width / vp1.height;
        const baseHeight = 560;
        const width = clamp(Math.floor(baseHeight * ratio), 320, 560);
        setBookDimensions({ width, height: baseHeight });

        const userMark = auth.currentUser?.email || "Copia Protegida";
        const imgs: (string | null)[] = new Array(numPages).fill(null);

        const boundRender = (pageNum: number) =>
          renderSinglePage(pdfDoc, pageNum, renderScale, userMark);
        renderPageFnRef.current = boundRender;

        for (let i = 1; i <= bootTarget; i++) {
          if (loop.cancelled) return;
          if (!(await waitIfPaused())) return;

          setBootstrapReady(i - 1);
          imgs[i - 1] = await boundRender(i);
          setBootstrapReady(i);
          if (mobile) await yieldToIdle(mobile);
        }

        if (loop.cancelled) return;

        flushPages(imgs);
        setReadyToRead(true);

        if (bootTarget < numPages) {
          setBackgroundRendering(true);
          void renderRemainingPages(
            pdfDoc,
            imgs,
            numPages,
            renderScale,
            userMark,
            mobile,
            mobile ? MOBILE_BATCH_SIZE : DESKTOP_BATCH_SIZE,
            bootTarget
          );
        }
      } catch {
        if (loop.cancelled) return;
        setErrMsg(t.pdf.loadErrorDetail);
        setReadyToRead(false);
        setBackgroundRendering(false);
      }
    }

    renderPdf();

    return () => {
      loop.cancelled = true;
      renderPageFnRef.current = null;
      priorityWaitRef.current?.resolve();
      priorityWaitRef.current = null;
      try {
        pdfDocRef.current?.destroy?.();
      } catch {}
      pdfDocRef.current = null;
      revokeBlobUrls();
    };
  }, [
    fileUrl,
    revokeBlobUrls,
    waitIfPaused,
    flushPages,
    resolvePriorityWait,
    t.pdf.loadError,
    t.pdf.loadErrorDetail,
  ]);

  const visiblePageCount = getVisiblePageCount(pages);
  const visiblePages = pages.slice(0, visiblePageCount);

  const flipPagesReady =
    visiblePageCount >= Math.min(FLIP_MIN_PAGES, totalPages || FLIP_MIN_PAGES);

  useEffect(() => {
    if (viewMode === "scroll" && readyToRead && visiblePageCount > 0) {
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
  }, [viewMode, readyToRead, visiblePageCount, visiblePages, saveProgress]);

  const bootstrapProgress =
    bootstrapTarget > 0
      ? Math.round((bootstrapReady / bootstrapTarget) * 100)
      : 0;

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

  const handleGoToSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(targetPage, 10);
    if (!Number.isFinite(p) || p < 1 || p > totalPages) return;

    if (!pagesRef.current[p - 1]) {
      pauseBackgroundRender(3000);
      await ensurePageRendered(p);
    }

    manualGoToPage(p);
    setTargetPage("");
  };

  const onFlip = useCallback(
    (e: any) => {
      saveProgress(e.data + 1);
    },
    [saveProgress]
  );

  const FlipBookComponent: any = HTMLFlipBook;
  const showReader = readyToRead && visiblePageCount > 0;

  return (
    <div
      className={`flipbook-viewer w-full flex flex-col items-center gap-3 md:gap-4 py-2 md:py-4 transition-colors duration-500 min-h-0 overflow-x-hidden ${
        theme === "dark" ? "bg-[#121212]" : "bg-gray-50"
      }`}
      onContextMenu={(e) => e.preventDefault()}
    >
      {(resumeMsg || pagePrepMsg) && (
        <div className="fixed top-20 left-1/2 z-[60] max-w-[90vw] -translate-x-1/2 rounded-full bg-black/80 px-4 py-2 text-xs font-bold text-white shadow-xl backdrop-blur-md sm:px-6 pointer-events-none">
          <span className="truncate">{pagePrepMsg || resumeMsg}</span>
        </div>
      )}

      {backgroundRendering && readyToRead && (
        <div
          className="fixed bottom-4 left-1/2 z-[55] max-w-[92vw] -translate-x-1/2 rounded-full border border-amber-200/80 bg-white/95 px-4 py-2 text-[10px] font-medium text-amber-800 shadow-lg backdrop-blur-md pointer-events-none sm:bottom-6"
          role="status"
          aria-live="polite"
        >
          {t.pdf.preparingRemaining} {renderedCount}/{totalPages}
        </div>
      )}

      {!readyToRead && !errMsg && (
        <div className="flex w-full max-w-md flex-col items-center justify-center px-6 py-16 md:py-24">
          <div className="w-full rounded-[2rem] border border-amber-100 bg-[#fcfaf7] p-8 shadow-inner sm:p-10">
            <p className="text-center font-serif text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
              {t.pdf.preparingReading}
            </p>
            <p className="mt-3 text-center text-xs leading-relaxed text-gray-500 sm:text-sm">
              {t.pdf.preparingReadingHint}
            </p>

            <div className="mt-8">
              <div className="h-2 overflow-hidden rounded-full bg-amber-100/80">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-700 transition-all duration-300 ease-out"
                  style={{ width: `${bootstrapTarget ? bootstrapProgress : 8}%` }}
                />
              </div>
              <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">
                {t.pdf.pagesReady}: {bootstrapReady}
                {bootstrapTarget > 0 ? ` / ${bootstrapTarget}` : ""}
              </p>
            </div>
          </div>
        </div>
      )}

      {readyToRead && (
        <div
          className={`flipbook-toolbar sticky top-2 z-40 mx-auto w-[calc(100%-0.5rem)] max-w-4xl rounded-full border px-3 py-3 shadow-lg backdrop-blur-xl transition-colors duration-300 sm:top-4 sm:w-[calc(100%-1rem)] md:px-4 md:py-2 ${
            theme === "dark" ? "border-gray-700 bg-gray-900/90" : "border-amber-100 bg-white/95"
          }`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setViewMode(viewMode === "flip" ? "scroll" : "flip")}
                className="flex min-h-[44px] items-center gap-2 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 px-4 py-2.5 text-[10px] font-bold uppercase text-white transition-all hover:shadow-lg active:scale-95"
              >
                {viewMode === "flip" ? `📱 ${t.pdf.ebookMode}` : `📖 ${t.pdf.flipMode}`}
              </button>
              <div
                className={`flex gap-1.5 rounded-full p-1.5 ${
                  theme === "dark" ? "bg-gray-800" : "bg-gray-100"
                }`}
              >
                {(["light", "sepia", "dark"] as Theme[]).map((themeKey) => (
                  <button
                    key={themeKey}
                    type="button"
                    onClick={() => setTheme(themeKey)}
                    aria-label={
                      themeKey === "light"
                        ? t.pdf.themeLight
                        : themeKey === "sepia"
                        ? t.pdf.themeSepia
                        : t.pdf.themeDark
                    }
                    className={`min-h-[44px] min-w-[44px] rounded-full border md:min-h-7 md:min-w-7 md:h-7 md:w-7 ${
                      theme === themeKey ? "ring-2 ring-amber-500" : "opacity-60"
                    } ${themeKey === "light" ? "bg-white" : themeKey === "sepia" ? "bg-[#f4ecd8]" : "bg-[#2c2c2c]"}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 border-t border-gray-200/60 pt-3 sm:gap-3 sm:border-t-0 sm:pt-0">
              <div
                className={`flex items-center rounded-full border ${
                  theme === "dark"
                    ? "border-gray-700 bg-black text-white"
                    : "border-gray-200 bg-white text-black"
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setZoom((z) => clamp(+((z - 0.1).toFixed(2)), 0.5, maxZoom))
                  }
                  className="min-h-[44px] px-3 font-bold"
                >
                  –
                </button>
                <span className="w-12 text-center text-[10px] font-black">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setZoom((z) => clamp(+((z + 0.1).toFixed(2)), 0.5, maxZoom))
                  }
                  className="min-h-[44px] px-3 font-bold"
                >
                  +
                </button>
              </div>
              <form
                onSubmit={handleGoToSubmit}
                className="flex items-center gap-2 sm:border-l sm:border-gray-200 sm:pl-3"
              >
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder={currentPage.toString()}
                  className="min-h-[44px] w-14 rounded-lg border px-2 text-center text-xs outline-none md:min-h-0 md:w-12"
                  value={targetPage}
                  onChange={(e) => setTargetPage(e.target.value)}
                />
                <button
                  type="submit"
                  className="min-h-[44px] px-4 text-xs font-bold uppercase text-amber-600"
                >
                  {t.pdf.go}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {errMsg && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600 shadow-sm">
          ⚠️ {errMsg}
        </div>
      )}

      {viewMode === "flip" && showReader && flipPagesReady && (
        <div
          className={`mx-auto w-full max-w-6xl rounded-[2rem] border p-3 shadow-inner sm:p-10 md:rounded-[2.5rem] ${themeStyles[theme]} ${
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
              className="book-main mx-auto shadow-2xl"
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
                    className="relative overflow-hidden border-l border-gray-50 bg-white"
                  >
                    <div className="flex h-full w-full items-center justify-center p-2">
                      <img
                        src={src}
                        alt={`Pág ${idx + 1}`}
                        className="mx-auto max-h-full max-w-full object-contain"
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

      {viewMode === "scroll" && showReader && (
        <div className="flipbook-scroll mx-auto flex w-full max-w-3xl flex-col gap-0 px-0 pb-24 md:pb-32">
          <div
            className={`sticky top-[4.5rem] z-20 border-b border-gray-100/10 py-2.5 text-center text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm sm:top-20 ${headerBg}`}
          >
            {t.pdf.continuousView} • {t.pdf.page} {currentPage}
            {totalPages > 0 ? ` / ${totalPages}` : ""}
          </div>

          <div
            className="flipbook-scroll-pages mx-auto w-full origin-top transition-transform duration-200 ease-out"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top center",
            }}
          >
            {visiblePages.map((src, idx) => (
              <div
                key={idx}
                id={`page-${idx}`}
                className={`relative mx-auto w-full shadow-sm ${themeStyles[theme]} ${
                  idx > 0 ? "mt-2" : "mt-0"
                }`}
              >
                {src && (
                  <img
                    src={src}
                    alt={`Página ${idx + 1}`}
                    className="mx-auto block h-auto w-full"
                    loading={idx < 4 ? "eager" : "lazy"}
                    decoding="async"
                    draggable={false}
                    style={{ filter: pageFilterStyle }}
                  />
                )}
                <div className="pointer-events-none py-1.5 text-center text-[9px] text-gray-400 opacity-60">
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
