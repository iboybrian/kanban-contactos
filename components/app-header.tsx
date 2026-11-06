"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { SoundToggle } from "@/components/sound-toggle";
import { signOutGoogle } from "@/lib/google-auth";
import { googleSessionEmail, subscribeGoogleSession } from "@/lib/google-session";
import { PHASES } from "@/lib/phases";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Tablero" },
  { href: "/estadisticas", label: "Estadísticas" },
];

function isCurrent(pathname: string, href: string) {
  const current = pathname.replace(/\/$/, "") || "/";
  const target = href.replace(/\/$/, "") || "/";
  return current === target;
}

export function AppHeader() {
  const pathname = usePathname();
  const signedInEmail = useSyncExternalStore(subscribeGoogleSession, googleSessionEmail, () => "");

  return (
    <header className="sticky top-0 z-30 bg-pine text-paper">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="flex shrink-0 gap-0.5" aria-hidden>
            {PHASES.map((phase) => (
              <span key={phase.id} className="h-2.5 w-1.5 rounded-[2px]" style={{ backgroundColor: phase.color }} />
            ))}
          </span>
          <span className="min-w-0">
            <span className="font-display block text-2xl leading-none tracking-tight italic">Tramo</span>
            <span className="hidden text-xs text-white/70 sm:block">Pipeline de clínicas</span>
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-1.5">
          <SoundToggle />
          {signedInEmail ? (
            <button
              type="button"
              onClick={() => void signOutGoogle()}
              className="rounded-full px-2.5 py-1.5 text-sm font-semibold text-amber-50 hover:bg-white/10"
            >
              Salir
            </button>
          ) : null}
          <nav className="flex gap-1" aria-label="Secciones">
          {LINKS.map((link) => {
            const active = isCurrent(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-2.5 py-1.5 text-sm font-semibold sm:px-3",
                  active ? "bg-white text-pine" : "text-paper hover:bg-white/10",
                )}
              >
                {link.label}
              </Link>
            );
          })}
          </nav>
        </div>
      </div>
      <div className="flex h-1" aria-hidden>
        {PHASES.map((phase) => (
          <span key={phase.id} className="h-full flex-1" style={{ backgroundColor: phase.color }} />
        ))}
      </div>
    </header>
  );
}
