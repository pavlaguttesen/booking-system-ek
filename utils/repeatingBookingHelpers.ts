import dayjs from "dayjs";

export type RecurrenceType = "daily" | "weekly" | "biweekly" | "monthly";

/**
 * Genererer et array af datoer baseret på gentagelsesmønster
 * @param startDate Startdatoen for gentagelsen
 * @param endDate Slutdatoen (bookinger vil ikke blive oprettet efter denne dato)
 * @param recurrenceType Gentagelsestypen
 * @returns Array af datoer for gentagelsen
 */
export function generateRecurrenceDates(
  startDate: Date,
  endDate: Date,
  recurrenceType: RecurrenceType
): Date[] {
  const dates: Date[] = [];
  let current = dayjs(startDate);
  const end = dayjs(endDate);

  while (current.isBefore(end, "day") || current.isSame(end, "day")) {
    dates.push(current.toDate());

    switch (recurrenceType) {
      case "daily":
        current = current.add(1, "day");
        break;
      case "weekly":
        current = current.add(1, "week");
        break;
      case "biweekly":
        current = current.add(2, "weeks");
        break;
      case "monthly":
        current = current.add(1, "month");
        break;
    }
  }

  return dates;
}

/**
 * Opretter individuelle bookingsobjekter fra en tilbagevendende bookingskabelon
 * @param dates Array af datoer for gentagelsen
 * @param startTime Tidspunkt for bookingen (f.eks. 10:00)
 * @param endTime Sluttidspunkt for bookingen (f.eks. 12:00)
 * @param roomId Lokale-ID
 * @param title Bookingtitel
 * @param userId Bruger-ID (normalt admin)
 * @param parentRepeatingId ID'et for tilbagevendende booking-posten
 * @returns Array af booking-objekter klar til indsætning
 */
export function createBookingsFromRecurrence(
  dates: Date[],
  startTime: Date,
  endTime: Date,
  roomId: string,
  title: string,
  userId: string,
  parentRepeatingId: string
) {
  const startHour = dayjs(startTime).hour();
  const startMinute = dayjs(startTime).minute();
  const endHour = dayjs(endTime).hour();
  const endMinute = dayjs(endTime).minute();

  return dates.map((date) => {
    const bookingStart = dayjs(date)
      .hour(startHour)
      .minute(startMinute)
      .second(0)
      .toDate();

    const bookingEnd = dayjs(date)
      .hour(endHour)
      .minute(endMinute)
      .second(0)
      .toDate();

    return {
      room_id: roomId,
      title: title,
      start_time: bookingStart.toISOString(),
      end_time: bookingEnd.toISOString(),
      user_id: userId,
      booking_type: "normal",
      is_repeating: true,
      parent_repeating_id: parentRepeatingId,
      description: null,
    };
  });
}
