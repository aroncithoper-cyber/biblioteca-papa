"use client";

import { useEffect, useRef, useState, useMemo } from "react";
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
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "p" || e.key.toLowerCase() === "s")) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function renderPdf() {
      try {
        setLoading(true);
        const res = await fetch(fileUrl, { mode: 'cors' });
        if (!res.ok) throw new Error("Acceso denegado");

        const data = await res.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data }).promise;
        setTotalPages(pdf.numPages);

        const userMark = auth.currentUser?.email || "Copia Protegida";
        const imgs: string[] = [];

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
          await page.render({ canvasContext: ctx, viewport }).promise;

          // Marca de agua dinámica
          ctx.save();
          ctx.font = `bold ${Math.floor(canvas.width / 15)}px serif`;
          ctx.fillStyle = "rgba(180, 180, 180, 0.15)";
          ctx.textAlign = "center";
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate(-Math.PI / 4);
          ctx.fillText(userMark, 0, 0);
          ctx.restore();

          imgs.push(canvas.toDataURL("image/jpeg", 0.75));
          if (i === 1 || i % 3 === 0 || i === pdf.numPages) setPages([...imgs]);
        }
        setLoading(false);
      } catch (e) {
        setErrMsg("Error al procesar el tomo sagrado.");
        setLoading(false);
      }
    }
    renderPdf();
    return () => { cancelled = true; };
  }, [fileUrl]);

  const goToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(targetPage);
    if (p > 0 && p <= totalPages) {
      bookRef.current?.pageFlip()?.turnToPage(p - 1);
      setTargetPage("");
    }
  };

  const progress = totalPages ? Math.round((currentRender / totalPages) * 100) : 0;

  // Estilos de tema dinámicos
  const themeStyles = {
    light: "bg-[#fdfdfd] border-amber-50",
    sepia: "bg-[#f4ecd8] border-[#e6d5b8] sepia-[0.2]",
    dark: "bg-[#121212] border-gray-800 invert-[0.9] hue-rotate-180"
  };

  return (
    <div className={`w-full flex flex-col items-center gap-8 py-6 select-none transition-colors duration-500`} onContextMenu={(e) => e.preventDefault()}>
      
      {/* Barra de Herramientas Ultra-Pro */}
      <div className="flex flex-wrap items-center justify-center gap-4 px-6 py-3 bg-white/90 backdrop-blur-xl border border-amber-100 rounded-[2rem] shadow-2xl z-50 sticky top-2">
        
        {/* Selector de Tema */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-full">
          <button onClick={() => setTheme("light")} className={`w-6 h-6 rounded-full bg-white border ${theme === 'light' ? 'ring-2 ring-amber-500' : ''}`} />
          <button onClick={() => setTheme("sepia")} className={`w-6 h-6 rounded-full bg-[#f4ecd8] border ${theme === 'sepia' ? 'ring-2 ring-amber-500' : ''}`} />
          <button onClick={() => setTheme("dark")} className={`w-6 h-6 rounded-full bg-[#2c2c2c] border ${theme === 'dark' ? 'ring-2 ring-amber-500' : ''}`} />
        </div>

        <div className="w-px h-6 bg-amber-100 hidden sm:block" />

        {/* Buscador de Páginas */}
        <form onSubmit={goToPage} className="flex items-center gap-2">
          <input 
            type="number" 
            placeholder="Pág..." 
            className="w-16 px-2 py-1 text-[10px] border rounded-lg outline-none focus:border-amber-500"
            value={targetPage}
            onChange={(e) => setTargetPage(e.target.value)}
          />
          <button type="submit" className="text-[10px] font-bold uppercase text-amber-700">Ir</button>
        </form>

        <div className="w-px h-6 bg-amber-100" />

        {/* Controles Zoom y Navegación */}
        <div className="flex items-center gap-4">
          <div className="flex items-center border rounded-full px-2 bg-gray-50/50">
            <button className="p-1 hover:text-amber-600" onClick={() => setZoom(z => Math.max(0.6, z - 0.1))}>–</button>
            <span className="text-[10px] w-10 text-center font-black">{Math.round(zoom * 100)}%</span>
            <button className="p-1 hover:text-amber-600" onClick={() => setZoom(z => Math.min(1.4, z + 0.1))}>+</button>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-full border text-[10px] font-bold uppercase hover:bg-black hover:text-white transition-all" onClick={() => bookRef.current?.pageFlip()?.flipPrev()}>Anterior</button>
            <button className="px-4 py-2 rounded-full bg-black text-white text-[10px] font-bold uppercase hover:bg-amber-700 shadow-lg" onClick={() => bookRef.current?.pageFlip()?.flipNext()}>Siguiente</button>
          </div>
        </div>
      </div>

      {/* Escenario del Libro */}
      <div className={`relative flex items-center justify-center rounded-[3.5rem] p-4 sm:p-12 min-h-[550px] sm:min-h-[780px] w-full max-w-6xl overflow-hidden border shadow-inner transition-colors duration-500 ${themeStyles[theme]}`}>
        
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 z-20 rounded-[3.5rem]">
            <div className="w-12 h-12 border-2 border-amber-200 border-t-amber-600 rounded-full animate-spin mb-4" />
            <p className="text-[11px] uppercase tracking-[0.4em] font-black text-amber-900/40 italic">Preparando Legado {progress}%</p>
          </div>
        )}

        <div 
          className="transition-all duration-500 ease-out"
          style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
        >
          {pages.length > 0 && (
            <HTMLFlipBook
              ref={bookRef}
              width={380} height={550}
              size="stretch"
              minWidth={300} maxWidth={450}
              minHeight={450} maxHeight={650}
              drawShadow={true}
              showCover={true}
              mobileScrollSupport={true}
              className="book-main"
              style={{ margin: "0 auto", boxShadow: theme === 'dark' ? "0 40px 80px rgba(0,0,0,0.8)" : "0 50px 100px -20px rgba(0,0,0,0.2)" }}
              flippingTime={800}
              usePortrait={true}
              autoSize={true}
            >
              {pages.map((src, idx) => (
                <div key={idx} className="bg-white border-l border-gray-50 shadow-inner relative overflow-hidden">
                  <img src={src} alt="" className="w-full h-full object-contain pointer-events-none" />
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
        .book-main { background: transparent; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        @media (max-width: 600px) {
          .book-main { width: 320px !important; height: 480px !important; }
        }
      `}</style>
    </div>
  );
}