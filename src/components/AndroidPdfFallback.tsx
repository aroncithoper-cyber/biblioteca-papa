"use client";

import { useState } from "react";

type Props = {
  title: string;
  fileUrl: string;
  onBack: () => void;
  onTryIntegratedReader?: () => void;
};

export default function AndroidPdfFallback({
  title,
  fileUrl,
  onBack,
  onTryIntegratedReader,
}: Props) {
  const [copied, setCopied] = useState(false);

  const openInBrowser = () => {
    window.open(fileUrl, "_blank", "noopener,noreferrer");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const input = document.createElement("textarea");
      input.value = fileUrl;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <section className="px-4 py-8 sm:py-12 max-w-lg mx-auto">
      <div className="rounded-[2rem] border border-amber-100 bg-white/80 shadow-xl shadow-amber-900/5 overflow-hidden">
        <div className="px-6 pt-8 pb-6 border-b border-amber-50 bg-gradient-to-b from-amber-50/60 to-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-700 mb-3">
            Modo compatible para Android
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight tracking-tight">
            {title}
          </h1>
        </div>

        <div className="px-6 py-6 space-y-4 text-sm text-gray-600 leading-relaxed">
          <p>
            Para evitar bloqueos en algunos celulares Android, este documento se
            abrirá con el visor nativo del navegador.
          </p>
          <p>
            Puedes leerlo, ampliarlo o descargarlo desde las opciones de tu
            navegador.
          </p>
        </div>

        <div className="px-6 pb-8 space-y-3">
          <button
            type="button"
            onClick={openInBrowser}
            className="w-full min-h-[48px] px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-amber-900/10 active:scale-[0.98] transition-transform"
          >
            Abrir PDF en navegador
          </button>

          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full min-h-[48px] items-center justify-center px-5 py-3 rounded-2xl border border-amber-200 bg-amber-50/50 text-amber-900 text-xs font-bold uppercase tracking-wider active:scale-[0.98] transition-transform"
          >
            Descargar / abrir PDF
          </a>

          <button
            type="button"
            onClick={copyLink}
            className="w-full min-h-[48px] px-5 py-3 rounded-2xl border border-gray-200 bg-white text-gray-700 text-xs font-bold uppercase tracking-wider active:scale-[0.98] transition-transform"
          >
            Copiar enlace
          </button>

          {copied && (
            <p className="text-center text-[11px] text-amber-700 font-medium animate-in fade-in">
              Enlace copiado.
            </p>
          )}

          <button
            type="button"
            onClick={onBack}
            className="w-full min-h-[44px] px-5 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-gray-800 transition-colors"
          >
            Volver a biblioteca
          </button>

          {onTryIntegratedReader && (
            <button
              type="button"
              onClick={onTryIntegratedReader}
              className="w-full min-h-[40px] px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-gray-400 underline underline-offset-4 decoration-gray-300 hover:text-amber-700 hover:decoration-amber-300 transition-colors"
            >
              Intentar lector integrado
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
