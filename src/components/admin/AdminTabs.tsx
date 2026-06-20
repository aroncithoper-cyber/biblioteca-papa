"use client";

export type AdminTabId =
  | "libros"
  | "videos"
  | "ensenanzas"
  | "galeria"
  | "solicitudes"
  | "push";

const TABS: { id: AdminTabId; label: string }[] = [
  { id: "libros", label: "Libros" },
  { id: "videos", label: "Videos" },
  { id: "ensenanzas", label: "Enseñanzas" },
  { id: "galeria", label: "Galería" },
  { id: "solicitudes", label: "Solicitudes" },
  { id: "push", label: "Push" },
];

type AdminTabsProps = {
  activeTab: AdminTabId;
  onTabChange: (tab: AdminTabId) => void;
  counts: {
    libros: number;
    videos: number;
    ensenanzas: number;
    solicitudes: number;
  };
};

export default function AdminTabs({
  activeTab,
  onTabChange,
  counts,
}: AdminTabsProps) {
  const getCount = (id: AdminTabId) => {
    if (id === "libros") return counts.libros;
    if (id === "videos") return counts.videos;
    if (id === "ensenanzas") return counts.ensenanzas;
    if (id === "solicitudes") return counts.solicitudes;
    return undefined;
  };

  return (
    <nav
      aria-label="Secciones de administración"
      className="sticky top-[52px] md:top-[60px] z-40 -mx-4 md:-mx-6 px-4 md:px-6 py-3 bg-[#fcfaf7]/95 backdrop-blur-md border-b border-amber-100/80"
    >
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
        {TABS.map((tab) => {
          const count = getCount(tab.id);
          const isActive = activeTab === tab.id;
          const isPending = tab.id === "solicitudes" && count !== undefined && count > 0;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex-shrink-0 min-h-[44px] px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all active:scale-95 ${
                isActive
                  ? "bg-black text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-amber-200"
              }`}
            >
              {tab.label}
              {count !== undefined && count > 0 && (
                <span
                  className={`ml-1.5 inline-flex min-w-[20px] h-5 px-1.5 items-center justify-center rounded-full text-[10px] font-black ${
                    isActive
                      ? "bg-white/25 text-white"
                      : isPending
                        ? "bg-amber-500 text-white"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
