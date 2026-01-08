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
    <div className="fixed inset-0 z-[200] overflow-y-auto">
      {/* Fondo oscuro al hacer clic cierra */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Ventana */}
      <div className="flex min-h-full items-center justify-center p-4 text-center animate-in zoom-in-95 duration-300">
        <div className="relative w-full max-w-lg transform overflow-hidden rounded-[2rem] bg-white p-8 text-left shadow-2xl transition-all border border-amber-100">
          
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">Instalar Aplicación</h3>
            <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full text-gray-500 font-bold hover:bg-red-50 hover:text-red-500">✕</button>
          </div>

          {/* Pestañas */}
          <div className="flex p-1 bg-gray-100 rounded-full mb-6">
            <button
              onClick={() => setActiveTab("ios")}
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all ${
                activeTab === "ios" ? "bg-white text-black shadow-md" : "text-gray-400"
              }`}
            >
              iPhone (iOS)
            </button>
            <button
              onClick={() => setActiveTab("android")}
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all ${
                activeTab === "android" ? "bg-white text-green-600 shadow-md" : "text-gray-400"
              }`}
            >
              Android
            </button>
          </div>

          {/* Instrucciones */}
          <div className="space-y-4 text-sm text-gray-600">
            {activeTab === "ios" ? (
              <div className="animate-in fade-in">
                <p className="mb-4">En iPhone, Apple no permite instalación automática. Sigue estos pasos:</p>
                <ol className="space-y-3">
                  <li className="flex gap-3 items-start">
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-bold">1</span>
                    <span>Abre esta página en <strong>Safari</strong>.</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-bold">2</span>
                    <span>Toca el botón <strong>Compartir</strong> <span className="text-xl leading-none">⏍</span> (cuadro con flecha) abajo.</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-bold">3</span>
                    <span>Desliza hacia arriba y elige <strong>"Agregar a Inicio"</strong>.</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-bold">4</span>
                    <span>Dale a <strong>Agregar</strong> arriba a la derecha.</span>
                  </li>
                </ol>
              </div>
            ) : (
              <div className="animate-in fade-in">
                <p className="mb-4">Para la mayoría de Androids:</p>
                <ol className="space-y-3">
                  <li className="flex gap-3 items-start">
                    <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs font-bold">1</span>
                    <span>Si ves el botón <strong>"Instalar App"</strong> abajo, úsalo.</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-bold">2</span>
                    <span>Si no, abre el menú (3 puntos ⋮) arriba a la derecha.</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-bold">3</span>
                    <span>Selecciona <strong>"Instalar aplicación"</strong> o "Agregar a pantalla principal".</span>
                  </li>
                </ol>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}