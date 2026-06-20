import { formatFileSize } from "@/lib/imageOptimize";

export const PDF_WARNING_MB = 20;
export const PDF_STRONG_WARNING_MB = 40;

export type PdfWarningLevel = "ok" | "warning" | "strong";

export function getPdfWarningLevel(sizeBytes: number): PdfWarningLevel {
  const mb = sizeBytes / (1024 * 1024);
  if (mb > PDF_STRONG_WARNING_MB) return "strong";
  if (mb > PDF_WARNING_MB) return "warning";
  return "ok";
}

export function getPdfWarningMessage(level: PdfWarningLevel): string | null {
  if (level === "warning") {
    return "Este PDF pesa más de 20 MB. Conviene comprimirlo antes de subir para ahorrar datos y mejorar la carga.";
  }
  if (level === "strong") {
    return "Advertencia: este PDF es muy pesado. Puede consumir más datos y tardar en cargar. Se recomienda comprimirlo antes de subir.";
  }
  return null;
}

export function getPdfFileMetadata(file: File) {
  const warningLevel = getPdfWarningLevel(file.size);
  return {
    sizeBytes: file.size,
    label: formatFileSize(file.size),
    warningLevel,
    warningMessage: getPdfWarningMessage(warningLevel),
  };
}
