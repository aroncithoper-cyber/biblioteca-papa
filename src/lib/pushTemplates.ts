export type PushTemplateId =
  | "general"
  | "sabado"
  | "aliento"
  | "ensenanza"
  | "biblioteca";

export interface PushTemplate {
  id: PushTemplateId;
  label: string;
  title: string;
  body: string;
}

export const PUSH_TEMPLATES: PushTemplate[] = [
  {
    id: "general",
    label: "Aviso general",
    title: "Aviso importante",
    body: "Paz a vos. Tenemos un aviso importante para compartir contigo desde Consejero del Obrero.",
  },
  {
    id: "sabado",
    label: "Preparación para el sábado",
    title: "Preparémonos para el santo sábado",
    body: "Paz a vos. Que este día sea de preparación, reflexión y gratitud delante de Dios. Te invitamos a apartar un momento para meditar, orar y disponer el corazón para el día de reposo.",
  },
  {
    id: "aliento",
    label: "Palabra de aliento",
    title: "Palabra para este día",
    body: "Paz a vos. Que este día sea de bendición, descanso y edificación espiritual. Aprovecha este tiempo para acercarte a Dios, escuchar su Palabra y fortalecer tu fe.",
  },
  {
    id: "ensenanza",
    label: "Nueva enseñanza disponible",
    title: "Nueva enseñanza disponible",
    body: "Ya está disponible una nueva enseñanza en audio para edificación espiritual. Puedes escucharla desde la sección Enseñanzas.",
  },
  {
    id: "biblioteca",
    label: "Nuevo material en biblioteca",
    title: "Nuevo material disponible",
    body: "Se ha agregado nuevo material de consulta en la Biblioteca. Ingresa a la plataforma para revisarlo.",
  },
];

export function getPushTemplate(id: string): PushTemplate | undefined {
  return PUSH_TEMPLATES.find((t) => t.id === id);
}
