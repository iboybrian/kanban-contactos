/**
 * Columnas del tablero, de izquierda a derecha.
 *
 * Esta es la única lista de fases. Para agregar una (por ejemplo si más
 * adelante "descartado" o "rebotado" pasan a ser columnas), suma un objeto
 * aquí: etiquetas, orden y colores salen de este archivo.
 *
 * Hoy "descartado" y "rebotado" no son fases. Viven en Contact.outcome
 * y la tarjeta sigue en la columna de su phase.
 */
export const PHASES = [
  {
    id: "nuevo",
    label: "Nuevo",
    description: "Ingresó al pipeline y todavía no sale el primer correo.",
    color: "#1d4ed8",
    soft: "#dbeafe",
    wash: "#eff6ff",
  },
  {
    id: "contactado",
    label: "Contactado",
    description: "Ya se envió el primer correo.",
    color: "#b45309",
    soft: "#fef3c7",
    wash: "#fffbeb",
  },
  {
    id: "primer_recordatorio",
    label: "Primer recordatorio",
    description: "Primer seguimiento después del contacto inicial.",
    color: "#6d28d9",
    soft: "#ede9fe",
    wash: "#f5f3ff",
  },
  {
    id: "segundo_recordatorio",
    label: "Segundo recordatorio",
    description: "Segundo seguimiento.",
    color: "#c2410c",
    soft: "#ffedd5",
    wash: "#fff7ed",
  },
  {
    id: "tercer_recordatorio_cierre",
    label: "Tercer recordatorio (cierre)",
    description: "Último intento antes de cerrar el ciclo.",
    color: "#be123c",
    soft: "#ffe4e6",
    wash: "#fff1f2",
  },
  {
    id: "respondio",
    label: "Respondió",
    description: "La clínica contestó.",
    color: "#0f766e",
    soft: "#ccfbf1",
    wash: "#f0fdfa",
  },
  {
    id: "demo_agendada",
    label: "Demo agendada",
    description: "Hay una demo en el calendario.",
    color: "#047857",
    soft: "#d1fae5",
    wash: "#ecfdf5",
  },
] as const;

export type PhaseId = (typeof PHASES)[number]["id"];

export type PhaseConfig = {
  id: string;
  label: string;
  description: string;
  color: string;
  soft: string;
  wash: string;
};

export function getPhaseConfig(id: string): PhaseConfig {
  const known = PHASES.find((phase) => phase.id === id);
  if (known) return known;
  return {
    id,
    label: id,
    description: "Fase recibida del API y todavía no está en lib/phases.ts.",
    color: "#57534e",
    soft: "#e7e5e4",
    wash: "#fafaf9",
  };
}

/** Configured columns, plus any phase id present in the data but missing from PHASES. */
export function columnsFor(phaseIds: Iterable<string>): PhaseConfig[] {
  const extras: string[] = [];
  const known = new Set<string>(PHASES.map((phase) => phase.id));
  for (const id of phaseIds) {
    if (!known.has(id) && !extras.includes(id)) extras.push(id);
  }
  return [...PHASES, ...extras.map((id) => getPhaseConfig(id))];
}
