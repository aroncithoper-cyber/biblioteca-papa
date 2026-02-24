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

  // Toolbar “Kindle-like”
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const hideTimer = useRef<any>(null);

  // “Render en background” (para PDFs grandes)
  const [backgroundRendering, setBackgroundRendering] = useState(false);

  // Modo inmersivo: ocultar header mientras lees (solo dentro del viewer)
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.add("reader-mode");
    return () => document.documentElement.classList.remove("reader-mode");
  }, []);

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

  // Toolbar auto-hide (Amazon style)
  const revealToolbar = useCallback(() => {
    setToolbarVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);

    // En móvil la dejamos un poco más tiempo visible
    const ms = isMobile ? 3800 : 2500;
    hideTimer.current = setTimeout(() => setToolbarVisible(false), ms);
  }, [isMobile]);

  useEffect(() => {
    // Por defecto, mostramos toolbar al entrar
    revealToolbar();

    const onMove = () => revealToolbar();
    const onKey = () => revealToolbar();
    const onTouch = () => revealToolbar();

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("keydown", onKey, { passive: true });
    window.addEventListener("touchstart", onTouch, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMove as any);
      window.removeEventListener("keydown", onKey as any);
      window.removeEventListener("touchstart", onTouch as any);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [revealToolbar]);

  const isZoomedFlip = zoom > 1.01;

  // Render scale adaptativo (mejor memoria en móvil)
  const renderScale = useMemo(() => {
    const base = isMobile ? 1.45 : 2.0;
    const zoomBoost = viewMode === "scroll" ? clamp(0.14 * (zoom - 1), 0, 0.32) : 0;
    const dpr = typeof window !== "undefined" ? clamp(window.devicePixelRatio || 1, 1, 2) : 1;
    return clamp(base + zoomBoost, 1.25, 2.15) * (dpr > 1.4 ? 1.05 : 1.0);
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

  // --- PROTECCIÓN (sobria) ---
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
        setBackgroundRendering(false);
        setPages([]);
        setTotalPages(0);
        setCurrentRender(0);

        const res = await fetch(fileUrl, { cache: "force-cache", signal: ac.signal });
        if (!res.ok) throw new Error("Error cargando documento");

        const data = await res.arrayBuffer();
        // @ts-ignore
        pdfDoc = await pdfjsLib.getDocument({ data }).promise;
        if (cancelled) return;

        const total = pdfDoc.numPages;
        setTotalPages(total);

        // Medidas libro basadas en la primera página (desktop)
        const firstPage = await pdfDoc.getPage(1);
        const vp1 = firstPage.getViewport({ scale: 1 });
        const ratio = vp1.width / vp1.height;

        const baseHeight = 560;
        const width = clamp(Math.floor(baseHeight * ratio), 320, 560);
        setBookDimensions({ width, height: baseHeight });

        const userMark = auth.currentUser?.email || "Copia de Lectura";
        const imgs: string[] = new Array(total);

        // “Umbral de usabilidad”: dejamos leer rápido en PDFs grandes
        const usableAfter = total >= 120 ? 10 : total >= 60 ? 6 : 3;

        for (let i = 1; i <= total; i++) {
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

          // Watermark sutil, centrado
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

          // Render progresivo para UX
          if (i === 1 || i % 3 === 0 || i === total) {
            const partial = imgs.slice(0, i).filter(Boolean);
            setPages(partial);
          }

          // ✅ Dejamos leer antes (sin esperar a render completo)
          if (i === usableAfter) {
            setLoading(false);
            if (i < total) setBackgroundRendering(true);
          }
        }

        if (cancelled) return;

        setPages(imgs.filter(Boolean));
        setLoading(false);
        setBackgroundRendering(false);
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
      light: "bg-white border-gray-200",
      sepia: "bg-[#f4ecd8] border-[#e6d5b8]",
      dark: "bg-[#0b0b0b] border-[#1f1f1f]",
    };
  }, []);

  // Fondo “reader device”
  const shell = useMemo(() => {
    if (theme === "dark") return "bg-[#0b0b0b] text-gray-200";
    if (theme === "sepia") return "bg-[#f2ead6] text-amber-950";
    return "bg-[#fcfaf7] text-gray-900";
  }, [theme]);

  // Ir a página (flip/scroll)
  const manualGoToPage = (p: number) => {
    if (!Number.isFinite(p) || p < 1 || p > totalPages) return;

    revealToolbar();

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
      revealToolbar();
    },
    [saveProgress, revealToolbar]
  );

  const FlipBookComponent: any = HTMLFlipBook;

  const canToggleMode = !isMobile; // manual solo desktop

  const decreaseZoom = () => {
    revealToolbar();
    setZoom((z) => clamp(+((z - 0.1).toFixed(2)), 0.7, 2.4));
  };
  const increaseZoom = () => {
    revealToolbar();
    setZoom((z) => clamp(+((z + 0.1).toFixed(2)), 0.7, 2.4));
  };

  return (
    <div
      className={`w-full ${shell} min-h-[75vh]`}
      onContextMenu={(e) => e.preventDefault()}
      onClick={() => {
        // Tap/click: Kindle behavior (mostrar/ocultar toolbar)
        setToolbarVisible((v) => !v);
        if (!toolbarVisible) revealToolbar();
      }}
    >
      {/* Resume toast sobrio */}
      {resumeMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[80] bg-black/80 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-xl backdrop-blur-md flex items-center gap-2">
          <span>📖 {resumeMsg}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setResumeMsg("");
            }}
            className="ml-1 text-white/70 hover:text-white"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      )}

      {/* HUD: renderizando en background (para PDFs grandes) */}
      {backgroundRendering && !loading && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[70] px-4 py-2 rounded-full text-[11px] font-semibold border shadow-lg backdrop-blur-md
          bg-white/70 text-gray-700 border-gray-200">
          Renderizando páginas… {renderPct}%
        </div>
      )}

      {/* Toolbar auto-hide (Kindle style) */}
      <div
        className={`fixed left-0 right-0 z-[75] transition-all duration-300 ${
          toolbarVisible ? "top-3 opacity-100" : "-top-20 opacity-0 pointer-events-none"
        }`}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto max-w-6xl px-3">
          <div
            className={`flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-3 py-2 rounded-full border shadow-sm backdrop-blur-xl ${
              theme === "dark"
                ? "bg-black/55 border-[#222]"
                : theme === "sepia"
                ? "bg-[#fff7e6]/70 border-[#e6d5b8]"
                : "bg-white/75 border-amber-100"
            }`}
          >
            {/* Toggle modo (solo desktop) */}
            {canToggleMode && (
              <button
                onClick={() => setViewMode(viewMode === "flip" ? "scroll" : "flip")}
                className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition ${
                  theme === "dark"
                    ? "bg-transparent border-[#2a2a2a] text-gray-200 hover:bg-white/10"
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
                theme === "dark" ? "border-[#2a2a2a]" : "border-gray-200"
              }`}
            >
              {(["light", "sepia", "dark"] as Theme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`w-7 h-7 rounded-full border transition ${
                    theme === t ? "ring-2 ring-amber-500" : "opacity-75 hover:opacity-100"
                  } ${
                    t === "light"
                      ? "bg-white border-gray-200"
                      : t === "sepia"
                      ? "bg-[#f4ecd8] border-[#e6d5b8]"
                      : "bg-[#202020] border-[#2a2a2a]"
                  }`}
                  aria-label={`Tema ${t}`}
                  title={`Tema ${t}`}
                />
              ))}
            </div>

            {/* Zoom */}
            <div
              className={`flex items-center rounded-full border px-2 ${
                theme === "dark" ? "border-[#2a2a2a]" : "border-gray-200"
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
                    ? "bg-black/35 text-white border-[#2a2a2a]"
                    : "bg-white text-gray-900 border-gray-200"
                }`}
                value={targetPage}
                onChange={(e) => setTargetPage(e.target.value)}
              />
              <button
                type="submit"
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition ${
                  theme === "dark"
                    ? "border-[#2a2a2a] text-gray-200 hover:bg-white/10"
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
              <div className={`w-24 h-2 rounded-full overflow-hidden border ${theme === "dark" ? "border-[#2a2a2a]" : "border-gray-200"}`}>
                <div className="h-full bg-amber-600" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="flex flex-col items-center justify-center py-14 rounded-3xl bg-white/70 border border-amber-100 shadow-sm">
            <div className="relative w-14 h-14 mb-4">
              <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-xs text-amber-700 font-bold uppercase tracking-widest">
              Preparando lectura… {renderPct}%
            </p>
            <p className="text-[11px] text-gray-400 mt-2">Toca la pantalla para mostrar controles.</p>
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 pt-20">
          {/* Fondo inmersivo tipo Kindle (vignette suave) */}
          <div className="relative rounded-[2.5rem] overflow-hidden">
            <div className="absolute inset-0 reader-vignette pointer-events-none" />

            <div
              className={`relative border rounded-[2.5rem] p-4 sm:p-10 shadow-[0_30px_80px_rgba(0,0,0,0.25)] ${themeStyles[theme]}`}
              style={{
                transform: "translateZ(0)",
              }}
            >
              <div
                className="mx-auto reader-enter"
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
                            filter: theme === "dark" ? "brightness(0.92) contrast(1.04)" : "none",
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
        </div>
      )}

      {/* --- MODO LECTURA CONTINUA (SCROLL) — Móvil --- */}
      {viewMode === "scroll" && !loading && pages.length > 0 && (
        <div className="max-w-3xl mx-auto px-3 sm:px-6 pb-24 pt-20">
          {/* “Device frame” sutil */}
          <div
            className={`rounded-[2rem] border shadow-[0_20px_60px_rgba(0,0,0,0.12)] overflow-hidden ${
              theme === "dark"
                ? "bg-[#0b0b0b] border-[#1f1f1f]"
                : theme === "sepia"
                ? "bg-[#f2ead6] border-[#e6d5b8]"
                : "bg-[#fcfaf7] border-gray-200"
            }`}
          >
            <div className="px-4 py-3 text-center text-[11px] font-semibold border-b"
              style={{ borderColor: theme === "sepia" ? "#e6d5b8" : theme === "dark" ? "#1f1f1f" : "#e5e7eb" }}
            >
              Vista continua • {progressPct}% leído
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
                  className="relative mx-auto my-4 w-[92%] sm:w-[86%]"
                >
                  {/* Capa protección */}
                  <div className="absolute inset-0 z-20 w-full h-full bg-transparent rounded-xl" />

                  {/* Página tipo Kindle: centrada, borde suave, sombra */}
                  <div
                    className={`rounded-xl overflow-hidden border shadow-sm ${themeStyles[theme]}`}
                    style={{
                      boxShadow:
                        theme === "dark"
                          ? "0 10px 30px rgba(0,0,0,0.45)"
                          : "0 10px 30px rgba(0,0,0,0.10)",
                    }}
                  >
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
                  </div>

                  {/* Numeración discreta */}
                  <div className="mt-2 text-center text-[11px] text-gray-400">
                    {idx + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Estilos globales SOLO para el lector */}
      <style jsx global>{`
        /* Oculta el header del sitio SOLO durante lectura */
        .reader-mode header {
          display: none !important;
        }

        /* Transición de entrada “premium” */
        .reader-enter {
          animation: readerEnter 280ms ease-out both;
        }
        @keyframes readerEnter {
          from { opacity: 0; transform: translateY(6px) scale(0.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Vignette suave (sensación de dispositivo) */
        .reader-vignette {
          background:
            radial-gradient(closest-side, rgba(0,0,0,0) 55%, rgba(0,0,0,0.18) 100%);
        }

        .book-main {
          background: transparent;
        }

        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        /* Bloqueo SOLO dentro del flipbook, NO global */
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