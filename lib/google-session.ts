const EVENT = "tramo-google-session";

type GoogleSession = {
  accessToken: string;
  expiresAt: number;
  email: string;
};

let session: GoogleSession | null = null;
let expiryTimer = 0;

function notify() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeGoogleSession(onStoreChange: () => void) {
  window.addEventListener(EVENT, onStoreChange);
  return () => window.removeEventListener(EVENT, onStoreChange);
}

/** El token vive solo en esta variable. Cerrar la pestaña lo olvida. */
export function getGoogleSession(): GoogleSession | null {
  if (!session) return null;
  if (Date.now() >= session.expiresAt) return null;
  return session;
}

export function setGoogleSession(accessToken: string, expiresInSeconds: number, email: string) {
  if (expiryTimer) window.clearTimeout(expiryTimer);
  const lifetimeMs = Math.max(30, expiresInSeconds - 60) * 1000;
  session = {
    accessToken,
    expiresAt: Date.now() + lifetimeMs,
    email: email.trim().toLowerCase(),
  };
  expiryTimer = window.setTimeout(() => {
    session = null;
    expiryTimer = 0;
    notify();
  }, lifetimeMs);
  notify();
}

export function clearGoogleSession() {
  if (expiryTimer) window.clearTimeout(expiryTimer);
  expiryTimer = 0;
  session = null;
  notify();
}

export function googleSessionEmail() {
  return getGoogleSession()?.email ?? "";
}
