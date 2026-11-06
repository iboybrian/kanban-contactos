const KEY = "tramo-muted";
export const MUTE_EVENT = "tramo-mute";

export function readMuted() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function writeMuted(muted: boolean) {
  try {
    localStorage.setItem(KEY, muted ? "1" : "0");
  } catch {
    // Safari privado puede bloquear localStorage. El silencio igual vale en esta pestaña.
  }
  window.dispatchEvent(new Event(MUTE_EVENT));
}
