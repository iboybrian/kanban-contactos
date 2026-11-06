"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect } from "react";
import { playChip, unlockAudio } from "@/lib/casino-audio";
import { useMuted } from "@/lib/sound-preference";

export function SoundToggle() {
  const [muted, setMuted] = useMuted();

  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { capture: true });
    return () => window.removeEventListener("pointerdown", unlock, { capture: true });
  }, []);

  return (
    <button
      type="button"
      aria-pressed={muted}
      aria-label={muted ? "Activar sonidos" : "Silenciar sonidos"}
      onClick={() => {
        const next = !muted;
        setMuted(next);
        if (!next) {
          unlockAudio();
          playChip();
        }
      }}
      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-amber-200/50 bg-amber-300/15 px-2.5 text-sm font-semibold text-amber-50 hover:bg-amber-300/25 focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:outline-none"
    >
      {muted ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
      <span className="hidden sm:inline">{muted ? "Silencio" : "Sonido"}</span>
    </button>
  );
}
