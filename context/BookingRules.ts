// Fælles regler for bookinger:
// - Studerende må maks have 4 fremtidige bookinger i alt
// - Studerende må maks booke 4 timer ad gangen
// Lærere og admin er ikke begrænset af disse regler.

import type { Booking } from "./BookingContext";

export type BookingLimitResult = {
  ok: boolean;
  message?: string;
};

export function validateBookingLimits(
  role: string | null,
  futureBookingsForUser: Booking[],
  start: Date,
  end: Date
): BookingLimitResult {
  // Kun studerende er begrænset
  if (role !== "student") {
    return { ok: true };
  }

  // Beregn varighed i timer
  const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

  if (durationHours > 4) {
    return {
      ok: false,
      message: "Som studerende må du højst booke 4 timer ad gangen.",
    };
  }

  // Tjek antal fremtidige bookinger (inkl. denne nye)
  if (futureBookingsForUser.length >= 4) {
    return {
      ok: false,
      message:
        "Som studerende må du maks have 4 fremtidige bookinger. Slet en før du opretter en ny.",
    };
  }

  return { ok: true };
}
