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

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function FlipbookViewer({ fileUrl }: Props) {
  const bookRef = useRef<any>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [currentRender, setCurrentRender] = useState(0);
  const [errMsg, setErrMsg] = useState("");

  // Estado para guardar progreso
  const [currentPage, setCurrentPage] = useState(1);
  const [resumeMsg, setResumeMsg] = useState("");

  const [zoom, setZoom] = useState(1);
  const [theme, setTheme] = useState<Theme>("light");
  const [targetPage, setTargetPage] = useState("");

  const [viewMode, setViewMode] = useState<ViewMode>("flip");
  const [bookDimensions, setBookDimensions] = useState({ width: 380, height: 560 });
  const [isMobile, setIsMobile] = useState(false);

  const isZoomedFlip = zoom > 1.01;
  const renderScale = 2.0;
  const maxZoom = isMobile ? 1.5 : 3.0;

  // --- 1. LÓGICA DE GUARDADO DE PROGRESO (Resume Reading) ---
  const storageKey = `progress_${fileUrl}`;

  const saveProgress = useCallback((pageNum: number) => {
    if (pageNum > 0) {
      localStorage.setItem(storageKey, pageNum.toString());
      setCurrentPage(pageNum);
    }
  }, [storageKey]);

  // Recuperar progreso al cargar
  useEffect(() => {
    if (!loading && totalPages > 0) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const p = parseInt(saved, 10);
        if (p > 1 && p <= totalPages) {
          // Pequeño delay para asegurar que el componente renderizó
          setTimeout(() => {
            manualGoToPage(p);
            setResumeMsg(`📖 Retomando en pág. ${p}`);
            setTimeout(() => setResumeMsg(""), 3000);
          }, 500);
        }
      }
    }
  }, [loading, totalPages, storageKey]);

  // --- AUTO-DETECTAR MÓVIL: modo scroll por defecto ---
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => {
      const mobile = mq.matches;
      setIsMobile(mobile);
      if (mobile) {
        setViewMode("scroll");
        setZoom((z) => Math.min(z, 1.5));
      }
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // --- BLOQUEO DE SEGURIDAD REFORZADO ---
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      // Bloquear Ctrl+P (Imprimir), Ctrl+S (Guardar), Ctrl+C (Copiar)
      if ((e.ctrlKey || e.metaKey) && (k === "p" || k === "s" || k === "c")) {
        e.preventDefault();
        alert("Contenido protegido por derechos de autor - El Consejo del Obrero");
      }
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKeyDown, { capture: true } as any);
  }, []);

  // --- RENDERIZADO DE PDF ---
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

        // Calcular tamaño ideal
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

          // Marca de agua dinámica (PRO)
          ctx.save();
          const fontSize = Math.floor(canvas.width / 22);
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.fillStyle = "rgba(0, 0, 0, 0.04)"; // Muy sutil
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate(-Math.PI / 4);
          ctx.fillText("Consejero del Obrero - " + userMark, 0, 0);
          ctx.restore();

          imgs[i - 1] = canvas.toDataURL("image/jpeg", 0.80); // Un poco más comprimido para velocidad

          // Renderizado progresivo
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
      try { pdfDoc?.destroy?.(); } catch {}
    };
  }, [fileUrl]);

  // --- INTERSECTION OBSERVER (Detectar página en SCROLL) ---
  useEffect(() => {
    if (viewMode === "scroll" && !loading && pages.length > 0) {
      // Desconectar anterior si existe
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          // Buscamos cuál elemento es el más visible
          const visibleEntry = entries.find((entry) => entry.isIntersecting);
          if (visibleEntry) {
            // El ID es "page-0", "page-1"... sacamos el número
            const index = parseInt(visibleEntry.target.id.replace("page-", ""), 10);
            if (!isNaN(index)) {
              saveProgress(index + 1); // Guardamos (index + 1 porque visualmente es pág 1)
            }
          }
        },
        { threshold: 0.5 } // Se activa cuando el 50% de la página es visible
      );

      // Observar todas las páginas
      pages.forEach((_, idx) => {
        const el = document.getElementById(`page-${idx}`);
        if (el) observer.current?.observe(el);
      });
    }

    return () => observer.current?.disconnect();
  }, [viewMode, loading, pages, saveProgress]);


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

  // Función unificada para ir a página
  const manualGoToPage = (p: number) => {
    if (!Number.isFinite(p) || p < 1 || p > totalPages) return;

    if (viewMode === "flip") {
      // La librería usa índice 0
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

  // Callback para cambio de página en modo FLIP
  const onFlip = useCallback((e: any) => {
    // e.data es el índice de la nueva página (0, 1, 2...)
    saveProgress(e.data + 1);
  }, [saveProgress]);

  const FlipBookComponent: any = HTMLFlipBook;

  return (
    <div
      className={`w-full flex flex-col items-center gap-3 md:gap-4 py-2 md:py-4 select-none transition-colors duration-500 min-h-0 md:min-h-screen overflow-x-hidden ${
        theme === "dark" ? "bg-[#121212]" : "bg-gray-50"
      }`}
      onContextMenu={(e) => e.preventDefault()} // Bloqueo Clic Derecho
    >
      {/* --- NOTIFICACIÓN DE RESUME READING --- */}
      {resumeMsg && (
        <div className="fixed top-[4.5rem] md:top-20 left-1/2 -translate-x-1/2 z-[60] max-w-[90vw] bg-black/80 text-white px-4 sm:px-6 py-2 rounded-full text-xs font-bold animate-bounce shadow-xl backdrop-blur-md flex items-center gap-2">
          <span className="truncate">{resumeMsg}</span>
          <button type="button" onClick={() => setResumeMsg("")} className="ml-1 min-w-[32px] min-h-[32px] flex items-center justify-center text-gray-400 hover:text-white flex-shrink-0" aria-label="Cerrar aviso">✕</button>
        </div>
      )}

      {/* --- BARRA DE HERRAMIENTAS --- */}
      <div
        className={`sticky top-2 md:top-4 z-50 w-[calc(100%-1rem)] max-w-4xl mx-auto px-3 py-3 md:px-4 md:py-2 backdrop-blur-xl border rounded-2xl md:rounded-full shadow-2xl transition-colors duration-300 ${
          theme === "dark" ? "bg-gray-900/90 border-gray-700" : "bg-white/95 border-amber-100"
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3">
          {/* Fila 1: modo + temas */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === "flip" ? "scroll" : "flip")}
              className="min-h-[44px] flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-full text-[10px] sm:text-[10px] font-bold uppercase hover:shadow-lg transition-all active:scale-95"
            >
              {viewMode === "flip" ? "📱 Modo Ebook" : "📖 Modo Libro 3D"}
            </button>

            <div className="w-px h-6 bg-gray-300 hidden sm:block" />

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

          {/* Fila 2: zoom + ir a página */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap border-t border-gray-200/60 pt-3 sm:border-t-0 sm:pt-0">
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

            <form
              onSubmit={handleGoToSubmit}
              className={`flex items-center gap-2 pl-0 sm:pl-3 sm:border-l ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}
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

      {/* --- MODO LIBRO 3D (FLIP) --- */}
      {viewMode === "flip" && !loading && pages.length > 0 && (
        <div
          className={`w-full max-w-6xl border rounded-[2.5rem] p-4 sm:p-10 shadow-inner transition-colors ${themeStyles[theme]} ${
            theme === "dark" ? "border-gray-800 shadow-none" : "border-gray-100"
          }`}
        >
          <div
            className="mx-auto max-w-full overflow-x-hidden"
            style={{
              transform: isMobile ? "none" : `scale(${zoom})`,
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
              onFlip={onFlip} // <-- AQUÍ DETECTAMOS EL CAMBIO DE PÁGINA
              usePortrait={true}
              flippingTime={800}
              maxShadowOpacity={0.5}
              showPageCorners={true}
              clickEventForward={!isZoomedFlip}
              disableFlipByClick={isZoomedFlip}
              useMouseEvents={!isZoomedFlip}
              swipeDistance={isZoomedFlip ? 9999 : 30}
            >
              {pages.map((src, idx) => (
                <div key={idx} className="bg-white border-l border-gray-50 overflow-hidden relative group">
                  <div className="w-full h-full p-2 flex items-center justify-center relative">
                     {/* CAPA DE PROTECCIÓN TRANSPARENTE (Antirrobo) */}
                     <div className="absolute inset-0 z-10 w-full h-full" onContextMenu={(e) => e.preventDefault()} />
                    <img
                      src={src}
                      alt={`Pág ${idx + 1}`}
                      className="max-w-full max-h-full object-contain pointer-events-none select-none"
                      draggable={false}
                      style={{
                          filter: theme === 'dark' ? 'brightness(0.9) contrast(1.1)' : 'none'
                      }}
                    />
                  </div>
                  <div className="absolute bottom-3 w-full text-center text-[9px] text-gray-400 font-serif opacity-50">
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
        <div className="w-full max-w-3xl px-0 flex flex-col gap-0 pb-24 md:pb-32 overflow-x-hidden">
          <div className={`text-center py-2.5 md:py-3 text-[10px] font-bold uppercase tracking-widest sticky top-0 z-20 ${headerBg} backdrop-blur-md border-b border-gray-100/10 shadow-sm`}>
            Vista Continua • Pág. {currentPage}{totalPages > 0 ? ` / ${totalPages}` : ""}
          </div>

          <div
            className="w-full transition-transform duration-200 ease-out origin-top max-w-full overflow-x-hidden"
            style={{
              transform: isMobile ? "none" : `scale(${zoom})`,
              overscrollBehavior: "contain",
            }}
          >
            {pages.map((src, idx) => (
              <div
                key={idx}
                id={`page-${idx}`} // ID necesario para el IntersectionObserver
                className={`w-full relative shadow-sm ${themeStyles[theme]} mb-2 transition-colors duration-300`}
              >
                {/* CAPA DE PROTECCIÓN TRANSPARENTE (Antirrobo Móvil) */}
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
                        ? "invert(0.92) hue-rotate(180deg) contrast(0.9)" // Modo oscuro PRO real
                        : theme === "sepia"
                        ? "sepia(0.25) contrast(1.05)"
                        : "none",
                  }}
                />

                <div className="absolute bottom-2 right-2 bg-black/40 text-white px-2 py-0.5 rounded text-[9px] font-bold md:opacity-0 md:hover:opacity-100 transition-opacity">
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
        /* Bloqueo total de selección */
        * { -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; }
        /* Permitir seleccionar en inputs */
        input, textarea { -webkit-user-select: text; -moz-user-select: text; -ms-user-select: text; user-select: text; }
      `}</style>
    </div>
  );
}