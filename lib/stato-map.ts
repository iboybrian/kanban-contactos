import type { PhaseId } from "./phases";
import type { Outcome } from "@/lib/types";

/**
 * Único mapa entre la columna Stato de Master2 y las fases del tablero.
 * Para cambiar un texto de la hoja o la fase de destino, edita este archivo.
 *
 * Al leer, varios textos pueden caer en la misma fase.
 * Al mover una tarjeta, se escribe solo el valor "enviado" de PHASE_TO_STATO.
 * Nuevo limpia la celda. Descartado no es una fase: es outcome.
 */
export const DISCARD_STATO = "Descartado";
export const FALLBACK_PHASE: PhaseId = "contactado";

export const PHASE_TO_STATO: Record<PhaseId, string> = {
  nuevo: "",
  contactado: "Contactado",
  primer_recordatorio: "Seguimiento 1 enviado",
  segundo_recordatorio: "Seguimiento 2 enviado",
  tercer_recordatorio_cierre: "Tercer recordatorio",
  respondio: "Respondió",
  demo_agendada: "Demo agendada",
};

const STATO_TO_PHASE: Record<string, PhaseId> = {
  Contactado: "contactado",
  "Seguimiento 1 programado": "contactado",
  "Seguimiento 1 enviado": "primer_recordatorio",
  "Seguimiento 2 programado": "primer_recordatorio",
  "Seguimiento 2 enviado": "segundo_recordatorio",
  "Tercer recordatorio": "tercer_recordatorio_cierre",
  "Respondió": "respondio",
  "Demo agendada": "demo_agendada",
};

export function interpretStato(stato: string, esito: string): { phase: PhaseId; outcome: Outcome | null } {
  const status = stato.trim();
  const result = esito.trim().toLowerCase();
  const bounced = result === "rebotado";

  if (status.toLowerCase() === DISCARD_STATO.toLowerCase()) {
    return { phase: FALLBACK_PHASE, outcome: "descartado" };
  }

  if (!status) {
    return { phase: "nuevo", outcome: bounced ? "rebotado" : null };
  }

  const phase = STATO_TO_PHASE[status] ?? FALLBACK_PHASE;
  return { phase, outcome: bounced ? "rebotado" : null };
}

export function statoForPhase(phase: string): string {
  if (Object.prototype.hasOwnProperty.call(PHASE_TO_STATO, phase)) {
    return PHASE_TO_STATO[phase as PhaseId];
  }
  return PHASE_TO_STATO[FALLBACK_PHASE];
}
