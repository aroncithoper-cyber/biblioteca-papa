import type { PushTemplateId } from "@/lib/pushTemplates";
import {
  PUSH_MESSAGE_BANK,
  type PushMessage,
  type PushMessageCategory,
} from "@/lib/pushMessages";

const STORAGE_PREFIX = "push-msg-last-index-";

const TEMPLATE_TO_CATEGORY: Record<PushTemplateId, PushMessageCategory> = {
  general: "aviso_general",
  sabado: "preparacion_sabado",
  aliento: "palabra_aliento",
  ensenanza: "nueva_ensenanza",
  biblioteca: "nuevo_material",
};

export function getCategoryForTemplate(templateId: string): PushMessageCategory {
  if (!templateId) return "aviso_general";
  return TEMPLATE_TO_CATEGORY[templateId as PushTemplateId] ?? "aviso_general";
}

export function getMessageCount(category: PushMessageCategory): number {
  return PUSH_MESSAGE_BANK[category]?.length ?? 0;
}

export function pickRandomPushMessage(category: PushMessageCategory): PushMessage | null {
  const messages = PUSH_MESSAGE_BANK[category];
  if (!messages?.length) return null;

  let lastIndex = -1;
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(`${STORAGE_PREFIX}${category}`);
      if (stored !== null) {
        const parsed = parseInt(stored, 10);
        if (!Number.isNaN(parsed)) lastIndex = parsed;
      }
    } catch {
      // Ignorar errores de almacenamiento local.
    }
  }

  let nextIndex = 0;
  if (messages.length === 1) {
    nextIndex = 0;
  } else {
    do {
      nextIndex = Math.floor(Math.random() * messages.length);
    } while (nextIndex === lastIndex);
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${category}`, String(nextIndex));
    } catch {
      // Ignorar errores de almacenamiento local.
    }
  }

  return messages[nextIndex];
}

export function pickSuggestedPushMessage(templateId: string): PushMessage | null {
  const category = getCategoryForTemplate(templateId);
  return pickRandomPushMessage(category);
}
