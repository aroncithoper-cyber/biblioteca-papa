"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "@/components/Header";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Ensenanza,
  isAudioAvailable,
  openExternalUrl,
  shareEnsenanza,
  hasTelegramShareUrl,
  AVISO_INSTITUCIONAL,
  AVISO_USO_RECOMENDADO,
} from "@/lib/ensenanzas";

function getYouTubeEmbedUrl(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const id = match && match[2]?.length === 11 ? match[2] : null;
  return id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1` : null;
}

export default function EnsenanzaDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [item, setItem] = useState<Ensenanza | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!item) return;
    const result = await shareEnsenanza(item);
    if (result === "copied") {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        const snap = await getDoc(doc(db, "ensenanzas", id));
        if (!snap.exists()) {
          setNotFound(true);
          return;
        }
        setItem({ id: snap.id, ...(snap.data() as Omit<Ensenanza, "id">) });
      } catch (e) {
        console.error("Error cargando enseñanza:", e);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const audioReady = item ? isAudioAvailable(item) : false;
  const canShareAudio = item ? hasTelegramShareUrl(item) : false;
  const youtubeEmbed = item?.youtube_url?.trim()
    ? getYouTubeEmbedUrl(item.youtube_url.trim())
    : null;

  return (
    <main className="min-h-screen bg-[#fcfaf7] font-serif">
      <Header />

      <section className="max-w-3xl mx-auto px-6 py-12 sm:py-20">
        <Link
          href="/ensenanzas"
          className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-amber-600 hover:text-amber-800 mb-8 transition-colors"
        >
          ← Volver a la biblioteca
        </Link>

        {loading ? (
          <div className="flex flex-col items-center py-24 opacity-50">
            <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mb-4" />
            <p className="text-xs uppercase tracking-widest">Cargando...</p>
          </div>
        ) : notFound || !item ? (
          <div className="text-center py-24">
            <span className="text-5xl block mb-4">🎧</span>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Enseñanza no encontrada
            </h1>
            <Link
              href="/ensenanzas"
              className="text-amber-600 underline text-sm"
            >
              Regresar al catálogo
            </Link>
          </div>
        ) : (
          <article className="animate-in fade-in duration-500">
            <div className="mb-6 flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-amber-50 text-amber-800 text-[10px] font-bold uppercase rounded-full tracking-wider border border-amber-100">
                {item.category || "General"}
              </span>
              {item.status === "coming_soon" && (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded-full tracking-wider">
                  Próximamente
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 tracking-tighter leading-tight mb-6">
              {item.title}
            </h1>

            <div className="flex flex-wrap gap-4 sm:gap-6 text-sm text-gray-500 mb-8 pb-8 border-b border-amber-100">
              {item.predicador && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">
                    Predicador
                  </p>
                  <p className="font-bold text-gray-800">{item.predicador}</p>
                </div>
              )}
              {item.fecha && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">
                    Fecha
                  </p>
                  <p className="font-bold text-gray-800">{item.fecha}</p>
                </div>
              )}
              {item.duration && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">
                    Duración
                  </p>
                  <p className="font-bold text-gray-800">{item.duration}</p>
                </div>
              )}
            </div>

            {item.description && (
              <div className="mb-10">
                <div className="w-12 h-1 bg-amber-500 rounded-full mb-4" />
                <p className="text-gray-600 text-base sm:text-lg leading-relaxed font-light text-justify whitespace-pre-line">
                  {item.description}
                </p>
              </div>
            )}

            <div className="space-y-3 mb-6">
              {audioReady ? (
                <button
                  type="button"
                  onClick={() => openExternalUrl(item.telegram_url!)}
                  className="w-full min-h-[44px] py-4 px-6 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-2xl text-sm sm:text-base font-bold transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  🎧 Escuchar enseñanza en Telegram
                </button>
              ) : (
                <div className="w-full py-4 px-6 bg-gray-100 text-gray-500 rounded-2xl text-sm font-bold text-center border border-gray-200">
                  Audio próximamente disponible
                </div>
              )}

              {item.youtube_url?.trim() && (
                <button
                  type="button"
                  onClick={() => openExternalUrl(item.youtube_url!)}
                  className="w-full min-h-[44px] py-3 px-6 bg-white border-2 border-red-200 text-red-700 hover:bg-red-50 rounded-2xl text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  ▶ Ver video en YouTube
                </button>
              )}

              {canShareAudio ? (
                <>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="w-full min-h-[44px] py-3 px-6 bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                  >
                    📤 Compartir audio
                  </button>
                  {copied && (
                    <p className="text-center text-xs font-bold text-green-700 bg-green-50 py-2.5 px-4 rounded-xl animate-in fade-in duration-200">
                      Enlace copiado para compartir.
                    </p>
                  )}
                </>
              ) : (
                <div
                  className="w-full min-h-[44px] py-3 px-6 bg-gray-50 border border-gray-200 text-gray-400 rounded-2xl text-sm font-bold text-center flex items-center justify-center"
                  aria-disabled="true"
                >
                  Audio aún no disponible
                </div>
              )}
            </div>

            <div className="bg-white/80 border border-amber-100 rounded-2xl p-5 sm:p-6 mb-10">
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                {AVISO_USO_RECOMENDADO}
              </p>
            </div>

            {youtubeEmbed && (
              <div className="mb-10 aspect-video rounded-[2rem] overflow-hidden shadow-xl border-4 border-white ring-1 ring-gray-100">
                <iframe
                  className="w-full h-full"
                  src={youtubeEmbed}
                  title={item.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            <div className="bg-amber-50/80 border border-amber-100 rounded-2xl p-5 sm:p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-2">
                Aviso institucional
              </p>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                {AVISO_INSTITUCIONAL}
              </p>
            </div>
          </article>
        )}
      </section>
    </main>
  );
}
