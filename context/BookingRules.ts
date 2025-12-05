// Studerende må maks have 4 bookinger + maks 4 timer per booking.
// Teachers og Admins har ingen begrænsninger.

export function validateBookingLimits(role: string, existingBookings: any[], newBooking: any) {
  // Hvis ikke student → ingen restriktioner
  if (role !== "student") return { ok: true };

  // Tjek total antal bookinger
  if (existingBookings.length >= 4) {
    return { ok: false, message: "Studerende må maks have 4 aktive bookinger." };
  }

  // Beregn varighed
  const start = new Date(newBooking.start_time);
  const end = new Date(newBooking.end_time);
  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

  if (hours > 4) {
    return { ok: false, message: "En booking må maks vare 4 timer." };
  }

  return { ok: true };
}
