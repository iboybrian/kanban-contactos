import {
  EXPECTED_SPREADSHEET_TITLE,
  MASTER_SHEET,
  isUsingMockData,
  spreadsheetId,
} from "@/lib/config";
import { EXAMPLE_CONTACTS, EXAMPLE_EMAIL_FORMATS, EXAMPLE_EMAILS } from "@/lib/mock-data";
import { assertAllowedAccount } from "@/lib/config";
import { clearGoogleSession, getGoogleSession } from "@/lib/google-session";
import {
  assertRowStillMatches,
  contactsFromGrid,
  findSheetColumns,
  fullTabRange,
  rowRange,
  spreadsheetTitleMatches,
  statoCellRange,
} from "@/lib/sheets-grid";
import { DISCARD_STATO, statoForPhase } from "@/lib/stato-map";
import { SIN_FORMATO_LABEL, type Contact, type EmailFormat, type EmailsByFormat, type SentEmail } from "@/lib/types";

const READ_DELAY_MS = 160;
const UNAVAILABLE_BODY = "Cuerpo no disponible";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export class SheetConflictError extends ApiError {
  constructor(message: string) {
    super(409, message);
    this.name = "SheetConflictError";
  }
}

type ExampleStore = {
  contacts: Contact[];
  emails: Record<string, SentEmail>;
};

function createStore(): ExampleStore {
  return {
    contacts: structuredClone(EXAMPLE_CONTACTS),
    emails: structuredClone(EXAMPLE_EMAILS),
  };
}

function exampleStore(): ExampleStore {
  if (typeof window === "undefined") return createStore();
  const holder = window as Window & { __tramoExampleStore?: ExampleStore };
  if (!holder.__tramoExampleStore) holder.__tramoExampleStore = createStore();
  return holder.__tramoExampleStore;
}

async function pause(ms: number) {
  if (ms <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function requireSession() {
  const session = getGoogleSession();
  if (!session) {
    clearGoogleSession();
    throw new ApiError(401, "La sesión de Google expiró. Entra de nuevo.");
  }
  assertAllowedAccount(session.email);
  return session;
}

async function sheetsFetch(path: string, init?: RequestInit) {
  const session = requireSession();
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId()}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (response.status === 401) {
    clearGoogleSession();
    throw new ApiError(401, "Google rechazó la sesión. Entra de nuevo.");
  }
  if (!response.ok) {
    let detail = `Error ${response.status} de Google Sheets`;
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      if (body.error?.message) detail = body.error.message;
    } catch {
      detail = `Error ${response.status} de Google Sheets`;
    }
    throw new ApiError(response.status, detail);
  }
  return response;
}

let titleChecked = false;

async function assertSpreadsheetIdentity() {
  if (titleChecked) return;
  const response = await sheetsFetch("?fields=properties.title");
  const body = (await response.json()) as { properties?: { title?: string } };
  const title = body.properties?.title ?? "";
  if (!spreadsheetTitleMatches(title)) {
    throw new ApiError(403, `La hoja conectada se llama «${title || "sin título"}», no «${EXPECTED_SPREADSHEET_TITLE}». No leí ni escribí datos.`);
  }
  titleChecked = true;
}

async function readGrid(range: string): Promise<string[][]> {
  const response = await sheetsFetch(
    `/values/${encodeURIComponent(range)}?valueRenderOption=FORMATTED_VALUE&majorDimension=ROWS`,
  );
  const body = (await response.json()) as { values?: unknown[][] };
  return (body.values ?? []).map((row) => row.map((cell) => String(cell ?? "")));
}

export async function getContacts(phase?: string): Promise<Contact[]> {
  if (isUsingMockData()) {
    await pause(READ_DELAY_MS);
    const list = exampleStore().contacts.filter((contact) => !phase || contact.phase === phase);
    return structuredClone(list);
  }
  await assertSpreadsheetIdentity();
  const built = contactsFromGrid(await readGrid(fullTabRange()));
  if (built.error) throw new ApiError(400, built.error);
  return phase ? built.contacts.filter((contact) => contact.phase === phase) : built.contacts;
}

async function writeStato(current: Contact, stato: string): Promise<Contact> {
  await assertSpreadsheetIdentity();
  const headers = await readGrid(`'${MASTER_SHEET}'!1:1`);
  const columns = findSheetColumns(headers[0] ?? []);
  if (columns.stato < 0) throw new ApiError(400, "No se encontró el encabezado Stato. No se escribió nada.");

  const rowNumber = Number(current.id);
  const freshRows = await readGrid(rowRange(rowNumber));
  const check = assertRowStillMatches({
    expectedEmail: current.email,
    expectedName: current.name,
    expectedStato: current.sheetStato,
    row: freshRows[0] ?? [],
    columns,
  });
  if (!check.ok) throw new SheetConflictError(check.message);

  const range = statoCellRange(rowNumber, columns.stato);
  await sheetsFetch(`/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    body: JSON.stringify({ range, majorDimension: "ROWS", values: [[stato]] }),
  });

  const fresh = await getContacts();
  const updated = fresh.find((contact) => contact.id === current.id);
  if (!updated) throw new ApiError(404, "No pude releer la fila después de escribir Stato.");
  return updated;
}

export async function updateContactPhase(current: Contact, phase: Contact["phase"]): Promise<Contact> {
  if (isUsingMockData()) {
    const store = exampleStore();
    const found = store.contacts.find((contact) => contact.id === current.id);
    if (!found) throw new ApiError(404, "Contacto no encontrado");
    const next: Contact = { ...found, phase, updated_at: new Date().toISOString() };
    store.contacts = store.contacts.map((contact) => (contact.id === current.id ? next : contact));
    return structuredClone(next);
  }
  return writeStato(current, statoForPhase(phase));
}

/** No borra la fila. Stato pasa a Descartado. */
export async function deleteContact(current: Contact): Promise<Contact> {
  if (isUsingMockData()) {
    const store = exampleStore();
    const found = store.contacts.find((contact) => contact.id === current.id);
    if (!found) throw new ApiError(404, "Contacto no encontrado");
    const next: Contact = {
      ...found,
      outcome: "descartado",
      sheetStato: DISCARD_STATO,
      updated_at: new Date().toISOString(),
    };
    store.contacts = store.contacts.map((contact) => (contact.id === current.id ? next : contact));
    return structuredClone(next);
  }
  return writeStato(current, DISCARD_STATO);
}

/** Quita el descarte escribiendo el Stato de la fase actual. Esito no se toca. */
export async function clearDiscard(current: Contact): Promise<Contact> {
  if (isUsingMockData()) {
    const store = exampleStore();
    const found = store.contacts.find((contact) => contact.id === current.id);
    if (!found) throw new ApiError(404, "Contacto no encontrado");
    const next: Contact = {
      ...found,
      outcome: found.outcome === "rebotado" ? "rebotado" : null,
      sheetStato: statoForPhase(found.phase),
      updated_at: new Date().toISOString(),
    };
    store.contacts = store.contacts.map((contact) => (contact.id === current.id ? next : contact));
    return structuredClone(next);
  }
  return writeStato(current, statoForPhase(current.phase));
}

export async function getEmail(contactId: string): Promise<SentEmail | null> {
  if (isUsingMockData()) {
    await pause(80);
    const email = exampleStore().emails[contactId];
    return email ? structuredClone(email) : null;
  }
  const contacts = await getContacts();
  const contact = contacts.find((item) => item.id === contactId);
  if (!contact) return null;
  return {
    subject: contact.subject || "Sin asunto",
    body: UNAVAILABLE_BODY,
    sent_at: contact.sent_at,
    email_format_name: null,
    from_address: "",
    sent_email_url: null,
  };
}

export async function getEmailFormats(): Promise<EmailFormat[]> {
  if (isUsingMockData()) {
    await pause(READ_DELAY_MS);
    return structuredClone(EXAMPLE_EMAIL_FORMATS);
  }
  return [];
}

export async function getStats(): Promise<EmailsByFormat[]> {
  if (isUsingMockData()) {
    await pause(READ_DELAY_MS);
    const counts = new Map<string | null, EmailsByFormat>();
    for (const format of EXAMPLE_EMAIL_FORMATS) {
      counts.set(format.id, { format_id: format.id, format_name: format.name, sent_count: 0 });
    }
    counts.set(null, { format_id: null, format_name: SIN_FORMATO_LABEL, sent_count: 0 });
    for (const contact of exampleStore().contacts) {
      if (!contact.sent_at) continue;
      const key = contact.email_format_id;
      const current = counts.get(key);
      if (current) current.sent_count += 1;
      else {
        counts.set(key, {
          format_id: key,
          format_name: contact.email_format_name ?? SIN_FORMATO_LABEL,
          sent_count: 1,
        });
      }
    }
    return [...counts.values()].map((row) => ({ ...row }));
  }

  const contacts = await getContacts();
  const sent = contacts.filter((contact) => contact.sent_at || contact.subject).length;
  return [{ format_id: null, format_name: SIN_FORMATO_LABEL, sent_count: sent }];
}
