"use client";

// Rød tidslinje der viser nuværende tidspunkt i timeline.
// Vises kun hvis valgt dato = i dag.

import dayjs from "dayjs";

export function TimelineCurrentTime({
  topPercent,
}: {
  topPercent: number;
}) {
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
