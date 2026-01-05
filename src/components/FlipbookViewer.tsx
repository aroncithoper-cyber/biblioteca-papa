"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import * as pdfjsLib from "pdfjs-dist";
import { auth } from "@/lib/firebase"; // Asegúrate de que esta ruta sea correcta

(pdfjsLib as any).GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";

type Props = { fileUrl: string };

export default function FlipbookViewer({ fileUrl }: Props) {
  const bookRef = useRef<any>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [currentRender, setCurrentRender] = useState(0);
  const [errMsg, setErrMsg] = useState(""); 
  const [zoom, setZoom] = useState(1); 

  const renderScale = 1.8; 

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true } as any);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function renderPdf() {
      try {
        setLoading(true);
        setErrMsg(""); 
        setPages([]); 
        setTotalPages(0); 
        setCurrentRender(0); 

        const res = await fetch(fileUrl, { cache: "no-store", redirect: "follow" });
        if (!res.ok) throw new Error("No se pudo conectar con el servidor.");

        const data = await res.arrayBuffer();
        const pdf = await (pdfjsLib as any).getDocument({ data }).promise;
        setTotalPages(pdf.numPages);

        // Obtener el correo del usuario para la marca de agua
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

          // 1. Renderizar la página original del PDF
          await page.render({ canvasContext: ctx, viewport }).promise;

          // 2. APLICAR MARCA DE AGUA (Watermark)
          ctx.save();
          // Configuración del estilo del texto
          const fontSize = Math.floor(canvas.width / 18);
          ctx.font = `bold ${fontSize}px serif`;
          ctx.fillStyle = "rgba(150, 150, 150, 0.2)"; // Color gris muy suave y transparente
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          // Dibujar marca de agua central en diagonal
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate(-Math.PI / 4); // 45 grados
          ctx.fillText(userMark, 0, 0);

          // Dibujar marcas de agua adicionales en las esquinas para mayor seguridad
          ctx.font = `bold ${Math.floor(fontSize / 2.5)}px serif`;
          ctx.fillText(userMark, 0, canvas.height / 3.5);
          ctx.fillText(userMark, 0, -canvas.height / 3.5);
          
          ctx.restore();

          // 3. Convertir a imagen (ahora la marca de agua es parte de los píxeles)
          imgs.push(canvas.toDataURL("image/jpeg", 0.8));
          
          if (i === 1 || i % 4 === 0 || i === pdf.numPages) {
            setPages([...imgs]); 
          }
        }
        setLoading(false);
      } catch (e: any) {
        setErrMsg("No se pudo cargar el documento.");
        setLoading(false);
      }
    }
    renderPdf();
    return () => { cancelled = true; };
  }, [fileUrl]); 

  const progress = totalPages ? Math.round((currentRender / totalPages) * 100) : 0;

  return (
    <div className="w-full flex flex-col items-center gap-6 py-4 select-none" onContextMenu={(e) => e.preventDefault()}>
      
      {/* Controles Estilo Minimalista */}
      <div className="flex items-center justify-center gap-4 px-4 py-2 bg-white border rounded-xl shadow-md z-10 font-serif">
          <button className="w-8 h-8 rounded-full border hover:bg-black hover:text-white transition-colors" onClick={() => setZoom(z => Math.max(0.6, z - 0.1))}>–</button>
          <span className="text-xs w-10 text-center font-bold">{Math.round(zoom * 100)}%</span>
          <button className="w-8 h-8 rounded-full border hover:bg-black hover:text-white transition-colors" onClick={() => setZoom(z => Math.min(1.3, z + 0.1))}>+</button>
          <div className="w-px h-6 bg-gray-200 mx-2" />
          <button className="px-4 py-1.5 rounded-lg border text-sm font-medium hover:bg-gray-50" onClick={() => bookRef.current?.pageFlip()?.flipPrev()}>Anterior</button>
          <button className="px-4 py-1.5 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800" onClick={() => bookRef.current?.pageFlip()?.flipNext()}>Siguiente</button>
      </div>

      {/* Visor con Zoom Centrado */}
      <div className="relative flex items-center justify-center bg-gray-50 rounded-3xl p-10 min-h-[680px] w-full max-w-6xl overflow-hidden border border-gray-100">
        
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20 rounded-3xl">
            <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm italic font-serif text-gray-600">Preparando lectura protegida... {progress}%</p>
          </div>
        )}

        {errMsg && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-30">
            <p className="text-red-500 font-serif text-sm bg-red-50 px-4 py-2 rounded-lg border border-red-100">{errMsg}</p>
          </div>
        )}

        <div 
          className="transition-transform duration-300 ease-out shadow-2xl"
          style={{ 
            transform: `scale(${zoom})`, 
            transformOrigin: "center center"
          }}
        >
          {pages.length > 0 && (
            <HTMLFlipBook
              ref={bookRef}
              width={400}
              height={550}
              size="fixed"
              minWidth={400} maxWidth={400}
              minHeight={550} maxHeight={550}
              drawShadow={true}
              showCover={true}
              mobileScrollSupport={true}
              className="book-main shadow-2xl"
            >
              {pages.map((src, idx) => (
                <div key={idx} className="bg-white border-l border-gray-100">
                  <img 
                    src={src} 
                    alt={`Pág ${idx + 1}`} 
                    className="w-full h-full object-contain pointer-events-none shadow-inner" 
                    draggable={false} 
                  />
                </div>
              ))}
            </HTMLFlipBook>
          )}
        </div>
      </div>

      <div className="text-center space-y-1">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-serif">
          Jose Enrique Perez Leon — RV1909
        </p>
        <p className="text-[9px] text-gray-300 italic font-serif">
          Visualización protegida con marca de agua de usuario
        </p>
      </div>
    </div>
  );
}