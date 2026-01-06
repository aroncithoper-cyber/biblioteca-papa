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

  // Nuevo: Modo de vista (Libro 3D vs Ebook Vertical)
  const [viewMode, setViewMode] = useState<"flip" | "scroll">("flip");

  // Nuevo: Dimensiones dinámicas para evitar cortes
  const [bookDimensions, setBookDimensions] = useState({ width: 380, height: 550 });

  // Aumentamos calidad de renderizado (Mejor que lo que sugirió ChatGPT)
  const renderScale = 2.5; 

  // Detectar móvil para sugerir modo scroll
  useEffect(() => {
    if (window.innerWidth < 768) setViewMode("scroll");
  }, []);

  // Bloqueos de seguridad
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

        // Fetch normal (asumiendo que las reglas de CORS están bien configuradas)
        const res = await fetch(fileUrl);
        if (!res.ok) throw new Error("No se pudo descargar el PDF");

        const data = await res.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data }).promise;

        if (cancelled) return;

        setTotalPages(pdf.numPages);
        const userMark = auth.currentUser?.email || "Copia Protegida";
        const imgs: string[] = new Array(pdf.numPages);

        // --- CORRECCIÓN DE PALABRAS CORTADAS ---
        // Obtenemos la primera página para calcular el tamaño real del libro
        const firstPage = await pdf.getPage(1);
        const viewport = firstPage.getViewport({ scale: 1 });
        const ratio = viewport.width / viewport.height;
        
        // Ajustamos el contenedor del libro al ratio del PDF
        const baseHeight = 550; // Altura fija cómoda
        const calculatedWidth = Math.floor(baseHeight * ratio);
        setBookDimensions({ width: calculatedWidth, height: baseHeight });

        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;
          setCurrentRender(i);

          const page = await pdf.getPage(i);
          // Renderizamos con alta calidad
          const viewportHigh = page.getViewport({ scale: renderScale });
          
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;

          canvas.width = Math.floor(viewportHigh.width);
          canvas.height = Math.floor(viewportHigh.height);

          // Renderizamos
          await page.render({ canvasContext: ctx, viewport: viewportHigh, canvas }).promise;

          // Marca de agua sutil
          ctx.save();
          ctx.font = `bold ${Math.floor(canvas.width / 20)}px serif`;
          ctx.fillStyle = "rgba(128, 128, 128, 0.1)"; 
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate(-Math.PI / 4);
          ctx.fillText(userMark, 0, 0);
          ctx.restore();

          imgs[i - 1] = canvas.toDataURL("image/jpeg", 0.85);

          // Actualización progresiva para modo Scroll
          if (viewMode === 'scroll' && i % 3 === 0) {
             setPages([...imgs.filter(Boolean)]);
          }
        }

        if (cancelled) return;
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
    return () => { cancelled = true; };
  }, [fileUrl, viewMode]);

  const goToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(targetPage, 10);
    if (Number.isFinite(p) && p > 0 && p <= totalPages) {
      if (viewMode === 'flip') {
        bookRef.current?.pageFlip()?.turnToPage(p - 1);
      } else {
        const el = document.getElementById(`page-${p-1}`);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
      setTargetPage("");
    }
  };

  const themeStyles = useMemo(
    () => ({
      light: "bg-[#fdfdfd]",
      sepia: "bg-[#f4ecd8] sepia-[0.2]",
      dark: "bg-[#121212] invert-[0.9] hue-rotate-180",
    }),
    []
  );

  return (
    <div
      className={`w-full flex flex-col items-center gap-4 py-4 select-none transition-colors duration-500 min-h-screen ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* BARRA DE HERRAMIENTAS FLOTANTE */}
      <div className="sticky top-4 z-50 flex flex-wrap items-center justify-center gap-3 px-4 py-2 bg-white/90 backdrop-blur-xl border border-amber-100 rounded-full shadow-xl mx-4 max-w-full">
        
        {/* SWITCHER DE MODO (Clave para "Ebook") */}
        <button 
            onClick={() => setViewMode(viewMode === 'flip' ? 'scroll' : 'flip')}
            className="flex items-center gap-2 px-4 py-1.5 bg-black text-white rounded-full text-[10px] font-bold uppercase hover:bg-amber-600 transition-colors shadow-md"
        >
            {viewMode === 'flip' ? '📱 Modo Ebook' : '📖 Modo Libro 3D'}
        </button>

        <div className="w-px h-4 bg-gray-300 hidden sm:block" />

        {/* Temas */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-full">
          {['light', 'sepia', 'dark'].map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t as any)}
              className={`w-6 h-6 rounded-full border transition-transform ${theme === t ? "ring-2 ring-amber-500 scale-110" : "opacity-50"} ${t==='light'?'bg-white':t==='sepia'?'bg-[#f4ecd8]':'bg-[#2c2c2c]'}`}
              title={`Tema ${t}`}
            />
          ))}
        </div>

        {/* Zoom (Solo visible en modo Flip, en Ebook se usa el del celular) */}
        {viewMode === 'flip' && (
            <>
                <div className="w-px h-4 bg-gray-300 hidden sm:block" />
                <div className="flex items-center border rounded-full px-2 bg-white">
                  <button className="px-2 font-bold hover:text-amber-600" onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.1).toFixed(2)))}>–</button>
                  <button className="px-2 font-bold hover:text-amber-600" onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.1).toFixed(2)))}>+</button>
                </div>
            </>
        )}

        {/* Ir a página */}
        <form onSubmit={goToPage} className="flex items-center gap-1 border-l pl-3 border-gray-200">
          <input
            type="number"
            placeholder="#"
            className="w-10 px-1 py-1 text-[10px] text-center border rounded outline-none focus:border-amber-500"
            value={targetPage}
            onChange={(e) => setTargetPage(e.target.value)}
          />
        </form>
      </div>

      {/* ERROR / CARGA */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
           <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mb-4" />
           <p className="text-xs text-amber-800 font-bold uppercase tracking-widest">Preparando Obra...</p>
        </div>
      )}
      
      {errMsg && <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">{errMsg}</div>}


      {/* --- MODO LIBRO 3D (PC / Estético) --- */}
      {viewMode === 'flip' && !loading && pages.length > 0 && (
         <div className={`relative flex items-center justify-center p-4 sm:p-10 transition-all duration-500 ${themeStyles[theme]}`}>
            <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center", transition: "transform 0.3s" }}>
                <HTMLFlipBook
                  ref={bookRef}
                  width={bookDimensions.width} // ANCHO CALCULADO AUTOMÁTICAMENTE
                  height={bookDimensions.height} // ALTO FIJO
                  size="fixed" // Fixed evita saltos raros
                  minWidth={300} maxWidth={600}
                  minHeight={400} maxHeight={800}
                  drawShadow={true}
                  showCover={true}
                  mobileScrollSupport={false} 
                  className="book-main shadow-2xl"
                  startPage={0}
                  startZIndex={0}
                  autoSize={true}
                  clickEventForward={true}
                  useMouseEvents={true}
                  showPageCorners={true}
                  disableFlipByClick={false}
                >
                  {pages.map((src, idx) => (
                    <div key={idx} className="bg-white border-l border-gray-50 overflow-hidden relative">
                      {/* object-contain con padding evita cortes de palabras en los bordes */}
                      <div className="w-full h-full p-2 flex items-center justify-center">
                          <img src={src} className="max-w-full max-h-full object-contain shadow-sm" draggable={false} />
                      </div>
                      <div className="absolute bottom-2 w-full text-center text-[8px] text-gray-400 font-serif">— {idx + 1} —</div>
                    </div>
                  ))}
                </HTMLFlipBook>
            </div>
         </div>
      )}


      {/* --- MODO EBOOK / ESTUDIO (Celular / Lectura Vertical) --- */}
      {viewMode === 'scroll' && !loading && pages.length > 0 && (
          <div className={`w-full max-w-3xl px-2 sm:px-0 flex flex-col gap-6 pb-20 ${themeStyles[theme]}`}>
              <div className="text-center py-2 text-[10px] text-gray-400 uppercase tracking-widest">
                  Modo Estudio — Desliza y haz Zoom libremente
              </div>
              
              {pages.map((src, idx) => (
                  <div 
                    key={idx} 
                    id={`page-${idx}`}
                    className="relative w-full bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100 group"
                  >
                      <img 
                        src={src} 
                        className="w-full h-auto object-contain" 
                        loading="lazy" 
                        alt={`Página ${idx + 1}`} 
                      />
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white px-3 py-1 rounded-full text-[10px] font-bold opacity-50 group-hover:opacity-100 transition-opacity">
                          {idx + 1}
                      </div>
                  </div>
              ))}
          </div>
      )}

      <style jsx global>{`
        .book-main { background: transparent; }
        input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>
    </div>
  );
}