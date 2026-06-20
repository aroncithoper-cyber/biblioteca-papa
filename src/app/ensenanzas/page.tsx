"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "@/components/Header";
import Link from "next/link";
import {
  Ensenanza,
  isAudioAvailable,
  openExternalUrl,
  shareEnsenanza,
  sortEnsenanzas,
  hasTelegramShareUrl,
  AVISO_INSTITUCIONAL,
} from "@/lib/ensenanzas";

const TELEGRAM_BENEFITS = [
  {
    icon: "📱",
    text: "Sigue escuchando con la pantalla bloqueada",
  },
  {
    icon: "🚶",
    text: "Ideal para el trayecto o camino",
  },
  {
    icon: "🎧",
    text: "Escucha mientras realizas tus actividades",
  },
  {
    icon: "📤",
    text: "Comparte el audio con otros hermanos para edificación",
  },
] as const;

const CATEGORY_ICONS: Record<string, string> = {
  Doctrina: "📖",
  Predicación: "🎙️",
  Estudio: "📝",
  Devocional: "🙏",
  General: "🎧",
};

function getCategoryIcon(category?: string) {
  if (!category) return "🎧";
  return CATEGORY_ICONS[category] ?? "🎧";
}

export default function EnsenanzasPage() {
  const [items, setItems] = useState<Ensenanza[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(db, "ensenanzas"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Ensenanza, "id">),
        })) as Ensenanza[];
        setItems(sortEnsenanzas(data));
      } catch (e) {
        console.error("Error cargando enseñanzas:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(items.map((i) => i.category || "General"));
    return ["Todos", ...Array.from(cats).sort()];
  }, [items]);

  const term = searchTerm.toLowerCase().trim();

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory =
        selectedCategory === "Todos" ||
        (item.category || "General") === selectedCategory;

      if (!term) return matchesCategory;

      const haystack = [
        item.title,
        item.description,
        item.category,
        item.predicador,
        item.fecha,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesCategory && haystack.includes(term);
    });
  }, [items, selectedCategory, term]);

  return (
    <main className="ambient-page min-h-screen bg-[#fcfaf7] font-serif select-none overflow-x-hidden">
      <Header />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 sm:pt-24 pb-8 text-center">
        <div className="inline-block px-4 py-1.5 border border-amber-200 rounded-full bg-white shadow-sm mb-6">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-700">
            Ministerio local
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-900 mb-4 tracking-tighter leading-tight">
          Biblioteca de Enseñanzas
        </h1>
        <p className="text-sm sm:text-lg md:text-xl text-amber-900/50 font-medium italic max-w-2xl mx-auto mb-4 sm:mb-6">
          Audios y estudios organizados para apoyo del ministerio local.
        </p>
        <p className="hidden sm:block text-[10px] sm:text-xs text-gray-400 max-w-xl mx-auto leading-relaxed px-2">
          {AVISO_INSTITUCIONAL}
        </p>
      </section>

      {/* Beneficios de Telegram */}
      <section className="max-w-3xl mx-auto px-6 pb-6">
        <div className="card-enter rounded-2xl sm:rounded-3xl border border-amber-100/80 bg-white/75 p-5 sm:p-7 shadow-sm backdrop-blur-md ring-1 ring-amber-50/80">
          <div className="mb-4 flex items-start gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-50 text-lg ring-1 ring-amber-100">
              🎧
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight leading-snug">
                Escucha la Palabra en tu camino
              </h2>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Los audios se abren en Telegram para que puedas escucharlos con mayor comodidad: mientras viajas, trabajas, caminas o realizas tus actividades diarias. Puedes bloquear tu celular y continuar escuchando sin interrumpir la enseñanza.
              </p>
            </div>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            {TELEGRAM_BENEFITS.map((item) => (
              <li
                key={item.text}
                className="flex items-start gap-2.5 rounded-xl border border-amber-50/80 bg-[#fcfaf7]/80 px-3 py-2.5 sm:px-4 sm:py-3"
              >
                <span className="text-base flex-shrink-0 leading-none mt-0.5" aria-hidden>
                  {item.icon}
                </span>
                <span className="text-xs sm:text-sm text-gray-700 leading-snug font-medium">
                  {item.text}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-4 border-t border-amber-100/80 pt-4 text-xs text-amber-900/70 leading-relaxed">
            Comparte estos audios con respeto, sin alterar el contenido y procurando que sean de edificación espiritual.
          </p>
        </div>
      </section>

      {/* Buscador y categorías */}
      <section className="max-w-6xl mx-auto px-6 pb-4 md:pb-8 md:sticky md:top-4 z-40 space-y-3 md:space-y-4">
        <div className="relative max-w-xl mx-auto">
          <div className="relative backdrop-blur-xl bg-white/80 p-1.5 rounded-full border border-white shadow-xl ring-1 ring-black/5">
            <input
              type="text"
              placeholder="Buscar enseñanza, predicador..."
              className="w-full pl-12 pr-6 py-3 bg-transparent rounded-full focus:bg-white focus:ring-2 focus:ring-amber-200 outline-none transition-all font-sans text-sm placeholder:text-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500/50 text-lg">
              🔍
            </span>
          </div>
        </div>

        {categories.length > 1 && (
          <div className="flex justify-center overflow-x-auto pb-2 no-scrollbar">
            <div className="flex gap-2 px-4 py-2 bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? "bg-amber-700 text-white shadow-lg scale-105"
                      : "bg-transparent text-gray-500 hover:bg-amber-100 hover:text-amber-800"
                  }`}
                >
                  {cat === "Todos"
                    ? "🎧 Ver todo"
                    : `${getCategoryIcon(cat)} ${cat}`}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        {loading ? (
          <div className="flex flex-col items-center py-20 opacity-50">
            <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mb-4" />
            <p className="text-xs uppercase tracking-widest">Cargando enseñanzas...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <span className="text-4xl block mb-4">🎧</span>
            <p className="text-sm">No se encontraron enseñanzas en esta categoría.</p>
            {(searchTerm || selectedCategory !== "Todos") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("Todos");
                }}
                className="mt-4 text-amber-600 underline text-sm"
              >
                Ver todo
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filtered.map((item, index) => (
              <EnsenanzaCard key={item.id} item={item} index={index} />
            ))}
          </div>
        )}
      </section>

      <footer className="bg-white/40 backdrop-blur-sm border-t border-amber-100 py-10 md:py-16 text-center">
        <img
          src="/icon-512.png"
          className="w-10 h-10 mx-auto mb-4 grayscale opacity-20"
          alt=""
        />
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 px-6 max-w-lg mx-auto">
          {AVISO_INSTITUCIONAL}
        </p>
      </footer>
    </main>
  );
}

function EnsenanzaCard({ item, index }: { item: Ensenanza; index: number }) {
  const audioReady = isAudioAvailable(item);
  const canShareAudio = hasTelegramShareUrl(item);
  const hasYoutube = !!item.youtube_url?.trim();
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const result = await shareEnsenanza(item);
    if (result === "copied") {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <article
      className="card-enter group flex flex-col overflow-hidden rounded-[2rem] border border-amber-50 bg-white shadow-lg transition-all duration-300 hover:border-amber-200 hover:shadow-xl"
      style={{ "--stagger": `${Math.min(index, 8) * 45}ms` } as React.CSSProperties}
    >
      <Link href={`/ensenanzas/${item.id}`} className="block p-6 sm:p-7 flex-1">
        <div className="flex items-start justify-between gap-3 mb-4">
          <span className="text-3xl">{getCategoryIcon(item.category)}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
            {item.category || "General"}
          </span>
        </div>

        <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug mb-3 group-hover:text-amber-800 transition-colors line-clamp-2">
          {item.title}
        </h2>

        {item.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-4 font-light">
            {item.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 text-[10px] text-gray-400 uppercase tracking-wider font-bold">
          {item.predicador && <span>👤 {item.predicador}</span>}
          {item.fecha && <span>📅 {item.fecha}</span>}
          {item.duration && <span>⏱ {item.duration}</span>}
        </div>
      </Link>

      <div className="px-6 sm:px-7 pb-6 sm:pb-7 pt-0 space-y-2">
        {audioReady ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              openExternalUrl(item.telegram_url!);
            }}
            className="btn-telegram w-full py-3 px-4 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <span className="sm:hidden">🎧 Escuchar en Telegram</span>
            <span className="hidden sm:inline">🎧 Escuchar enseñanza en Telegram</span>
          </button>
        ) : (
          <div className="w-full py-3 px-4 bg-gray-100 text-gray-500 rounded-2xl text-xs sm:text-sm font-bold text-center border border-gray-200">
            Audio próximamente disponible
          </div>
        )}

        {hasYoutube && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              openExternalUrl(item.youtube_url!);
            }}
            className="w-full py-2.5 px-4 bg-white border border-red-200 text-red-700 hover:bg-red-50 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
          >
            ▶ Ver video
          </button>
        )}

        {canShareAudio ? (
          <>
            <button
              type="button"
              onClick={handleShare}
              className="btn-share-audio w-full min-h-[44px] py-2.5 px-4 bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              📤 Compartir audio
            </button>
            {copied && (
              <p className="text-center text-[10px] font-bold text-green-700 bg-green-50 py-2 px-3 rounded-xl animate-in fade-in duration-200">
                Enlace copiado para compartir.
              </p>
            )}
          </>
        ) : (
          <div
            className="w-full min-h-[44px] py-2.5 px-4 bg-gray-50 border border-gray-200 text-gray-400 rounded-2xl text-xs font-bold text-center flex items-center justify-center"
            aria-disabled="true"
          >
            Audio aún no disponible
          </div>
        )}

        <Link
          href={`/ensenanzas/${item.id}`}
          className="block text-center text-[10px] font-bold uppercase tracking-widest text-amber-600 hover:text-amber-800 pt-1"
        >
          Ver detalle →
        </Link>
      </div>
    </article>
  );
}
