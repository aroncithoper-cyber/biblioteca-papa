export interface OptimizeImageOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  outputType?: "image/webp" | "image/jpeg";
}

export interface OptimizeImageResult {
  file: File;
  width: number;
  height: number;
  mimeType: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo cargar la imagen"));
    };
    img.src = url;
  });
}

function computeDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let w = width;
  let h = height;

  if (w <= maxWidth && h <= maxHeight) {
    return { width: w, height: h };
  }

  const ratio = w / h;
  if (w > maxWidth) {
    w = maxWidth;
    h = Math.round(w / ratio);
  }
  if (h > maxHeight) {
    h = maxHeight;
    w = Math.round(h * ratio);
  }

  return { width: Math.max(1, w), height: Math.max(1, h) };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

function buildFileName(originalName: string, ext: string): string {
  const base =
    originalName
      .replace(/\.[^.]+$/, "")
      .replace(/[^\w.\-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "portada";
  return `${base}.${ext}`;
}

function isWebpSupported(): boolean {
  if (typeof document === "undefined") return false;
  const canvas = document.createElement("canvas");
  return canvas.toDataURL("image/webp").startsWith("data:image/webp");
}

export async function optimizeImageForUpload(
  file: File,
  options: OptimizeImageOptions
): Promise<OptimizeImageResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo no es una imagen");
  }

  const img = await loadImageFromFile(file);
  const { width, height } = computeDimensions(
    img.naturalWidth,
    img.naturalHeight,
    options.maxWidth,
    options.maxHeight
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");

  ctx.drawImage(img, 0, 0, width, height);

  const preferredType = options.outputType ?? "image/webp";
  let mimeType = preferredType;
  let blob: Blob | null = null;

  if (preferredType === "image/webp" && isWebpSupported()) {
    blob = await canvasToBlob(canvas, "image/webp", options.quality);
  }

  if (!blob) {
    mimeType = "image/jpeg";
    blob = await canvasToBlob(canvas, "image/jpeg", options.quality);
  }

  if (!blob) throw new Error("No se pudo convertir la imagen");

  const ext = mimeType === "image/webp" ? "webp" : "jpg";
  const optimizedFile = new File([blob], buildFileName(file.name, ext), {
    type: mimeType,
    lastModified: Date.now(),
  });

  return { file: optimizedFile, width, height, mimeType };
}

export const COVER_UPLOAD_OPTIONS: OptimizeImageOptions = {
  maxWidth: 1000,
  maxHeight: 1400,
  quality: 0.82,
  outputType: "image/webp",
};

export const GALLERY_UPLOAD_OPTIONS: OptimizeImageOptions = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.82,
  outputType: "image/webp",
};

export const GALLERY_THUMB_UPLOAD_OPTIONS: OptimizeImageOptions = {
  maxWidth: 500,
  maxHeight: 500,
  quality: 0.78,
  outputType: "image/webp",
};

export interface GalleryOptimizedFiles {
  main: File;
  thumb: File;
  originalSizeBytes: number;
  mainSizeBytes: number;
  thumbSizeBytes: number;
}

export async function optimizeGalleryForUpload(
  file: File
): Promise<GalleryOptimizedFiles> {
  const [mainResult, thumbResult] = await Promise.all([
    optimizeImageForUpload(file, GALLERY_UPLOAD_OPTIONS),
    optimizeImageForUpload(file, GALLERY_THUMB_UPLOAD_OPTIONS),
  ]);

  return {
    main: mainResult.file,
    thumb: thumbResult.file,
    originalSizeBytes: file.size,
    mainSizeBytes: mainResult.file.size,
    thumbSizeBytes: thumbResult.file.size,
  };
}
