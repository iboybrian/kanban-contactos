"use client";

import { useSyncExternalStore } from "react";
import { MUTE_EVENT, readMuted, writeMuted } from "@/lib/mute-store";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(MUTE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(MUTE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function useMuted() {
  const muted = useSyncExternalStore(subscribe, readMuted, () => false);
  return [muted, writeMuted] as const;
}
