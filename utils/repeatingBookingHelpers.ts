// Hjælpefunktioner til håndtering af tilbagevendende bookinger.
// Disse funktioner bruges til at generere serier af bookinger baseret på et gentagelsesmønster.

// Importér dayjs til avanceret dato-manipulation
import dayjs from "dayjs";

// Type definition for de forskellige gentagelsesmønstre systemet understøtter
export type RecurrenceType = "daily" | "weekly" | "biweekly" | "monthly";

/**
 * Genererer et array af datoer baseret på et gentagelsesmønster.
 * Denne funktion bruges til at beregne alle datoer hvor en tilbagevendende booking skal oprettes.
 * 
 * @param startDate - Første dato i gentagelsesserien
 * @param endDate - Sidste mulige dato (bookinger vil ikke blive oprettet efter denne dato)
 * @param recurrenceType - Type af gentagelse (daglig, ugentlig, hver anden uge, månedlig)
 * @returns Array af Date objekter for hver gentagelse
 */
export function generateRecurrenceDates(
  startDate: Date,
  endDate: Date,
  recurrenceType: RecurrenceType
): Date[] {
  // Array til at opbevare alle beregnede datoer
  const dates: Date[] = [];
  
  // Start med den første dato i serien
  let current = dayjs(startDate);
  
  // Konvertér slutdatoen til et dayjs objekt for sammenligning
  const end = dayjs(endDate);

  // Fortsæt med at generere datoer indtil vi når eller overstiger slutdatoen
  while (current.isBefore(end, "day") || current.isSame(end, "day")) {
    // Tilføj den nuværende dato til listen
    dates.push(current.toDate());

    // Beregn næste dato baseret på gentagelsestypen
    switch (recurrenceType) {
      case "daily":
        // Daglig gentagelse: tilføj 1 dag
        current = current.add(1, "day");
        break;
      case "weekly":
        // Ugentlig gentagelse: tilføj 1 uge (7 dage)
        current = current.add(1, "week");
        break;
      case "biweekly":
        // Hver anden uge: tilføj 2 uger (14 dage)
        current = current.add(2, "weeks");
        break;
      case "monthly":
        // Månedlig gentagelse: tilføj 1 måned (håndterer forskellige månedslængder automatisk)
        current = current.add(1, "month");
        break;
    }
  }

  // Returner det komplette array af datoer
  return dates;
}

/**
 * Opretter individuelle bookingsobjekter fra en tilbagevendende bookingskabelon.
 * Denne funktion tager et array af datoer og konverterer dem til komplette booking-objekter
 * med korrekte start- og sluttidspunkter, klar til at blive indsat i databasen.
 * 
 * @param dates - Array af datoer hvor bookinger skal oprettes (fra generateRecurrenceDates)
 * @param startTime - Tidspunkt for bookingens start (f.eks. 10:00)
 * @param endTime - Tidspunkt for bookingens slut (f.eks. 12:00)
 * @param roomId - UUID for det lokale der skal bookes
 * @param title - Titel/navn på bookingen
 * @param userId - UUID for brugeren der opretter bookingen (typisk admin)
 * @param parentRepeatingId - UUID for den tilbagevendende booking-post i repeating_bookings tabellen
 * @returns Array af booking-objekter klar til bulk insert i databasen
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
  // Udtræk time og minut fra start- og sluttidspunkterne
  // Dette gør vi for at kunne anvende samme tid på alle datoer i serien
  const startHour = dayjs(startTime).hour();
  const startMinute = dayjs(startTime).minute();
  const endHour = dayjs(endTime).hour();
  const endMinute = dayjs(endTime).minute();

  // Transformér hver dato til et komplet booking-objekt
  return dates.map((date) => {
    // Opret start-tidspunktet ved at kombinere datoen med starttiden
    const bookingStart = dayjs(date)
      .hour(startHour)        // Sæt den korrekte time
      .minute(startMinute)    // Sæt det korrekte minut
      .second(0)              // Nulstil sekunder for konsistens
      .toDate();

    // Opret slut-tidspunktet ved at kombinere datoen med sluttiden
    const bookingEnd = dayjs(date)
      .hour(endHour)          // Sæt den korrekte time
      .minute(endMinute)      // Sæt det korrekte minut
      .second(0)              // Nulstil sekunder for konsistens
      .toDate();

    // Returner et komplet booking-objekt der matcher databaseskemaet
    return {
      room_id: roomId,                              // Lokale der bookes
      title: title,                                 // Booking titel
      start_time: bookingStart.toISOString(),       // ISO format for Supabase
      end_time: bookingEnd.toISOString(),           // ISO format for Supabase
      user_id: userId,                              // Bruger der opretter bookingen
      booking_type: "normal",                       // Standard booking type
      is_repeating: true,                           // Markér at dette er del af en serie
      parent_repeating_id: parentRepeatingId,       // Reference til parent booking
      description: null,                            // Ingen beskrivelse som standard
    };
  });
}
