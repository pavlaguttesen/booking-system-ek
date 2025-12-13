/**
 * MyBookingList Komponent
 * 
 * Viser en liste over brugerens aktuelle og fremtidige bookinger med mulighed
 * for direkte sletning. Komponenten henter data fra Supabase og viser også
 * booking-kvoten for studerende (max 4 bookinger).
 * 
 * Funktionalitet:
 * - Henter alle bookinger for den givne bruger fra databasen
 * - Sorterer bookinger efter starttidspunkt (stigende)
 * - Viser booking-tæller for studerende (X/4)
 * - Tillader brugere at slette deres egne bookinger
 * - Genindlæser data efter sletning
 * 
 * Props:
 * @param userId - ID på den bruger hvis bookinger skal vises
 * 
 * Database struktur:
 * - Tabel: 'bookings' joined med 'rooms' (indeholder lokale-information)
 * - Felter: id, user_id, start_time, end_time, room_id, rooms(*)
 */

import { useEffect, useState } from "react";
import BookingItem from "./BookingItem";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

// Opret Supabase klient til database-kommunikation
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

export default function MyBookingList({ userId }: any) {
  // State til at holde listen over brugerens bookinger
  const [bookings, setBookings] = useState<any[]>([]);
  
  // Hent brugerrolle for at vise kvote-tæller til studerende
  const { role: userRole } = useAuth();
  
  // Oversættelses-funktionalitet
  const { t } = useTranslation();

  /**
   * Henter brugerens bookinger fra databasen
   * 
   * Proces:
   * 1. Foretager SELECT query med JOIN på rooms tabel
   * 2. Filtrerer kun bookinger for den aktuelle bruger
   * 3. Sorterer efter starttidspunkt (ældste først)
   * 4. Opdaterer state med resultat
   */
  async function load() {
    const { data } = await supabase
      .from("bookings")
      .select("*, rooms(*)") // Henter booking data samt relateret lokale-info
      .eq("user_id", userId) // Filtrer kun denne brugers bookinger
      .order("start_time", { ascending: true }); // Sorter kronologisk

    // Opdater state, brug tom array hvis ingen data
    setBookings(data || []);
  }

  // Hent bookinger når komponenten mountes første gang
  useEffect(() => {
    load();
  }, []);

  // Tjek om studerende har nået max antal bookinger (4)
  // Tjek om studerende har nået max antal bookinger (4)
  const isFull = bookings.length >= 4;

  return (
    <>
      {/* Header med titel og booking-tæller */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-semibold text-main">{t("booking.mybookings")}</h2>

        {/* Vis booking-kvote kun for studerende (max 4 bookinger) */}
        {userRole === "student" && (
          <span
            className={
              "font-medium text-lg " +
              // Rød tekst hvis kvoten er nået, ellers normal farve
              (isFull ? "text-red-600" : "text-main/70")
            }
          >
            {bookings.length}/4
          </span>
        )}
      </div>

      {/* Liste af booking-items med vertikal spacing */}
      <div className="flex flex-col gap-4">
        {/* Map over alle bookinger og render et BookingItem for hver */}
        {/* reload callback sendes med så BookingItem kan genindlæse listen efter sletning */}
        {bookings.map((b) => (
          <BookingItem key={b.id} booking={b} reload={load} />
        ))}
      </div>
    </>
  );
}
