"use client";

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import FlipbookViewer from "@/components/FlipbookViewer";
import { useLanguage } from "@/lib/language";

export default function DocumentoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { t } = useLanguage();

  const [title, setTitle] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [isNightMode, setIsNightMode] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        if (!id) return;

        const snap = await getDoc(doc(db, "documents", id));

        if (!snap.exists()) {
          router.push("/biblioteca");
          return;
        }

        const data = snap.data() as any;
        if (!alive) return;

        setTitle(data.title || t.document.defaultVolume);

        const fileUrl = data.fileUrl || data.pdfUrl;
        if (!fileUrl) {
          router.push("/biblioteca");
          return;
        }

        setPdfUrl(fileUrl);
        setLoading(false);
      } catch {
        router.push("/biblioteca");
      }
    })();

    return () => {
      alive = false;
    };
  }, [id, router, t.document.defaultVolume]);

  return (
    <main
      className={`min-h-screen font-serif transition-colors duration-700 ${
        isNightMode ? "bg-[#121212] text-gray-300" : "bg-[#fcfaf7] text-gray-900"
      }`}
    >
      <Header />

      <section className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-12">
        <div
          className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-12 border-b pb-4 sm:pb-6 ${
            isNightMode ? "border-gray-800" : "border-amber-100"
          }`}
        >
          <button
            type="button"
            className={`group flex items-center gap-2 sm:gap-3 min-h-[44px] text-[10px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.3em] transition-all self-start ${
              isNightMode
                ? "text-gray-500 hover:text-gray-300"
                : "text-gray-400 hover:text-black"
            }`}
            onClick={() => router.push("/biblioteca")}
          >
            <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
            <span className="sm:hidden">{t.document.back}</span>
            <span className="hidden sm:inline">{t.document.backToLibrary}</span>
          </button>

          <div className="flex items-center gap-3 sm:gap-4 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsNightMode(!isNightMode)}
              className={`hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full border text-[9px] font-bold uppercase tracking-widest transition-all ${
                isNightMode
                  ? "bg-gray-800 border-gray-700 text-amber-400 hover:bg-gray-700"
                  : "bg-white border-amber-200 text-gray-600 hover:bg-amber-50"
              }`}
            >
              <span className="text-sm">{isNightMode ? "☀️" : "🌙"}</span>
              <span>{isNightMode ? t.document.dayMode : t.document.nightMode}</span>
            </button>

            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-amber-700 font-bold">
              <span className="sm:hidden">{t.document.protected}</span>
              <span className="hidden sm:inline">{t.document.protectedReading}</span>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsNightMode(!isNightMode)}
          className={`sm:hidden flex items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 rounded-full border shadow-lg transition-all ml-auto mr-0 mb-4 ${
            isNightMode
              ? "bg-gray-800 border-gray-700 text-amber-400"
              : "bg-white border-amber-200 text-gray-600"
          }`}
          aria-label={isNightMode ? t.document.dayModeAria : t.document.nightModeAria}
        >
          <span className="text-lg">{isNightMode ? "☀️" : "🌙"}</span>
        </button>

        <div className="text-center mb-8 sm:mb-16 space-y-3 sm:space-y-4">
          <p
            className={`text-[10px] sm:text-xs uppercase tracking-[0.4em] sm:tracking-[0.5em] ${
              isNightMode ? "text-amber-600/40" : "text-amber-600/60"
            }`}
          >
            {t.document.legacyCollection}
          </p>
          <h1
            className={`text-2xl sm:text-4xl md:text-6xl font-bold tracking-tighter max-w-4xl mx-auto leading-tight px-2 ${
              isNightMode ? "text-gray-100" : "text-gray-900"
            }`}
          >
            {loading ? t.document.openingFiles : title}
          </h1>
          <div className="flex justify-center items-center gap-4">
            <div className={`h-px w-16 ${isNightMode ? "bg-gray-800" : "bg-gray-200"}`} />
            <img
              src="/icon-512.png"
              className={`w-6 h-6 opacity-30 ${isNightMode ? "grayscale invert" : "grayscale"}`}
              alt=""
            />
            <div className={`h-px w-16 ${isNightMode ? "bg-gray-800" : "bg-gray-200"}`} />
          </div>
        </div>

        <div className="relative">
          {loading ? (
            <div
              className={`flex flex-col items-center justify-center min-h-[40vh] md:min-h-[650px] rounded-2xl md:rounded-[40px] border shadow-inner ${
                isNightMode
                  ? "bg-gray-900/50 border-gray-800"
                  : "bg-white/50 backdrop-blur-sm border-amber-100"
              }`}
            >
              <div className="relative">
                <div
                  className={`w-16 h-16 border-2 border-t-amber-600 rounded-full animate-spin ${
                    isNightMode ? "border-gray-800" : "border-amber-100"
                  }`}
                />
                <img
                  src="/icon-512.png"
                  className={`w-6 h-6 absolute inset-0 m-auto opacity-20 ${isNightMode ? "invert" : ""}`}
                  alt=""
                />
              </div>
              <p
                className={`mt-6 text-sm italic tracking-widest uppercase ${
                  isNightMode ? "text-gray-500" : "text-amber-800/40"
                }`}
              >
                {t.document.preparingVolume}
              </p>
            </div>
          ) : (
            <div
              className={`animate-in fade-in slide-in-from-bottom-10 duration-1000 p-1 sm:p-2 md:p-8 rounded-2xl md:rounded-[40px] shadow-2xl border transition-all duration-700 overflow-x-hidden ${
                isNightMode
                  ? "bg-gray-900 border-gray-800 shadow-black/50"
                  : "bg-white/40 shadow-amber-900/5 border-white/60"
              }`}
            >
              {pdfUrl && <FlipbookViewer fileUrl={pdfUrl} />}
            </div>
          )}
        </div>

        <div
          className={`mt-12 sm:mt-20 text-center pb-8 sm:pb-12 border-t mx-auto max-w-xs pt-6 sm:pt-8 ${
            isNightMode ? "border-gray-800" : "border-amber-50"
          }`}
        >
          <p
            className={`text-[10px] uppercase tracking-[0.5em] leading-loose ${
              isNightMode ? "text-gray-500" : "text-gray-300"
            }`}
          >
            Jose Enrique Perez Leon
            <br />
            <span
              className={`font-bold italic text-xs ${
                isNightMode ? "text-amber-700/30" : "text-amber-600/40"
              }`}
            >
              Consejero del Obrero
            </span>
          </p>
        </div>
      </section>
    </main>
  );
}
