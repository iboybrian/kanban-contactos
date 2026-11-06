import { EXPECTED_SPREADSHEET_TITLE, MASTER_SHEET } from "./config";
import { interpretStato } from "./stato-map";
import type { Contact } from "./types";

const HEADER = {
  firstName: "First Name",
  lastName: "Last Name",
  companyName: "Company Name",
  email: "Email",
  stato: "Stato",
  esito: "Esito",
  dataContatto: "Data contatto",
  oggettoEmail: "Oggetto email",
  dataFollowup: "Data follow-up",
} as const;

export type SheetColumns = Record<keyof typeof HEADER, number>;

export function findSheetColumns(headers: string[]): SheetColumns {
  const index = new Map<string, number>();
  headers.forEach((header, position) => {
    const name = header.trim();
    if (name && !index.has(name)) index.set(name, position);
  });
  return {
    firstName: index.get(HEADER.firstName) ?? -1,
    lastName: index.get(HEADER.lastName) ?? -1,
    companyName: index.get(HEADER.companyName) ?? -1,
    email: index.get(HEADER.email) ?? -1,
    stato: index.get(HEADER.stato) ?? -1,
    esito: index.get(HEADER.esito) ?? -1,
    dataContatto: index.get(HEADER.dataContatto) ?? -1,
    oggettoEmail: index.get(HEADER.oggettoEmail) ?? -1,
    dataFollowup: index.get(HEADER.dataFollowup) ?? -1,
  };
}

export function columnToA1(index: number): string {
  let number = index + 1;
  let letters = "";
  while (number > 0) {
    const remainder = (number - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    number = Math.floor((number - 1) / 26);
  }
  return letters;
}

/** Una sola celda. La API no ofrece un alcance de "solo esta columna"; el rango sí. */
export function statoCellRange(rowNumber: number, statoColumn: number): string {
  if (statoColumn < 0) throw new Error("No se encontró el encabezado Stato. No se escribió nada.");
  if (rowNumber < 2) throw new Error("Fila no válida");
  return `'${MASTER_SHEET}'!${columnToA1(statoColumn)}${rowNumber}`;
}

export function fullTabRange(): string {
  return `'${MASTER_SHEET}'`;
}

export function rowRange(rowNumber: number): string {
  return `'${MASTER_SHEET}'!${rowNumber}:${rowNumber}`;
}

function cell(row: string[], index: number): string {
  if (index < 0) return "";
  return String(row[index] ?? "").trim();
}

function parseSheetDate(value: string): string | null {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(value.trim());
  if (!match) return null;
  const day = match[1].padStart(2, "0");
  const month = match[2].padStart(2, "0");
  return `${match[3]}-${month}-${day}T12:00:00.000Z`;
}

export function contactsFromGrid(values: string[][]): { error: string | null; contacts: Contact[] } {
  if (!values.length) return { error: "La pestaña Master2 está vacía.", contacts: [] };
  const columns = findSheetColumns(values[0] ?? []);
  if (columns.stato < 0) {
    return { error: "No se encontró el encabezado Stato. No se escribió nada.", contacts: [] };
  }

  const contacts: Contact[] = [];
  for (let index = 1; index < values.length; index += 1) {
    const row = values[index] ?? [];
    const firstName = cell(row, columns.firstName);
    const lastName = cell(row, columns.lastName);
    const email = cell(row, columns.email);
    const company = cell(row, columns.companyName);
    const stato = cell(row, columns.stato);
    const subject = cell(row, columns.oggettoEmail);
    if (!firstName && !lastName && !email && !company && !stato && !subject) continue;

    const interpreted = interpretStato(stato, cell(row, columns.esito));
    const sentAt = parseSheetDate(cell(row, columns.dataContatto));
    contacts.push({
      id: String(index + 1),
      name: [firstName, lastName].filter(Boolean).join(" ").trim() || "Sin nombre",
      email,
      company: null,
      clinic: company || null,
      subject: subject || null,
      phase: interpreted.phase,
      email_format_id: null,
      email_format_name: null,
      sent_email_url: null,
      sent_at: sentAt,
      created_at: sentAt ?? new Date(0).toISOString(),
      updated_at: new Date().toISOString(),
      outcome: interpreted.outcome,
      next_followup_at: parseSheetDate(cell(row, columns.dataFollowup)),
      sheetStato: stato,
    });
  }
  return { error: null, contacts };
}

export function assertRowStillMatches(input: {
  expectedEmail: string;
  expectedName: string;
  expectedStato: string;
  row: string[];
  columns: SheetColumns;
}): { ok: true } | { ok: false; message: string } {
  if (input.columns.stato < 0) {
    return { ok: false, message: "No se encontró el encabezado Stato. No se escribió nada." };
  }
  const email = cell(input.row, input.columns.email).toLowerCase();
  const name = [cell(input.row, input.columns.firstName), cell(input.row, input.columns.lastName)]
    .filter(Boolean)
    .join(" ")
    .trim()
    .toLowerCase();
  const stato = cell(input.row, input.columns.stato);
  const expectedEmail = input.expectedEmail.trim().toLowerCase();
  const expectedName = input.expectedName.trim().toLowerCase();

  if (expectedEmail) {
    if (email !== expectedEmail) {
      return {
        ok: false,
        message: `La fila ya no es ${input.expectedEmail}. No escribí Stato.`,
      };
    }
  } else if (name !== expectedName) {
    return {
      ok: false,
      message: `La fila ya no es ${input.expectedName}. No escribí Stato.`,
    };
  }

  if (stato !== input.expectedStato.trim()) {
    return {
      ok: false,
      message: `Stato cambió desde la lectura y ahora es «${stato || "vacío"}». No escribí nada. Recarga el tablero: n8n u otra sesión pudo haberlo actualizado.`,
    };
  }
  return { ok: true };
}

export function spreadsheetTitleMatches(title: string): boolean {
  return title.trim().toLowerCase() === EXPECTED_SPREADSHEET_TITLE.toLowerCase();
}
