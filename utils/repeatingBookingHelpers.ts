import dayjs from "dayjs";

export type RecurrenceType = "daily" | "weekly" | "biweekly" | "monthly";

/**
 * Generates an array of dates based on recurrence pattern
 * @param startDate The starting date for the recurrence
 * @param endDate The end date (bookings won't be created after this date)
 * @param recurrenceType The type of recurrence
 * @returns Array of dates for the recurrence
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
 * Creates individual booking objects from a repeating booking template
 * @param dates Array of dates for the recurrence
 * @param startTime Time portion of the booking (e.g., 10:00)
 * @param endTime Time portion of the booking (e.g., 12:00)
 * @param roomId The room ID
 * @param title Booking title
 * @param userId User ID (usually admin)
 * @param parentRepeatingId The ID of the repeating booking record
 * @returns Array of booking objects ready to insert
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
