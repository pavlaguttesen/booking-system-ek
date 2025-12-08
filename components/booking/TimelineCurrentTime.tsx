"use client";

// Viser en rød linje i timeline der angiver det nuværende tidspunkt (kun når dagens dato er valgt).

"use client";

// Rød tidslinje der viser nuværende tidspunkt i timeline.
// Vises kun hvis valgt dato = i dag.

export function TimelineCurrentTime({ topPercent }: { topPercent: number }) {
  return (
    <div
      className="absolute left-0 w-full pointer-events-none"
      style={{
        top: `${topPercent}%`,
        borderTop: "2px solid red",
      }}
    />
  );
}
