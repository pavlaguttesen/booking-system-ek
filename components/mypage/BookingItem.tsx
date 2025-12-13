/**
 * BookingItem Komponent
 * 
 * Viser en enkelt booking i brugerens booking-liste med alle relevante detaljer
 * og mulighed for at slette bookingen. Komponenten håndterer dato- og tidsformatering
 * baseret på brugerens sprog-indstillinger.
 * 
 * Funktionalitet:
 * - Viser booking-dato i dansk/engelsk format (f.eks. "onsdag d. 15/05-25")
 * - Viser lokale-navn, tidspunkt og booking-type
 * - Formaterer tidspunkter i dansk notation (HH.mm)
 * - Tillader sletning af booking med database-opdatering
 * - Genindlæser parent liste efter sletning
 * 
 * Props:
 * @param booking - Booking objekt med felter: id, start_time, end_time, rooms
 * @param reload - Callback funktion til at genindlæse booking-listen efter sletning
 * 
 * Dato/Tid Formatering:
 * - Dag: "dddd [d.] DD/MM-YY" (f.eks. "mandag d. 13/12-25")
 * - Tid: "HH.mm" (f.eks. "08.00–10.00")
 * - Sprog: Automatisk baseret på i18n.language
 */

import dayjs from "dayjs";
import "dayjs/locale/da";
import "dayjs/locale/en";
import { createClient } from "@supabase/supabase-js";
import { useTranslation } from "react-i18next";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";

// Opret Supabase klient til database-operationer
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

export default function BookingItem({ booking, reload }: any) {
  // Hent oversættelses-funktion og aktuel sprog-indstilling
  const { t, i18n } = useTranslation();
  
  // Sæt dayjs locale baseret på brugerens valgte sprog (da/en)
  // Dette sikrer korrekt formatering af ugedage og måneder
  dayjs.locale(i18n.language);

  /**
   * Sletter den aktuelle booking fra databasen
   * 
   * Proces:
   * 1. Udfører DELETE query på bookings tabel
   * 2. Kalder reload callback for at opdatere parent liste
   * 
   * Note: Ingen konfirmations-dialog her da det er en brugerhandling
   */
  async function deleteBooking() {
    // Slet booking fra database
    await supabase.from("bookings").delete().eq("id", booking.id);
    
    // Genindlæs listen i parent komponent
    reload();
  }

  // Parse start og slut tidspunkter med dayjs for formatering
  // Parse start og slut tidspunkter med dayjs for formatering
  const start = dayjs(booking.start_time);
  const end = dayjs(booking.end_time);

  return (
    <div className="bg-white p-4 rounded-lg flex justify-between items-center shadow-sm border border-secondary-200">
      {/* VENSTRE INFO - Booking detaljer i kolonner med fast bredde for alignment */}
      <div className="flex items-center gap-8">
        {/* Dato kolonne - Viser ugedag og dato i dansk format */}
        {/* Format: "onsdag d. 13/12-25" (ugedag dag. DD/MM-YY) */}
        <div className="text-sm text-secondary font-medium w-44">
          {start.format("dddd [d.] DD/MM-YY")}
        </div>

        {/* Lokale kolonne - Viser lokale-navn fra joined rooms tabel */}
        <div className="font-semibold w-40 text-secondary">
          {t("booking.room")} {booking.rooms?.room_name}
        </div>

        {/* Tidsrum kolonne - Viser start og slut tid med bindestreg */}
        {/* Format: "08.00–10.00" (dansk tidsformat) */}
        <div className="w-32 text-secondary">
          {start.format("HH.mm")}–{end.format("HH.mm")}
        </div>

        {/* Type kolonne - Viser booking type (studierum, møderum, etc.) */}
        <div className="w-32 text-secondary">{t("booking.studyroom")}</div>
      </div>

      {/* SLET KNAP - Rød X-ikon med hover-effekt */}
      {/* FontAwesome ikon bruges for konsistent design */}
      <button
        onClick={deleteBooking}
        className="cursor-pointer hover:opacity-80 transition"
      >
        <FontAwesomeIcon
          icon={faCircleXmark}
          className="text-red-500 text-2xl"
        />
      </button>
    </div>
  );
}
