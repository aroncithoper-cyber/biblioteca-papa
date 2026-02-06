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
import { useEffect, useMemo, useRef, useState } from "react";

/** Worker externo para evitar fallos de WorkerMessageHandler */
const PDFJS_WORKER_URL = "https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js";

const STORAGE_KEY_PREFIX = "ebook-page-";

type EbookViewerProps = {
  /** URL del PDF (desde Firestore, ej. URL de Firebase Storage) */
  fileUrl: string;
  /** ID del documento para memoria de lectura en localStorage */
  documentId: string;
};

export default function EbookViewer({
  fileUrl,
  documentId,
}: EbookViewerProps) {
  const [isClient, setIsClient] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [savedPage, setSavedPage] = useState<number>(0);
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const lastScrollY = useRef(0);
  const isMobile = useRef(false);

  const storageKey = `${STORAGE_KEY_PREFIX}${documentId}`;

  // Marcar que ya estamos en el cliente (browser) antes de mostrar el Worker
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Recuperar última página desde localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw !== null) {
        const page = parseInt(raw, 10);
        if (Number.isFinite(page) && page >= 0) setSavedPage(page);
      }
    } catch {
      // ignorar si localStorage no está disponible
    }
  }, [storageKey]);

  // Detección móvil y ocultar barra al hacer scroll hacia abajo
  useEffect(() => {
    const checkMobile = () => {
      isMobile.current = window.matchMedia("(max-width: 767px)").matches;
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (!isMobile.current) return;
          const current = scrollEl.scrollTop;
          if (current > lastScrollY.current && current > 80) {
            setToolbarVisible(false);
          } else {
            setToolbarVisible(true);
          }
          lastScrollY.current = current;
          ticking = false;
        });
        ticking = true;
      }
    };

    scrollEl.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", checkMobile);
      scrollEl.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const defaultLayoutPluginInstance = useMemo(() => {
    const opts: DefaultLayoutPluginProps = {
      sidebarTabs: (defaultTabs) => defaultTabs,
      toolbarPlugin: {
        fullScreenPlugin: {
          onEnterFullScreen: (zoom) => zoom(SpecialZoomLevel.PageWidth),
          onExitFullScreen: (zoom) => zoom(SpecialZoomLevel.PageWidth),
        },
      },
    };
    return defaultLayoutPlugin(opts);
  }, []);

  const onPageChange = (e: { currentPage: number }) => {
    try {
      localStorage.setItem(storageKey, String(e.currentPage));
    } catch {
      // ignorar
    }
  };

  const plugins: Plugin[] = useMemo(
    () => [defaultLayoutPluginInstance],
    [defaultLayoutPluginInstance]
  );

  if (!fileUrl) return <p>Cargando libro...</p>;
  if (!isClient) return <p>Cargando libro...</p>;

  return (
    <div
      ref={containerRef}
      className={`ebook-viewer-wrap h-full min-h-[80vh] rounded-2xl overflow-hidden border border-amber-100/80 bg-[#fcfaf7] ${
        !toolbarVisible ? "ebook-toolbar-hidden" : ""
      }`}
      style={{
        boxShadow:
          "0 1px 3px rgba(0,0,0,0.04), 0 6px 16px rgba(180,83,9,0.06)",
      }}
    >
      <div
        ref={scrollRef}
        className="rpv-ebook-scroll h-full overflow-auto"
        style={{ background: "#fcfaf7" }}
      >
        <Worker workerUrl={PDFJS_WORKER_URL}>
          <div
            className="rpv-core__viewer rpv-core__viewer--ebook"
            data-testid="ebook-viewer"
            style={{
              ["--rpv-core__inner-page-background-color" as string]: "#fff",
              ["--rpv-core__doc-loading-background-color" as string]: "#fcfaf7",
              ["--rpv-core__page-layer-box-shadow" as string]:
                "0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <Viewer
              fileUrl={fileUrl}
              plugins={plugins}
              initialPage={savedPage}
              defaultScale={SpecialZoomLevel.PageWidth}
              onPageChange={onPageChange}
              theme="ebook-cream"
              renderLoader={(percentages) => (
                <div className="flex flex-col items-center justify-center min-h-[400px] bg-[#fcfaf7]">
                  <div className="w-12 h-12 border-2 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
                  <p className="mt-4 text-sm text-amber-800/70 font-medium">
                    Cargando… {percentages}%
                  </p>
                </div>
              )}
              renderError={(error) => (
                <div className="flex flex-col items-center justify-center min-h-[300px] bg-[#fcfaf7] p-6 text-center">
                  <p className="text-red-600 font-medium">
                    No se pudo cargar el documento.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {error?.message || "Verifica tu conexión e intenta de nuevo."}
                  </p>
                </div>
              )}
            />
          </div>
        </Worker>
      </div>

      <style jsx global>{`
        .rpv-core__viewer--ebook .rpv-default-layout__body {
          background-color: #fcfaf7 !important;
        }
        .rpv-core__viewer--ebook .rpv-default-layout__toolbar {
          background-color: #f5f0e8 !important;
          border-bottom: 1px solid rgba(180, 83, 9, 0.12) !important;
          transition: transform 0.3s ease-out;
        }
        .rpv-core__viewer--ebook .rpv-core__inner-page {
          background-color: #fff !important;
        }
        .rpv-core__viewer--ebook .rpv-core__page-layer::after {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08),
            0 1px 2px rgba(0, 0, 0, 0.04) !important;
        }
        .rpv-ebook-scroll {
          scroll-behavior: smooth;
        }
        @media (max-width: 767px) {
          .ebook-viewer-wrap.ebook-toolbar-hidden .rpv-default-layout__toolbar {
            transform: translateY(-100%);
            pointer-events: none;
          }
        }
      `}</style>
    </div>
  );
}
