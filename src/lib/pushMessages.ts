export type PushMessageCategory =
  | "preparacion_sabado"
  | "palabra_aliento"
  | "nueva_ensenanza"
  | "nuevo_material"
  | "aviso_general";

export interface PushMessage {
  title: string;
  body: string;
}

export type PushMessageBank = Record<PushMessageCategory, PushMessage[]>;

export const PUSH_MESSAGE_BANK: PushMessageBank = {
  preparacion_sabado: [
    {
      title: "Preparémonos para el santo sábado",
      body: "Paz a vos. Que este día sea de preparación, reflexión y gratitud delante de Dios. Dispongamos el corazón para recibir el día de reposo con reverencia y gratitud.",
    },
    {
      title: "Tiempo de preparación",
      body: "Paz a vos. Antes de iniciar el santo sábado, apartemos un momento para ordenar nuestro corazón, nuestra casa y nuestros pensamientos delante de Dios.",
    },
    {
      title: "Acerquémonos con gratitud",
      body: "Paz a vos. Que este tiempo de preparación nos ayude a dejar las cargas de la semana y acercarnos a Dios con un corazón dispuesto.",
    },
    {
      title: "Preparemos el corazón",
      body: "Paz a vos. El día de reposo es una oportunidad para renovar nuestra fe, escuchar la Palabra y fortalecer nuestra comunión con Dios.",
    },
    {
      title: "Preparación espiritual",
      body: "Paz a vos. Que este día sea propicio para meditar, orar y preparar nuestro espíritu para el santo sábado.",
    },
    {
      title: "Un día de reposo se acerca",
      body: "Paz a vos. Dediquemos este tiempo a la reflexión, la oración y la gratitud, dejando a un lado las distracciones que nos apartan de Dios.",
    },
    {
      title: "Ordenemos nuestra semana",
      body: "Paz a vos. Antes del santo sábado, conviene revisar nuestras prioridades, nuestra actitud y nuestro corazón delante del Señor.",
    },
    {
      title: "Momento de quietud",
      body: "Paz a vos. Busquemos un instante de quietud para meditar en la Palabra y disponernos con reverencia para el día de reposo.",
    },
    {
      title: "Gratitud antes del reposo",
      body: "Paz a vos. Recordemos con gratitud las bendiciones recibidas y acerquémonos a Dios con humildad en este tiempo de preparación.",
    },
    {
      title: "Dispongamos el espíritu",
      body: "Paz a vos. Que este día nos ayude a apartar lo innecesario y fortalecer nuestro espíritu para recibir el santo sábado.",
    },
    {
      title: "Reflexión y oración",
      body: "Paz a vos. Te invitamos a meditar, orar y preparar tu corazón para honrar el día de reposo con reverencia y obediencia.",
    },
    {
      title: "Preparémonos juntos",
      body: "Paz a vos. Que este tiempo sea de edificación para toda la congregación, disponiendo mente y corazón para el santo sábado.",
    },
    {
      title: "Cerca del día de reposo",
      body: "Paz a vos. Aprovechemos estas horas para dejar atrás el afán de la semana y acercarnos a Dios con fe y gratitud.",
    },
    {
      title: "Renovemos nuestra fe",
      body: "Paz a vos. El santo sábado nos recuerda la fidelidad de Dios. Preparemos el corazón para recibirlo con gozo reverente.",
    },
    {
      title: "Tiempo de consagración",
      body: "Paz a vos. Que este día sea de consagración personal: oración, estudio y disposición para guardar el reposo del Señor.",
    },
  ],
  palabra_aliento: [
    {
      title: "Palabra de aliento",
      body: "Paz a vos. Que la Palabra de Dios fortalezca tu corazón y te ayude a caminar con fe, paciencia y esperanza en este día.",
    },
    {
      title: "Fortalece tu fe",
      body: "Paz a vos. Aun en medio de las cargas, Dios permite momentos de consuelo para renovar nuestra confianza en Él.",
    },
    {
      title: "Dios es nuestro amparo",
      body: "Paz a vos. Que este día recuerdes que Dios es refugio, fortaleza y ayuda para quienes le buscan con sinceridad.",
    },
    {
      title: "Camina con esperanza",
      body: "Paz a vos. Que tu ánimo sea renovado y tu corazón permanezca firme en la obediencia y la fe.",
    },
    {
      title: "Un momento para meditar",
      body: "Paz a vos. Aparta un instante para escuchar, meditar y fortalecer tu espíritu con la enseñanza de la Palabra.",
    },
    {
      title: "Palabra para este día",
      body: "Paz a vos. Que este día sea de bendición, descanso y edificación espiritual. Acércate a Dios y fortalece tu fe.",
    },
    {
      title: "Consuelo en la Palabra",
      body: "Paz a vos. Cuando el ánimo flaquea, la Palabra de Dios sigue siendo luz, guía y consuelo para el corazón obediente.",
    },
    {
      title: "No camines solo",
      body: "Paz a vos. Recuerda que Dios acompaña a quienes le buscan con sinceridad. Confía en Él y sigue adelante con fe.",
    },
    {
      title: "Renovación espiritual",
      body: "Paz a vos. Aprovecha este día para alimentar tu espíritu, meditar en la verdad y fortalecer tu confianza en Dios.",
    },
    {
      title: "Firmeza y paciencia",
      body: "Paz a vos. Que la fe te sostenga en la prueba y la paciencia te ayude a caminar con obediencia y esperanza.",
    },
    {
      title: "Luz para el camino",
      body: "Paz a vos. La Palabra de Dios ilumina nuestro camino. Tómate un momento para escucharla y edificarte en ella.",
    },
    {
      title: "Ánimo para hoy",
      body: "Paz a vos. Que este mensaje sea un recordatorio de que Dios cuida de los suyos y fortalece a quienes confían en Él.",
    },
    {
      title: "Descanso para el alma",
      body: "Paz a vos. En medio del trabajo y las responsabilidades, busca también descanso espiritual en la Palabra y la oración.",
    },
    {
      title: "Confía y persevera",
      body: "Paz a vos. Perseverar en la fe también es parte del caminar cristiano. Dios honra la obediencia sincera.",
    },
    {
      title: "Edificación diaria",
      body: "Paz a vos. Pequeños momentos de estudio y reflexión pueden fortalecer mucho el corazón a lo largo del día.",
    },
  ],
  nueva_ensenanza: [
    {
      title: "Nueva enseñanza disponible",
      body: "Paz a vos. Ya está disponible una nueva enseñanza en audio para edificación espiritual. Puedes escucharla desde la sección Enseñanzas.",
    },
    {
      title: "Audio de edificación",
      body: "Paz a vos. Se ha agregado un nuevo audio de enseñanza. Puedes escucharlo en Telegram y compartirlo con otros hermanos para edificación.",
    },
    {
      title: "Nueva predicación en audio",
      body: "Paz a vos. Hay una nueva predicación disponible para escuchar durante tu camino, trabajo o actividades diarias.",
    },
    {
      title: "Escucha una nueva enseñanza",
      body: "Paz a vos. Te invitamos a escuchar la nueva enseñanza disponible en la plataforma y en el canal de audios.",
    },
    {
      title: "Material de audio agregado",
      body: "Paz a vos. Se ha agregado nuevo material en audio para fortalecer el estudio y la edificación espiritual.",
    },
    {
      title: "Enseñanza para escuchar",
      body: "Paz a vos. Ingresa a la sección Enseñanzas y escucha el audio disponible. Puedes continuar escuchando incluso con la pantalla bloqueada.",
    },
    {
      title: "Audio disponible en Telegram",
      body: "Paz a vos. La enseñanza se abre en Telegram para mayor comodidad. Escúchala en tu camino o mientras realizas tus actividades.",
    },
    {
      title: "Nuevo audio espiritual",
      body: "Paz a vos. Hay una enseñanza reciente disponible para edificación. Compártela con respeto y propósito espiritual.",
    },
    {
      title: "Palabra en audio",
      body: "Paz a vos. Aprovecha este recurso en audio para meditar en la enseñanza y fortalecer tu fe durante el día.",
    },
    {
      title: "Contenido de Enseñanzas",
      body: "Paz a vos. Se ha publicado nuevo contenido en audio. Revísalo desde Enseñanzas cuando tengas oportunidad.",
    },
    {
      title: "Escucha y edifica",
      body: "Paz a vos. Te invitamos a escuchar la enseñanza disponible y usar este tiempo para edificación personal y congregacional.",
    },
    {
      title: "Predicación reciente",
      body: "Paz a vos. Ya puedes escuchar la predicación agregada recientemente desde la plataforma Consejero del Obrero.",
    },
    {
      title: "Recurso en audio",
      body: "Paz a vos. Hay una enseñanza en audio lista para escuchar. Ideal para el trayecto, el trabajo o el descanso.",
    },
    {
      title: "Actualización de Enseñanzas",
      body: "Paz a vos. La sección Enseñanzas cuenta con un audio nuevo. Escúchalo y compártelo con edificación.",
    },
    {
      title: "Mensaje en audio",
      body: "Paz a vos. Se ha agregado una enseñanza para escuchar con comodidad desde Telegram. Bendiciones en tu estudio.",
    },
  ],
  nuevo_material: [
    {
      title: "Nuevo material disponible",
      body: "Paz a vos. Se ha agregado nuevo material de consulta en la Biblioteca. Ingresa a la plataforma para revisarlo.",
    },
    {
      title: "Biblioteca actualizada",
      body: "Paz a vos. La Biblioteca cuenta con nuevo material disponible para consulta y estudio.",
    },
    {
      title: "Nuevo libro agregado",
      body: "Paz a vos. Se ha agregado un nuevo recurso en la Biblioteca para apoyar el estudio y la preparación.",
    },
    {
      title: "Material para consulta",
      body: "Paz a vos. Hay nuevo contenido disponible en la Biblioteca. Puedes ingresar a revisarlo cuando tengas oportunidad.",
    },
    {
      title: "Recurso disponible",
      body: "Paz a vos. Se ha añadido nuevo material de edificación y consulta en la plataforma.",
    },
    {
      title: "Consulta en Biblioteca",
      body: "Paz a vos. Ingresa a la Biblioteca para revisar el material recién agregado y utilizarlo con fines de estudio.",
    },
    {
      title: "Nuevo volumen disponible",
      body: "Paz a vos. Se ha publicado un nuevo recurso en la Biblioteca. Revísalo cuando puedas y úsalo con respeto y edificación.",
    },
    {
      title: "Material de estudio",
      body: "Paz a vos. Hay nuevo contenido disponible para consulta. Te invitamos a revisarlo desde la sección Biblioteca.",
    },
    {
      title: "Biblioteca ampliada",
      body: "Paz a vos. La plataforma cuenta con material adicional para apoyar tu preparación y estudio espiritual.",
    },
    {
      title: "Recurso para lectura",
      body: "Paz a vos. Se ha agregado un recurso de consulta en la Biblioteca. Ingresa con tu correo registrado para revisarlo.",
    },
    {
      title: "Contenido reciente",
      body: "Paz a vos. Hay nuevo material disponible en la plataforma. Puedes consultarlo desde Biblioteca cuando tengas tiempo.",
    },
    {
      title: "Actualización de Biblioteca",
      body: "Paz a vos. Se ha añadido contenido reciente para consulta y edificación. Revísalo con discreción y respeto.",
    },
    {
      title: "Material agregado",
      body: "Paz a vos. La Biblioteca se ha actualizado con nuevo material. Te invitamos a ingresar y revisarlo.",
    },
    {
      title: "Para tu estudio",
      body: "Paz a vos. Hay un recurso nuevo disponible para consulta. Utilízalo conforme al propósito para el que fue compartido.",
    },
    {
      title: "Nuevo acceso de lectura",
      body: "Paz a vos. Revisa la Biblioteca para conocer el material recién agregado y aprovecharlo en tu estudio.",
    },
  ],
  aviso_general: [
    {
      title: "Aviso importante",
      body: "Paz a vos. Tenemos un aviso importante para compartir contigo desde Consejero del Obrero.",
    },
    {
      title: "Mensaje para los hermanos",
      body: "Paz a vos. Te invitamos a revisar la plataforma para estar atento al material y avisos disponibles.",
    },
    {
      title: "Consejero del Obrero",
      body: "Paz a vos. Hay información disponible en la plataforma que puede ser de utilidad para tu estudio y edificación.",
    },
    {
      title: "Atento a la plataforma",
      body: "Paz a vos. Te invitamos a ingresar a Consejero del Obrero para revisar el contenido disponible.",
    },
    {
      title: "Aviso de edificación",
      body: "Paz a vos. Se ha compartido un aviso para apoyo, orden y edificación dentro de la plataforma.",
    },
    {
      title: "Información disponible",
      body: "Paz a vos. Hay un aviso reciente en la plataforma. Te invitamos a revisarlo cuando tengas oportunidad.",
    },
    {
      title: "Mensaje de la plataforma",
      body: "Paz a vos. Consejero del Obrero tiene un aviso para compartir contigo. Ingresa para revisarlo.",
    },
    {
      title: "Para tu atención",
      body: "Paz a vos. Te invitamos a estar atento al contenido y avisos publicados en la plataforma.",
    },
    {
      title: "Recordatorio",
      body: "Paz a vos. Revisa la plataforma para mantenerte informado sobre el material y avisos disponibles.",
    },
    {
      title: "Aviso congregacional",
      body: "Paz a vos. Hay información compartida para apoyo y edificación. Puedes revisarla en Consejero del Obrero.",
    },
    {
      title: "Comunicado",
      body: "Paz a vos. Se ha publicado un aviso en la plataforma. Te invitamos a leerlo con atención.",
    },
    {
      title: "Mantente informado",
      body: "Paz a vos. Ingresa a la plataforma para revisar avisos, material y recursos disponibles.",
    },
    {
      title: "Desde Consejero del Obrero",
      body: "Paz a vos. Tenemos un mensaje para compartir contigo. Revisa la plataforma cuando puedas.",
    },
    {
      title: "Aviso para la iglesia",
      body: "Paz a vos. Se ha compartido un aviso de interés general. Puedes consultarlo en la plataforma.",
    },
    {
      title: "Revisa la plataforma",
      body: "Paz a vos. Hay contenido y avisos disponibles que pueden ser de utilidad para tu estudio y edificación.",
    },
  ],
};
