"use client";

import { useCallback, useEffect, useState } from "react";

const DISMISS_KEY = "pwa-update-dismissed";

export default function PwaUpdateBanner() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [visible, setVisible] = useState(false);

  const showUpdate = useCallback((worker: ServiceWorker | null) => {
    if (!worker) return;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(DISMISS_KEY)) {
      return;
    }
    setWaitingWorker(worker);
    setVisible(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let refreshing = false;

    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const attachRegistration = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting) {
        showUpdate(registration.waiting);
      }

      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        if (!installing) return;

        installing.addEventListener("statechange", () => {
          if (
            installing.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            showUpdate(registration.waiting ?? installing);
          }
        });
      });
    };

    navigator.serviceWorker
      .getRegistration("/sw.js")
      .then((existing) => {
        if (existing) {
          attachRegistration(existing);
          existing.update().catch(() => {});
          return existing;
        }
        return navigator.serviceWorker.register("/sw.js");
      })
      .then((registration) => {
        if (registration) attachRegistration(registration);
      })
      .catch(() => {});

    const onFocus = () => {
      navigator.serviceWorker.getRegistration("/sw.js").then((reg) => {
        reg?.update().catch(() => {});
      });
    };

    window.addEventListener("focus", onFocus);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      window.removeEventListener("focus", onFocus);
    };
  }, [showUpdate]);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
      return;
    }
    window.location.reload();
  };

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-24 left-4 right-4 z-[85] mx-auto max-w-lg animate-in slide-in-from-bottom-4 fade-in duration-300 sm:bottom-4 md:left-auto md:right-6 md:max-w-md"
    >
      <div className="rounded-2xl border border-amber-200/80 bg-white/95 p-4 shadow-xl backdrop-blur-md ring-1 ring-amber-100/60">
        <p className="text-sm font-bold text-gray-900 leading-snug">
          Hay una nueva versión de Consejero disponible.
        </p>
        <p className="mt-1 text-xs text-gray-500 leading-relaxed">
          Actualiza para ver las mejoras más recientes.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleUpdate}
            className="btn-premium min-h-[44px] flex-1 rounded-xl bg-black px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-amber-700 active:scale-[0.98] sm:flex-none"
          >
            Actualizar
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="min-h-[44px] flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-50 active:scale-[0.98] sm:flex-none"
          >
            Después
          </button>
        </div>
      </div>
    </div>
  );
}
