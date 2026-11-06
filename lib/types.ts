import type { PhaseId } from "@/lib/phases";

/** Cierre comercial. No es una columna del tablero. */
export type Outcome = "descartado" | "rebotado";

/**
 * Contacto tal como lo entrega el API (contrato v0.2).
 * `phase` acepta los ids de lib/phases.ts y, si el backend agrega una fase,
 * el string nuevo para no esconder la tarjeta.
 */
export interface Contact {
  id: string;
  name: string;
  email: string;
  company: string | null;
  clinic: string | null;
  subject: string | null;
  phase: PhaseId | (string & {});
  email_format_id: string | null;
  email_format_name: string | null;
  sent_email_url: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
  outcome: Outcome | null;
  next_followup_at: string | null;
  /** Texto de Stato tal como se leyó. Sirve para no pisar un cambio de n8n. */
  sheetStato: string;
}

export interface ContactPatch {
  phase?: Contact["phase"];
  outcome?: Outcome | null;
}

/** GET /contacts/:id/email */
export interface SentEmail {
  subject: string;
  body: string;
  sent_at: string | null;
  email_format_name: string | null;
  from_address: string;
  sent_email_url: string | null;
}

/** GET /email-formats */
export interface EmailFormat {
  id: string;
  name: string;
}

/**
 * GET /stats/emails-by-format
 * Los contactos sin formato llegan con format_id null y format_name "Sin formato".
 */
export interface EmailsByFormat {
  format_id: string | null;
  format_name: string;
  sent_count: number;
}

export const SIN_FORMATO_LABEL = "Sin formato";

export const OUTCOME_LABEL: Record<Outcome, string> = {
  descartado: "Descartado",
  rebotado: "Rebotado",
};
