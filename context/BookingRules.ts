/**
 * BookingRules.ts
 * 
 * Denne fil indeholder forretningslogik for booking-begrænsninger i systemet.
 * Den definerer og håndhæver regler for, hvor meget forskellige brugerroller må booke.
 * 
 * REGLER:
 * - Studerende må maksimalt have 4 fremtidige bookinger i alt på samme tid
 * - Studerende må maksimalt booke 4 timer ad gangen i en enkelt booking
 * - Lærere og administratorer er ikke begrænset af disse regler
 * 
 * Disse regler sikrer fair adgang til ressourcer og forhindrer ressourcemonopolisering.
 */

import type { Booking } from "./BookingContext";

/**
 * Type definition for resultatet af en booking-validering.
 * 
 * @property ok - true hvis bookingen overholder alle regler, false hvis den overtræder en eller flere regler
 * @property message - Optional oversættelsesnøgle til fejlbesked, kun medtaget hvis ok er false
 */
export type BookingLimitResult = {
  ok: boolean;
  message?: string;
};

/**
 * Validerer om en ny booking overholder de definerede regler for den givne brugerrolle.
 * 
 * Denne funktion tjekker:
 * 1. Om brugeren er studerende (andre roller har ubegrænsede rettigheder)
 * 2. Om booking-varigheden overstiger 4 timer
 * 3. Om brugeren allerede har 4 fremtidige bookinger
 * 
 * @param role - Brugerens rolle ("student", "teacher" eller "admin"). Kun studerende har begrænsninger.
 * @param futureBookingsForUser - Array af brugerens eksisterende fremtidige bookinger (bruges til at tælle antal)
 * @param start - Start-tidspunktet for den ønskede booking (Date objekt)
 * @param end - Slut-tidspunktet for den ønskede booking (Date objekt)
 * 
 * @returns BookingLimitResult objekt med ok: true hvis bookingen er tilladt,
 *          eller ok: false med en oversættelsesnøgle til fejlbesked hvis bookingen overtræder reglerne
 * 
 * @example
 * const result = validateBookingLimits("student", existingBookings, startDate, endDate);
 * if (!result.ok) {
 *   console.error(result.message); // "booking.maxfourhours" eller "booking.maxfourbookings"
 * }
 */
export function validateBookingLimits(
  role: string | null,
  futureBookingsForUser: Booking[],
  start: Date,
  end: Date
): BookingLimitResult {
  // Kun studerende er begrænset af regler - lærere og administratorer har frit spil
  // Dette tjekker om rollen er eksplicit "student"
  if (role !== "student") {
    return { ok: true };
  }

  // Beregn varigheden af bookingen i timer
  // Vi konverterer millisekunder forskellen til timer ved at dividere med:
  // - 1000 (millisekunder til sekunder)
  // - 60 (sekunder til minutter)
  // - 60 (minutter til timer)
  const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

  // Tjek om varigheden overstiger den maksimalt tilladte varighed på 4 timer
  if (durationHours > 4) {
    return {
      ok: false,
      message: "booking.maxfourhours", // Oversættelsesnøgle til fejlbesked
    };
  }

  // Tjek om brugeren allerede har det maksimalt tilladte antal fremtidige bookinger (4)
  // Vi tjekker >= 4 fordi vi validerer før den nye booking er oprettet
  if (futureBookingsForUser.length >= 4) {
    return {
      ok: false,
      message: "booking.maxfourbookings", // Oversættelsesnøgle til fejlbesked
    };
  }

  // Alle valideringer er bestået - bookingen er tilladt
  return { ok: true };
}
