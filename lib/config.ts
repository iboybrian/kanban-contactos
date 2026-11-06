/**
 * El client ID de Google es público por diseño (Identity Services).
 * El secreto de cliente no existe en esta app y no debe agregarse.
 * Sin estos tres valores, la interfaz se queda en los datos de ejemplo.
 */
export function googleClientId(): string | null {
  const value = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  return value || null;
}

export function spreadsheetId(): string | null {
  const value = process.env.NEXT_PUBLIC_SPREADSHEET_ID?.trim();
  return value || null;
}

export function allowedGoogleEmails(): string[] {
  return (process.env.NEXT_PUBLIC_ALLOWED_GOOGLE_EMAIL ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function assertAllowedAccount(email: string) {
  const allowed = allowedGoogleEmails();
  if (allowed.length === 0) {
    throw new Error("Falta NEXT_PUBLIC_ALLOWED_GOOGLE_EMAIL. Ninguna cuenta puede entrar.");
  }
  if (!allowed.includes(email.trim().toLowerCase())) {
    throw new Error(`La cuenta ${email} no está autorizada. Solo puede entrar ${allowed.join(", ")}.`);
  }
}

/** Sin client ID, sin ID de hoja o sin correo explícito, no hay acceso a Google. */
export function isUsingMockData(): boolean {
  return !googleClientId() || !spreadsheetId() || allowedGoogleEmails().length === 0;
}

/**
 * Alcance mínimo que permite leer una hoja ya existente y escribir una celda.
 * No existe un alcance de "solo la columna Stato" ni de "solo este archivo".
 * Este token puede leer y editar cualquier hoja de cálculo a la que la cuenta tenga acceso.
 */
export const GOOGLE_SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

/** Solo para comprobar que la sesión es la cuenta autorizada, antes de leer o escribir. */
export const GOOGLE_EMAIL_SCOPE = "https://www.googleapis.com/auth/userinfo.email";

export const GOOGLE_OAUTH_SCOPES = `${GOOGLE_SHEETS_SCOPE} ${GOOGLE_EMAIL_SCOPE}`;

export const EXPECTED_SPREADSHEET_TITLE = "IntelliVet Outreach";
export const MASTER_SHEET = "Master2";
