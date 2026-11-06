/**
 * EJEMPLO
 * --------
 * Clínicas, correos y cifras ficticias para desarrollar el tablero
 * sin backend. No son contactos reales.
 *
 * La UI los anuncia como "Datos de ejemplo" mientras no haya
 * client ID, ID de la hoja y correo autorizado. Al recargar, vuelven a este archivo.
 */
import { DISCARD_STATO, statoForPhase } from "@/lib/stato-map";
import type { Contact, EmailFormat, SentEmail } from "@/lib/types";

export const EXAMPLE_TAG = "EJEMPLO" as const;

export const EXAMPLE_FROM = "ana.soto@tramo.ejemplo";

export const EXAMPLE_EMAIL_FORMATS: EmailFormat[] = [
  { id: "formato_a", name: "Formato A" },
  { id: "formato_b", name: "Formato B" },
  { id: "video_linkedin", name: "Video LinkedIn" },
  { id: "formato_actual", name: "Formato actual" },
];

const formatName = (id: string) =>
  EXAMPLE_EMAIL_FORMATS.find((format) => format.id === id)?.name ?? id;

function zoho(thread: string) {
  return `https://mail.zoho.com/zm/#mail/folder/inbox/thread/ejemplo-${thread}`;
}

type Seed = {
  contact: Contact;
  email?: SentEmail;
};

function row(input: {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  clinic?: string | null;
  phase: Contact["phase"];
  formatId?: string | null;
  subject?: string | null;
  body?: string | null;
  sentAt?: string | null;
  zoho?: string | null;
  outcome?: Contact["outcome"];
  followup?: string | null;
  createdAt: string;
  updatedAt?: string;
}): Seed {
  const formatId = input.formatId ?? null;
  const sentAt = input.sentAt ?? null;
  const subject = input.subject ?? null;
  const contact: Contact = {
    id: input.id,
    name: input.name,
    email: input.email,
    company: input.company ?? null,
    clinic: input.clinic ?? null,
    subject,
    phase: input.phase,
    email_format_id: formatId,
    email_format_name: formatId ? formatName(formatId) : null,
    sent_email_url: input.zoho ?? null,
    sent_at: sentAt,
    created_at: input.createdAt,
    updated_at: input.updatedAt ?? input.createdAt,
    outcome: input.outcome ?? null,
    next_followup_at: input.followup ?? null,
    sheetStato: input.outcome === "descartado" ? DISCARD_STATO : statoForPhase(input.phase),
  };

  if (!subject && !input.body && !sentAt) {
    return { contact };
  }

  return {
    contact,
    email: {
      subject: subject ?? "(Sin asunto)",
      body: input.body ?? "",
      sent_at: sentAt,
      email_format_name: contact.email_format_name,
      from_address: EXAMPLE_FROM,
      sent_email_url: contact.sent_email_url,
    },
  };
}

const SEEDS: Seed[] = [
  row({
    id: "6f0a9c31-7e2b-4c88-9d14-000000000001",
    name: "Amanda Solís",
    email: "amanda.solis@gruporoble.cl",
    company: "Grupo Roble SpA",
    clinic: "Clínica Roble",
    phase: "nuevo",
    createdAt: "2026-10-28T13:00:00.000Z",
  }),
  row({
    id: "6f0a9c31-7e2b-4c88-9d14-000000000002",
    name: "Ignacio Paredes",
    email: "ignacio@consultaparedes.cl",
    clinic: "Consulta Paredes",
    phase: "nuevo",
    createdAt: "2026-10-29T16:20:00.000Z",
  }),
  row({
    id: "6f0a9c31-7e2b-4c88-9d14-000000000012",
    name: "Renata Campos",
    email: "renata.campos@clinicaaustral.cl",
    clinic: "Clínica Austral",
    phase: "nuevo",
    createdAt: "2026-10-30T11:05:00.000Z",
  }),
  row({
    id: "6f0a9c31-7e2b-4c88-9d14-000000000003",
    name: "Valentina Mora",
    email: "valentina.mora@cordillera.cl",
    company: "Cordillera Dental SpA",
    clinic: "Clínica Cordillera",
    phase: "contactado",
    formatId: "formato_a",
    subject: "Horas que se caen el mismo día en Clínica Cordillera",
    body: "Hola Valentina,\n\nsoy Ana, de Tramo. Vi que Clínica Cordillera atiende en Providencia y quería contarte cómo otras clínicas están llenando las horas que se cancelan el mismo día.\n\n¿Te parece si te dejo un caso de dos minutos o lo vemos en una llamada corta esta semana?\n\nAna Soto\nTramo",
    sentAt: "2026-10-12T15:10:00.000Z",
    zoho: zoho("cordillera"),
    followup: "2026-11-04T15:00:00.000Z",
    createdAt: "2026-10-10T12:00:00.000Z",
    updatedAt: "2026-10-12T15:10:00.000Z",
  }),
  row({
    id: "6f0a9c31-7e2b-4c88-9d14-000000000004",
    name: "Pedro Sáez",
    email: "pedro.saez@cmnunoa.cl",
    clinic: "Centro Médico Ñuñoa",
    phase: "contactado",
    formatId: "formato_b",
    subject: "Pedro, una pregunta breve sobre la agenda de Ñuñoa",
    body: "Hola Pedro,\n\n¿quién mira hoy las horas vacías del Centro Médico Ñuñoa?\n\nTrabajo en Tramo. Ayudamos a clínicas a recuperar esas horas sin sumar otra planilla. Si te interesa, te mando el detalle en cinco líneas.\n\nAna",
    sentAt: "2026-10-14T18:40:00.000Z",
    createdAt: "2026-10-14T18:00:00.000Z",
    updatedAt: "2026-10-14T18:40:00.000Z",
  }),
  row({
    id: "6f0a9c31-7e2b-4c88-9d14-00000000000f",
    name: "Marcela Ibáñez",
    email: "marcela.ibanez@clinicabiobio.cl",
    clinic: "Clínica Biobío",
    phase: "contactado",
    formatId: "formato_actual",
    subject: "Agenda de Clínica Biobío y los no-show del lunes",
    body: "Hola Marcela,\n\neste es el formato que estamos usando esta semana. En clínicas del tamaño de Biobío, el recordatorio de la noche anterior baja los no-show sin que recepción tenga que llamar uno por uno.\n\n¿Lo ves con quien lleva la agenda?\n\nAna Soto\nTramo",
    sentAt: "2026-10-18T14:00:00.000Z",
    zoho: zoho("biobio"),
    outcome: "rebotado",
    followup: "2026-10-28T12:00:00.000Z",
    createdAt: "2026-10-18T13:10:00.000Z",
    updatedAt: "2026-10-22T09:30:00.000Z",
  }),
  row({
    id: "6f0a9c31-7e2b-4c88-9d14-000000000005",
    name: "Laura Méndez",
    email: "laura.mendez@pacificosalud.cl",
    company: "Pacífico Salud Ltda.",
    clinic: "Clínica Pacífico",
    phase: "primer_recordatorio",
    formatId: "formato_actual",
    subject: "Re: recordatorio para Clínica Pacífico",
    body: "Hola Laura,\n\nte escribo de nuevo porque el lunes pasado te mandé cómo Pacífico Salud podría confirmar las horas del día siguiente sin sumar llamadas.\n\nSi esta semana no es buen momento, dime y lo dejo quieto. Si sí, tengo un hueco el jueves.\n\nAna Soto\nTramo",
    sentAt: "2026-10-20T13:25:00.000Z",
    zoho: zoho("pacifico"),
    followup: "2026-11-06T13:30:00.000Z",
    createdAt: "2026-10-08T15:00:00.000Z",
    updatedAt: "2026-10-20T13:25:00.000Z",
  }),
  row({
    id: "6f0a9c31-7e2b-4c88-9d14-000000000006",
    name: "Ricardo Núñez",
    email: "ricardo.nunez@dentalalameda.cl",
    clinic: "Dental Alameda",
    phase: "primer_recordatorio",
    subject: "Seguimiento Dental Alameda",
    body: "Hola Ricardo,\n\nquedo atenta a lo de Dental Alameda. Este correo salió sin una plantilla cargada: lo armé a mano después de que me pasaran tu nombre en el congreso.\n\n¿Sigue en pie que lo veas con la encargada de recepción?\n\nAna",
    sentAt: "2026-10-21T19:05:00.000Z",
    zoho: zoho("alameda"),
    createdAt: "2026-10-16T19:00:00.000Z",
    updatedAt: "2026-10-21T19:05:00.000Z",
  }),
  row({
    id: "6f0a9c31-7e2b-4c88-9d14-000000000010",
    name: "Sofía Alarcón",
    email: "sofia.alarcon@reddelvalle.cl",
    company: "Red del Valle",
    clinic: "Maternidad del Valle",
    phase: "primer_recordatorio",
    subject: "Confirmaciones en Maternidad del Valle",
    body: "Hola Sofía,\n\nen Red del Valle las horas de control se confirman todavía por teléfono. Te dejo el mismo relato que le conté a tu colega, sin plantilla: un recordatorio corto la noche anterior y la recepción solo llama a quien no responde.\n\n¿Te sirve verlo con un ejemplo de una semana?\n\nAna Soto",
    sentAt: "2026-10-22T16:45:00.000Z",
    createdAt: "2026-10-15T16:00:00.000Z",
    updatedAt: "2026-10-22T16:45:00.000Z",
  }),
  row({
    id: "6f0a9c31-7e2b-4c88-9d14-000000000007",
    name: "Fernanda Lagos",
    email: "fernanda.lagos@costanera.cl",
    company: "Grupo Costanera",
    clinic: "Clínica Costanera",
    phase: "segundo_recordatorio",
    formatId: "video_linkedin",
    subject: "El video de la recepción en Costanera",
    body: "Hola Fernanda,\n\nte dejo el video que publiqué en LinkedIn: son 70 segundos de cómo una recepción deja de perseguir confirmaciones. Lo grabamos con una clínica parecida a Costanera, tres boxes y agenda llena los lunes.\n\nSi quieres, lo vemos juntas y te muestro la parte que no entra en el video.\n\nAna Soto\nTramo",
    sentAt: "2026-10-17T12:15:00.000Z",
    zoho: zoho("costanera"),
    createdAt: "2026-10-05T12:00:00.000Z",
    updatedAt: "2026-10-24T12:15:00.000Z",
  }),
  row({
    id: "6f0a9c31-7e2b-4c88-9d14-000000000008",
    name: "Hugo Beltrán",
    email: "hugo.beltran@cesfamnorte.cl",
    company: "Corporación de Salud Norte",
    clinic: "CESFAM Norte",
    phase: "segundo_recordatorio",
    formatId: "formato_a",
    subject: "Segundo mensaje para CESFAM Norte",
    body: "Hola Hugo,\n\nhace diez días te escribí por las horas perdidas en CESFAM Norte. Te mando este segundo correo por si el primero quedó en otra bandeja.\n\nSi el tema no está en la mesa este trimestre, lo cierro de mi lado sin problema.\n\nAna Soto\nTramo",
    sentAt: "2026-10-19T15:30:00.000Z",
    zoho: zoho("cesfam-norte"),
    outcome: "descartado",
    createdAt: "2026-10-06T15:00:00.000Z",
    updatedAt: "2026-10-25T18:00:00.000Z",
  }),
  row({
    id: "6f0a9c31-7e2b-4c88-9d14-000000000011",
    name: "Andrés Quiroga",
    email: "andres.quiroga@consultoriolaflorida.cl",
    clinic: "Consultorio La Florida",
    phase: "segundo_recordatorio",
    formatId: "formato_b",
    subject: "¿Seguimos con el consultorio de La Florida?",
    body: "Hola Andrés,\n\nversión corta: Tramo confirma las horas por mensaje y tu equipo solo llama a quien no contesta.\n\n¿Lo ves esta semana o lo retomo en noviembre?\n\nAna",
    sentAt: "2026-10-23T20:10:00.000Z",
    zoho: zoho("la-florida"),
    followup: "2026-11-07T16:00:00.000Z",
    createdAt: "2026-10-11T20:00:00.000Z",
    updatedAt: "2026-10-23T20:10:00.000Z",
  }),
  row({
    id: "6f0a9c31-7e2b-4c88-9d14-000000000009",
    name: "Carla Espinoza",
    email: "carla.espinoza@losaromos.cl",
    company: "Aromos SpA",
    clinic: "Clínica Los Aromos",
    phase: "tercer_recordatorio_cierre",
    formatId: "formato_b",
    subject: "Cierro el ciclo con Clínica Los Aromos",
    body: "Hola Carla,\n\neste es el tercer correo y el último que te mando en este ciclo. Si recuperar las horas de Los Aromos no es prioridad ahora, lo dejo archivado.\n\nSi quieres retomarlo, responde a este mensaje y agendamos veinte minutos.\n\nAna Soto\nTramo",
    sentAt: "2026-10-26T14:50:00.000Z",
    zoho: zoho("los-aromos"),
    followup: "2026-11-03T16:00:00.000Z",
    createdAt: "2026-10-01T14:00:00.000Z",
    updatedAt: "2026-10-26T14:50:00.000Z",
  }),
  row({
    id: "6f0a9c31-7e2b-4c88-9d14-00000000000a",
    name: "Diego Fuentes",
    email: "diego.fuentes@institutodeldolor.cl",
    clinic: "Instituto del Dolor",
    phase: "tercer_recordatorio_cierre",
    formatId: "formato_actual",
    subject: "Último intento: Instituto del Dolor",
    body: "Hola Diego,\n\nlos dos correos anteriores volvieron. Te escribo una vez más al mismo correo del Instituto del Dolor por si hay otra dirección de la persona que lleva la agenda.\n\nSi este también rebota, lo marco y no insisto.\n\nAna Soto\nTramo",
    sentAt: "2026-10-27T11:20:00.000Z",
    outcome: "rebotado",
    createdAt: "2026-10-09T11:00:00.000Z",
    updatedAt: "2026-10-27T17:40:00.000Z",
  }),
  row({
    id: "6f0a9c31-7e2b-4c88-9d14-00000000000b",
    name: "Jimena Ortiz",
    email: "jimena.ortiz@santalucia.cl",
    company: "Santa Lucía SpA",
    clinic: "Clínica Santa Lucía",
    phase: "respondio",
    formatId: "formato_a",
    subject: "Propuesta corta para Clínica Santa Lucía",
    body: "Hola Jimena,\n\ngracias por la respuesta de ayer. Te resumo lo que comentamos: Santa Lucía quiere bajar los no-show de kinesiología sin pedirle a recepción que llame a toda la lista.\n\nTe propongo una demo de veinte minutos con la agenda real, enmascarada. ¿El martes a las 10 te acomoda?\n\nAna Soto\nTramo",
    sentAt: "2026-10-24T13:00:00.000Z",
    zoho: zoho("santa-lucia"),
    createdAt: "2026-10-18T13:00:00.000Z",
    updatedAt: "2026-10-25T13:12:00.000Z",
  }),
  row({
    id: "6f0a9c31-7e2b-4c88-9d14-00000000000c",
    name: "Tomás Araya",
    email: "tomas.araya@kinesiologiapuerto.cl",
    clinic: "Kinesiología Puerto",
    phase: "respondio",
    formatId: "video_linkedin",
    subject: "El video y la agenda de Kinesiología Puerto",
    body: "Hola Tomás,\n\nme alegra que hayas visto el video. En Kinesiología Puerto el cuello de botella es el mismo: las confirmaciones se hacen cuando alguien se acuerda.\n\nTe mando por aquí el enlace para elegir horario. Si prefieres, también puedo llamarte el viernes.\n\nAna Soto\nTramo",
    sentAt: "2026-10-25T21:05:00.000Z",
    createdAt: "2026-10-19T21:00:00.000Z",
    updatedAt: "2026-10-26T15:00:00.000Z",
  }),
  row({
    id: "6f0a9c31-7e2b-4c88-9d14-00000000000d",
    name: "Elías Contreras",
    email: "elias.contreras@elquisalud.cl",
    company: "Elqui Salud",
    clinic: "Clínica Elqui",
    phase: "demo_agendada",
    formatId: "formato_actual",
    subject: "Quedó la demo de Clínica Elqui",
    body: "Hola Elías,\n\nqueda confirmada la demo del jueves a las 11. Voy a usar un recorte de una semana de Clínica Elqui, sin nombres de pacientes, para mostrar el recordatorio y la lista de quien no contestó.\n\nSi quieres sumar a quien lleva recepción, reenvía este correo.\n\nAna Soto\nTramo",
    sentAt: "2026-10-27T18:30:00.000Z",
    zoho: zoho("elqui"),
    followup: "2026-11-05T14:00:00.000Z",
    createdAt: "2026-10-12T18:00:00.000Z",
    updatedAt: "2026-10-28T18:30:00.000Z",
  }),
  row({
    id: "6f0a9c31-7e2b-4c88-9d14-00000000000e",
    name: "Paula Riquelme",
    email: "paula.riquelme@plazadental.cl",
    company: "Plaza Dental SpA",
    clinic: "Centro Dental Plaza",
    phase: "demo_agendada",
    formatId: "formato_b",
    subject: "Demo con Centro Dental Plaza",
    body: "Hola Paula,\n\nte escribo para dejar por escrito que la demo quedó propuesta para la próxima semana. Si al final Plaza Dental prefiere esperar al cambio de sistema, dímelo y la saco del calendario.\n\nAna",
    sentAt: "2026-10-16T17:45:00.000Z",
    zoho: zoho("plaza-dental"),
    outcome: "descartado",
    createdAt: "2026-10-07T17:00:00.000Z",
    updatedAt: "2026-10-29T10:15:00.000Z",
  }),
];

export const EXAMPLE_CONTACTS: Contact[] = SEEDS.map((seed) => seed.contact);

export const EXAMPLE_EMAILS: Record<string, SentEmail> = Object.fromEntries(
  SEEDS.filter((seed) => seed.email).map((seed) => [seed.contact.id, seed.email as SentEmail]),
);
