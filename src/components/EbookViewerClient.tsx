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

const PDFJS_WORKER_URL = "https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js";
const STORAGE_KEY_PREFIX = "ebook-page-";

type EbookViewerClientProps = {
  fileUrl: string;
  documentId: string;
};

export default function EbookViewerClient({
  fileUrl,
  documentId,
}: EbookViewerClientProps) {
  // SEGURO CONTRA ERROR #300 (Hydration Mismatch)
  const [isMounted, setIsMounted] = useState(false);
  const [savedPage, setSavedPage] = useState(0);
  const [toolbarVisible, setToolbarVisible] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const isMobile = useRef(false);

  const storageKey = `${STORAGE_KEY_PREFIX}${documentId ?? ""}`;

  // Solo se activa cuando el componente llega al navegador
  useEffect(() => {
    setIsMounted(true);
    
    // Cargar página guardada
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw !== null) {
        const page = parseInt(raw, 10);
        if (Number.isFinite(page) && page >= 0) setSavedPage(page);
      }
    } catch (e) { /* ignorar */ }

    // Lógica de Scroll y Mobile
    const checkMobile = () => {
      isMobile.current = window.matchMedia("(max-width: 767px)").matches;
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, [storageKey]);

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

  const plugins: Plugin[] = useMemo(() => [defaultLayoutPluginInstance], [defaultLayoutPluginInstance]);

  const onPageChange = (e: { currentPage: number }) => {
    try {
      window.localStorage.setItem(storageKey, String(e.currentPage));
    } catch (e) { /* ignorar */ }
  };

  // Si no está montado en el cliente, no renderizamos nada (Adiós Error #300)
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
      className={`ebook-viewer-wrap h-full min-h-[80vh] rounded-2xl overflow-hidden border border-amber-100/80 bg-[#fcfaf7] ${
        !toolbarVisible ? "ebook-toolbar-hidden" : ""
      }`}
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 6px 16px rgba(180,83,9,0.06)" }}
    >
      <div
        ref={scrollRef}
        className="rpv-ebook-scroll h-full overflow-auto"
        style={{ background: "#fcfaf7" }}
      >
        <Worker workerUrl={PDFJS_WORKER_URL}>
          <div
            className="rpv-core__viewer rpv-core__viewer--ebook"
            style={{
              ["--rpv-core__inner-page-background-color" as any]: "#fff",
              ["--rpv-core__doc-loading-background-color" as any]: "#fcfaf7",
              ["--rpv-core__page-layer-box-shadow" as any]: "0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <Viewer
              fileUrl={fileUrl}
              plugins={plugins}
              initialPage={savedPage}
              defaultScale={SpecialZoomLevel.PageWidth}
              onPageChange={onPageChange}
              theme="light"
              renderLoader={(percentages) => (
                <div className="flex flex-col items-center justify-center min-h-[400px] bg-[#fcfaf7]">
                  <div className="w-12 h-12 border-2 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
                  <p className="mt-4 text-sm text-amber-800/70 font-medium">Abriendo páginas... {percentages}%</p>
                </div>
              )}
            />
          </div>
        </Worker>
      </div>

      <style jsx global>{`
        .rpv-core__viewer--ebook .rpv-default-layout__body { background-color: #fcfaf7 !important; }
        .rpv-core__viewer--ebook .rpv-default-layout__toolbar { 
          background-color: #f5f0e8 !important; 
          border-bottom: 1px solid rgba(180, 83, 9, 0.12) !important;
        }
        .rpv-core__viewer--ebook .rpv-core__inner-page { background-color: #fff !important; }
        .rpv-ebook-scroll { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}