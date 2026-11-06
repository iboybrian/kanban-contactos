const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export function SlotNumber({ value, delay = 0 }: { value: number; delay?: number }) {
  const safe = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  const digits = String(safe).split("");

  return (
    <span className="inline-flex items-end align-middle">
      <span className="sr-only">{safe}</span>
      <span className="inline-flex" aria-hidden>
        {digits.map((digit, index) => (
          <span key={`${index}-${digit}`} className="relative inline-block h-[1em] w-[1ch] overflow-hidden">
            <span
              className="slot-reel absolute inset-x-0 top-0 flex flex-col"
              style={{
                animationDelay: `${delay + index * 90}ms`,
                ["--slot-end" as string]: `${-(10 + Number(digit))}em`,
              }}
            >
              {[...DIGITS, ...DIGITS].map((cell, cellIndex) => (
                <span key={cellIndex} className="flex h-[1em] items-center justify-center leading-none">
                  {cell}
                </span>
              ))}
            </span>
          </span>
        ))}
      </span>
    </span>
  );
}
