"use client";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

import {
  Worker,
  Viewer,
  SpecialZoomLevel,
  type Plugin,
} from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import type { DefaultLayoutPluginProps } from "@react-pdf-viewer/default-layout";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const PDFJS_WORKER_URL = "https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js";
const STORAGE_KEY_PREFIX = "ebook-page-";
const THEME_STORAGE_KEY = "ebook-theme";

type ThemeMode = "day" | "sepia" | "night";

const THEME_CONFIG = {
  day: {
    bg: "#fcfaf7",
    page: "#ffffff",
    barBg: "bg-white/70",
    barText: "text-gray-800",
    barBorder: "border-white/40",
  },
  sepia: {
    bg: "#f4ecd8",
    page: "#f4ecd8",
    barBg: "bg-amber-50/80",
    barText: "text-amber-900",
    barBorder: "border-amber-200/50",
  },
  night: {
    bg: "#1a1a1a",
    page: "#2d2d2d",
    barBg: "bg-gray-900/80",
    barText: "text-gray-100",
    barBorder: "border-gray-700/50",
  },
} as const;

type EbookViewerClientProps = {
  fileUrl: string;
  documentId: string;
};

export default function EbookViewerClient({
  fileUrl,
  documentId,
}: EbookViewerClientProps) {
  // CRÍTICO: SEGURO CONTRA ERROR #300 (Hydration Mismatch)
  const [isMounted, setIsMounted] = useState(false);
  const [savedPage, setSavedPage] = useState(0);
  const [theme, setTheme] = useState<ThemeMode>("sepia");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [barsVisible, setBarsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideBarsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const storageKey = `${STORAGE_KEY_PREFIX}${documentId ?? ""}`;

  const themeConfig = THEME_CONFIG[theme];
  const progress = totalPages > 0 ? ((currentPage + 1) / totalPages) * 100 : 0;

  const resetHideBarsTimeout = useCallback(() => {
    setBarsVisible(true);
    if (hideBarsTimeoutRef.current) {
      clearTimeout(hideBarsTimeoutRef.current);
    }
    hideBarsTimeoutRef.current = setTimeout(() => {
      setBarsVisible(false);
      hideBarsTimeoutRef.current = null;
    }, 3000);
  }, []);

  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-ebook-toolbar]")) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distX = Math.abs(e.clientX - centerX);
      const distY = Math.abs(e.clientY - centerY);
      if (distX < rect.width * 0.3 && distY < rect.height * 0.3) {
        setBarsVisible((v) => !v);
      } else {
        resetHideBarsTimeout();
      }
    },
    [resetHideBarsTimeout]
  );

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen();
        setIsFullscreen(false);
      } else {
        containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch {
      /* ignorar */
    }
  }, []);

  const changeTheme = useCallback((mode: ThemeMode) => {
    setTheme(mode);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      /* ignorar */
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw !== null) {
        const page = parseInt(raw, 10);
        if (Number.isFinite(page) && page >= 0) setSavedPage(page);
      }
      const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === "day" || savedTheme === "sepia" || savedTheme === "night") {
        setTheme(savedTheme);
      }
    } catch {
      /* ignorar */
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      if (hideBarsTimeoutRef.current) clearTimeout(hideBarsTimeoutRef.current);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [storageKey]);

  useEffect(() => {
    if (barsVisible) {
      resetHideBarsTimeout();
    }
    return () => {
      if (hideBarsTimeoutRef.current) clearTimeout(hideBarsTimeoutRef.current);
    };
  }, [barsVisible, resetHideBarsTimeout]);

  const defaultLayoutPluginInstance = useMemo(() => {
    const opts: DefaultLayoutPluginProps = {
      sidebarTabs: () => [],
      toolbarPlugin: {
        fullScreenPlugin: {
          onEnterFullScreen: (zoom) => zoom(SpecialZoomLevel.PageWidth),
          onExitFullScreen: (zoom) => zoom(SpecialZoomLevel.PageWidth),
        },
      },
      renderToolbar: () => <div className="hidden" />,
    };
    return defaultLayoutPlugin(opts);
  }, []);

  const plugins: Plugin[] = useMemo(() => [defaultLayoutPluginInstance], [defaultLayoutPluginInstance]);

  const onDocumentLoad = useCallback((e: { doc: { numPages: number } }) => {
    setTotalPages(e.doc.numPages);
  }, []);

  const onPageChange = useCallback(
    (e: { currentPage: number }) => {
      setCurrentPage(e.currentPage);
      try {
        window.localStorage.setItem(storageKey, String(e.currentPage));
      } catch {
        /* ignorar */
      }
    },
    [storageKey]
  );

  if (!isMounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-[#fcfaf7]">
        <div className="w-12 h-12 border-2 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (typeof fileUrl !== "string" || !fileUrl.trim()) {
    return <p className="p-10 text-center italic">Esperando archivo digital...</p>;
  }

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className="ebook-viewer-wrap relative h-full min-h-[80vh] rounded-2xl overflow-hidden border border-amber-100/80"
      style={{
        background: themeConfig.bg,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 6px 16px rgba(180,83,9,0.06)",
      }}
    >
      {/* Barra superior flotante (Glassmorphism) */}
      <div
        data-ebook-toolbar
        className={`absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 backdrop-blur-xl border-b ${themeConfig.barBg} ${themeConfig.barBorder} transition-all duration-300 ${
          barsVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
        }`}
      >
        <span className={`text-xs font-bold uppercase tracking-wider ${themeConfig.barText}`}>
          Página {currentPage + 1} de {totalPages || "—"}
        </span>
        <div className="flex items-center gap-1">
          <div
            className={`h-2 flex-1 min-w-[80px] rounded-full overflow-hidden ${
              theme === "night" ? "bg-gray-700" : "bg-gray-200"
            }`}
          >
            <div
              className="h-full bg-amber-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Área de scroll del PDF */}
      <div
        ref={scrollRef}
        className="rpv-ebook-scroll h-full overflow-auto pt-14 pb-16"
        style={{ background: themeConfig.bg }}
      >
        <Worker workerUrl={PDFJS_WORKER_URL}>
          <div
            className="rpv-core__viewer rpv-core__viewer--ebook"
            style={{
              ["--rpv-core__inner-page-background-color" as string]: themeConfig.page,
              ["--rpv-core__doc-loading-background-color" as string]: themeConfig.bg,
              ["--rpv-core__page-layer-box-shadow" as string]:
                theme === "night"
                  ? "0 2px 8px rgba(0,0,0,0.3)"
                  : "0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <Viewer
              fileUrl={fileUrl}
              plugins={plugins}
              initialPage={savedPage}
              defaultScale={SpecialZoomLevel.PageWidth}
              onDocumentLoad={onDocumentLoad}
              onPageChange={onPageChange}
              theme={theme === "night" ? "dark" : "light"}
              renderLoader={(percentages) => (
                <div
                  className="flex flex-col items-center justify-center min-h-[400px]"
                  style={{ background: themeConfig.bg }}
                >
                  <div className="w-12 h-12 border-2 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
                  <p
                    className={`mt-4 text-sm font-medium ${
                      theme === "night" ? "text-amber-200" : "text-amber-800/70"
                    }`}
                  >
                    Abriendo páginas... {percentages}%
                  </p>
                </div>
              )}
            />
          </div>
        </Worker>
      </div>

      {/* Barra inferior flotante (Glassmorphism) */}
      <div
        data-ebook-toolbar
        className={`absolute bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 px-4 py-3 backdrop-blur-xl border-t ${themeConfig.barBg} ${themeConfig.barBorder} transition-all duration-300 ${
          barsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full pointer-events-none"
        }`}
      >
        {/* Toggle temas */}
        <div className={`flex rounded-full p-1 ${
          theme === "night" ? "bg-gray-800" : "bg-gray-100"
        }`}>
          <button
            onClick={() => changeTheme("day")}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
              theme === "day"
                ? "bg-white text-amber-800 shadow-sm"
                : theme === "night"
                ? "text-gray-400 hover:text-gray-200"
                : "text-gray-500 hover:text-gray-800"
            }`}
            title="Modo Día"
          >
            ☀️ Día
          </button>
          <button
            onClick={() => changeTheme("sepia")}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
              theme === "sepia"
                ? "bg-amber-100 text-amber-900 shadow-sm"
                : theme === "night"
                ? "text-gray-400 hover:text-gray-200"
                : "text-gray-500 hover:text-amber-800"
            }`}
            title="Modo Sepia"
          >
            📜 Sepia
          </button>
          <button
            onClick={() => changeTheme("night")}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
              theme === "night"
                ? "bg-gray-700 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
            title="Modo Noche"
          >
            🌙 Noche
          </button>
        </div>

        {/* Barra de progreso */}
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <div
            className={`h-2 flex-1 max-w-[120px] rounded-full overflow-hidden ${
              theme === "night" ? "bg-gray-700" : "bg-gray-200"
            }`}
          >
            <div
              className="h-full bg-amber-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className={`text-[10px] font-bold tabular-nums ${themeConfig.barText}`}>
            {currentPage + 1} / {totalPages || "—"}
          </span>
        </div>

        {/* Pantalla completa */}
        <button
          onClick={toggleFullscreen}
          className={`p-2.5 rounded-full transition-all ${
            theme === "night"
              ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
              : "bg-white/80 text-gray-700 hover:bg-amber-100 hover:text-amber-800 shadow-sm"
          }`}
          title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-5 h-5"
          >
            {isFullscreen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            )}
          </svg>
        </button>
      </div>

      <style jsx global>{`
        .rpv-core__viewer--ebook .rpv-default-layout__container {
          border: none !important;
        }
        .rpv-core__viewer--ebook .rpv-default-layout__body {
          background-color: transparent !important;
          border: none !important;
        }
        .rpv-core__viewer--ebook .rpv-default-layout__toolbar {
          display: none !important;
        }
        .rpv-core__viewer--ebook .rpv-default-layout__sidebar {
          display: none !important;
        }
        .rpv-core__viewer--ebook .rpv-core__inner-page {
          background-color: inherit !important;
        }
        .rpv-ebook-scroll {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
}
