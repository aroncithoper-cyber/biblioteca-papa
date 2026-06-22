/** Detección de entorno para modo compatible PDF en Android PWA. */

export function isAndroidDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** Android con la app instalada como PWA. */
export function isAndroidPwa(): boolean {
  return isAndroidDevice() && isStandalonePwa();
}

export function isIosDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/** Layout móvil con FlipbookViewer (iPhone, Android Chrome, pantallas pequeñas). */
export function isMobileFlipbookLayout(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(max-width: 767px)").matches ||
    isIosDevice() ||
    isAndroidDevice()
  );
}
