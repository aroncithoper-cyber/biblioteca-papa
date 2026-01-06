"use client";

import { useEffect, useMemo, useRef, useState } from "react";
// @ts-ignore
import HTMLFlipBook from "react-pageflip";
import * as pdfjsLib from "pdfjs-dist";
import { auth } from "@/lib/firebase";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

type Props = { fileUrl: string };

export default function FlipbookViewer({ fileUrl }: Props) {
  const bookRef = useRef<any>(null);

  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [currentRender, setCurrentRender] = useState(0);
  const [errMsg, setErrMsg] = useState("");

  const [zoom, setZoom] = useState(1);
  const [theme, setTheme] = useState<"light" | "sepia" | "dark">("light");
  const [targetPage, setTargetPage] = useState("");

  const renderScale = 2.0;

  // Bloqueo de seguridad y atajos
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (k === "p" || k === "s")) e.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true } as any);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function renderPdf() {
      try {
        setErrMsg("");
        setLoading(true);
        setPages([]);
        setTotalPages(0);
        setCurrentRender(0);

        // fetch normal (sin CORS mode)
        const res = await fetch(fileUrl);
        if (!res.ok) throw new Error("No se pudo descargar el PDF");

        const data = await res.arrayBuffer();
        // @ts-ignore
        const pdf = await pdfjsLib.getDocument({ data }).promise;

        if (cancelled) return;

        setTotalPages(pdf.numPages);

        const userMark = auth.currentUser?.email || "Copia Protegida";
        const imgs: string[] = new Array(pdf.numPages);

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

          // ✅ pdfjs types fix (y evita error build)
          // @ts-ignore
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;

          // Marca de agua
          ctx.save();
          ctx.font = `bold ${Math.floor(canvas.width / 15)}px serif`;
          ctx.fillStyle = "rgba(180, 180, 180, 0.15)";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate(-Math.PI / 4);
          ctx.fillText(userMark, 0, 0);
          ctx.restore();

          imgs[i - 1] = canvas.toDataURL("image/jpeg", 0.75);
        }

        if (cancelled) return;

        // ✅ 1 solo setState => cero parpadeo
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
  }, [fileUrl]);

  const goToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(targetPage, 10);
    if (Number.isFinite(p) && p > 0 && p <= totalPages) {
      bookRef.current?.pageFlip()?.turnToPage(p - 1);
      setTargetPage("");
    }
  };

  const progress = totalPages ? Math.round((currentRender / totalPages) * 100) : 0;

  const themeStyles = useMemo(
    () => ({
      light: "bg-[#fdfdfd] border-amber-50",
      sepia: "bg-[#f4ecd8] border-[#e6d5b8] sepia-[0.2]",
      dark: "bg-[#121212] border-gray-800 invert-[0.9] hue-rotate-180",
    }),
    []
  );

  return (
    <div
      className="w-full flex flex-col items-center gap-8 py-6 select-none transition-colors duration-500"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Barra */}
      <div className="flex flex-wrap items-center justify-center gap-4 px-6 py-3 bg-white/90 backdrop-blur-xl border border-amber-100 rounded-[2rem] shadow-2xl z-50 sticky top-2">
        {/* Tema */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-full">
          <button
            onClick={() => setTheme("light")}
            className={`w-6 h-6 rounded-full bg-white border ${theme === "light" ? "ring-2 ring-amber-500" : ""}`}
          />
          <button
            onClick={() => setTheme("sepia")}
            className={`w-6 h-6 rounded-full bg-[#f4ecd8] border ${theme === "sepia" ? "ring-2 ring-amber-500" : ""}`}
          />
          <button
            onClick={() => setTheme("dark")}
            className={`w-6 h-6 rounded-full bg-[#2c2c2c] border ${theme === "dark" ? "ring-2 ring-amber-500" : ""}`}
          />
        </div>

        <div className="w-px h-6 bg-amber-100 hidden sm:block" />

        {/* Ir a página */}
        <form onSubmit={goToPage} className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Pág..."
            className="w-16 px-2 py-1 text-[10px] border rounded-lg outline-none focus:border-amber-500"
            value={targetPage}
            onChange={(e) => setTargetPage(e.target.value)}
          />
          <button type="submit" className="text-[10px] font-bold uppercase text-amber-700">
            Ir
          </button>
        </form>

        <div className="w-px h-6 bg-amber-100" />

        {/* Zoom + nav */}
        <div className="flex items-center gap-4">
          <div className="flex items-center border rounded-full px-2 bg-gray-50/50">
            <button className="p-1 hover:text-amber-600" onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.1).toFixed(2)))}>
              –
            </button>
            <span className="text-[10px] w-10 text-center font-black">{Math.round(zoom * 100)}%</span>
            <button className="p-1 hover:text-amber-600" onClick={() => setZoom((z) => Math.min(1.4, +(z + 0.1).toFixed(2)))}>
              +
            </button>
          </div>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 rounded-full border text-[10px] font-bold uppercase hover:bg-black hover:text-white transition-all"
              onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
            >
              Anterior
            </button>
            <button
              className="px-4 py-2 rounded-full bg-black text-white text-[10px] font-bold uppercase hover:bg-amber-700 shadow-lg"
              onClick={() => bookRef.current?.pageFlip()?.flipNext()}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Escenario */}
      <div
        className={`relative flex items-center justify-center rounded-[3.5rem] p-4 sm:p-12 min-h-[550px] sm:min-h-[780px] w-full max-w-6xl overflow-hidden border shadow-inner transition-colors duration-500 ${themeStyles[theme]}`}
      >
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 z-20 rounded-[3.5rem]">
            <div className="w-12 h-12 border-2 border-amber-200 border-t-amber-600 rounded-full animate-spin mb-4" />
            <p className="text-[11px] uppercase tracking-[0.4em] font-black text-amber-900/40 italic">
              Preparando Legado {progress}%
            </p>
          </div>
        )}

        {errMsg && !loading && (
          <div className="absolute inset-0 flex items-center justify-center z-30">
            <p className="text-red-600 bg-red-50 border border-red-100 px-4 py-2 rounded-xl text-sm">{errMsg}</p>
          </div>
        )}

        <div className="transition-all duration-500 ease-out" style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}>
          {pages.length > 0 && (
            <HTMLFlipBook
              ref={bookRef}
              width={380}
              height={550}
              size="stretch"
              minWidth={300}
              maxWidth={450}
              minHeight={450}
              maxHeight={650}
              drawShadow={true}
              showCover={true}
              mobileScrollSupport={true}
              className="book-main"
              style={{
                margin: "0 auto",
                boxShadow: theme === "dark" ? "0 40px 80px rgba(0,0,0,0.8)" : "0 50px 100px -20px rgba(0,0,0,0.2)",
              }}
              flippingTime={800}
              usePortrait={true}
              autoSize={true}
            >
              {pages.map((src, idx) => (
                <div key={idx} className="bg-white border-l border-gray-50 shadow-inner relative overflow-hidden">
                  <img src={src} alt="" className="w-full h-full object-contain pointer-events-none" draggable={false} />
                  <div className="absolute bottom-4 w-full text-center text-[9px] text-gray-300 font-serif italic tracking-widest">
                    — {idx + 1} de {totalPages} —
                  </div>
                </div>
              ))}
            </HTMLFlipBook>
          )}
        </div>
      </div>

      <div className="text-center opacity-40">
        <p className="text-[10px] uppercase tracking-[0.6em] font-black text-gray-500">Jose Enrique Perez Leon</p>
        <p className="text-[8px] font-serif italic mt-1">Biblioteca Digital Protegida v2.0</p>
      </div>

      <style jsx global>{`
        .book-main {
          background: transparent;
        }
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
        }
        @media (max-width: 600px) {
          .book-main {
            width: 320px !important;
            height: 480px !important;
          }
        }
      `}</style>
    </div>
  );
}
