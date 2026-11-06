"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const COLORS = ["#f6d978", "#e2b23a", "#fff4c8", "#d4533b", "#2f6f4e", "#f3ecdf"];

type Piece = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  spin: number;
  drift: number;
  coin: boolean;
  color: string;
  size: number;
};

function subscribeMotion(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function motionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function makePieces(): Piece[] {
  const compact = window.matchMedia("(max-width: 640px)").matches;
  const count = compact ? 18 : 40;
  return Array.from({ length: count }, (_, index) => {
    const coin = index % 3 !== 1;
    return {
      id: index,
      left: (index * 47 + 11) % 100,
      delay: (index % 8) * 0.05,
      duration: 1.65 + (index % 5) * 0.16,
      spin: 140 + ((index * 53) % 260),
      drift: (index % 2 === 0 ? 1 : -1) * (10 + (index % 6) * 7),
      coin,
      color: COLORS[index % COLORS.length] ?? "#e2b23a",
      size: coin ? 14 + (index % 4) * 3 : 9,
    };
  });
}

export function CoinRain({ title, onDone }: { title: string; onDone: () => void }) {
  const reduced = useSyncExternalStore(subscribeMotion, motionSnapshot, () => false);
  const [pieces] = useState(makePieces);

  useEffect(() => {
    const timeout = window.setTimeout(onDone, reduced ? 1400 : 2800);
    return () => window.clearTimeout(timeout);
  }, [onDone, reduced]);

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      {reduced
        ? null
        : pieces.map((piece) => (
            <span
              key={piece.id}
              className={piece.coin ? "coin-piece coin-piece-round" : "coin-piece coin-piece-rect"}
              style={{
                left: `${piece.left}%`,
                width: piece.size,
                height: piece.coin ? piece.size : piece.size * 1.6,
                background: piece.coin
                  ? `radial-gradient(circle at 35% 30%, #fff8dc, ${piece.color} 55%, #8a5a12)`
                  : piece.color,
                animationDelay: `${piece.delay}s`,
                animationDuration: `${piece.duration}s`,
                ["--spin" as string]: `${piece.spin}deg`,
                ["--drift" as string]: `${piece.drift}px`,
              }}
            />
          ))}
      <div className="absolute top-[22%] right-0 left-0 flex justify-center px-4">
        <div className="jackpot-banner w-[min(90vw,22rem)] rounded-2xl bg-amber-400 px-5 py-3 text-center text-ink shadow-2xl">
          <p className="font-display text-3xl leading-none">¡Jackpot!</p>
          <p className="mt-1 text-sm font-semibold">{title}</p>
        </div>
      </div>
    </div>
  );
}
