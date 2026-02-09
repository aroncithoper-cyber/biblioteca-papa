"use client";

import { useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function InstallGuideModal({ isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<"android" | "ios">("ios");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Fondo oscuro con desenfoque */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Ventana Principal */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-[2rem] bg-white text-left shadow-2xl transition-all animate-in zoom-in-95 duration-300 border border-white/20">
        
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 text-white text-center">
          <h3 className="text-xl font-bold">Instalar Aplicación</h3>
          <p className="text-amber-100 text-xs mt-1">Para leer sin internet</p>
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {/* Pestañas de Selección */}
          <div className="flex p-1 bg-gray-100 rounded-full mb-6 relative">
            {/* Animación de fondo */}
            <div 
              className={`absolute top-1 bottom-1 w-[48%] bg-white rounded-full shadow-sm transition-all duration-300 ease-out ${
                activeTab === "ios" ? "left-1" : "left-[51%]"
              }`}
            />
            
            <button
              onClick={() => setActiveTab("ios")}
              className={`relative z-10 flex-1 py-2 text-[11px] font-bold uppercase tracking-widest rounded-full transition-colors ${
                activeTab === "ios" ? "text-amber-700" : "text-gray-400"
              }`}
            >
              iPhone (iOS)
            </button>
            <button
              onClick={() => setActiveTab("android")}
              className={`relative z-10 flex-1 py-2 text-[11px] font-bold uppercase tracking-widest rounded-full transition-colors ${
                activeTab === "android" ? "text-green-700" : "text-gray-400"
              }`}
            >
              Android
            </button>
          </div>

          {/* Instrucciones iOS */}
          {activeTab === "ios" && (
            <div className="animate-in slide-in-from-left-4 duration-300 space-y-4">
              <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 text-blue-500">
                  {/* Icono Safari */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2.3 8.3-8.3 2.3 2.3-8.3z"/></svg>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="block font-bold text-gray-900">1. Usa Safari</span>
                  Abre esta página en el navegador Safari.
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 text-blue-500">
                  {/* Icono Compartir iOS */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="block font-bold text-gray-900">2. Botón Compartir</span>
                  Toca el icono cuadrado con flecha (abajo).
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 text-gray-500">
                  {/* Icono Agregar a Inicio */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="block font-bold text-gray-900">3. Agregar a Inicio</span>
                  Desliza hacia arriba y elige la opción que tiene un signo <strong>+</strong>.
                </div>
              </div>
            </div>
          )}

          {/* Instrucciones Android */}
          {activeTab === "android" && (
            <div className="animate-in slide-in-from-right-4 duration-300 space-y-4">
              <div className="flex items-start gap-4 p-3 bg-green-50 rounded-xl border border-green-100">
                <div className="bg-white p-2 rounded-lg shadow-sm text-green-600">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="block font-bold text-gray-900">Opción A: Instalación Directa</span>
                  Si ves un aviso abajo que dice <strong>"Agregar a la pantalla principal"</strong>, solo tócalo.
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="bg-white p-2 rounded-lg shadow-sm text-gray-500">
                   {/* Icono 3 Puntos */}
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="block font-bold text-gray-900">Opción B: Menú</span>
                  Toca los <strong>3 puntos</strong> arriba a la derecha y busca "Instalar aplicación".
                </div>
              </div>
            </div>
          )}

          <button 
            onClick={onClose}
            className="w-full mt-6 bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors"
          >
            ¡Entendido!
          </button>
        </div>
      </div>
    </div>
  );
}