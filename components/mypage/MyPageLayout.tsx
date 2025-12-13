/**
 * Layout-komponent for "Min Side" siden.
 * 
 * Dette er hovedlayoutet for brugerens personlige side, der viser:
 * - Brugerens profilkort med billede og information
 * - Liste over brugerens aktive og kommende bookinger
 * 
 * Layoutet er opdelt i to kolonner:
 * - Venstre: Fuld bredde til bookinglist (responsiv)
 * - Højre: Fast bredde til profilkort (340px)
 */

// Importér profilkort-komponenten der viser brugerinfo og profilbillede
import ProfileCard from "./ProfileCard";
// Importér bookinglist-komponenten der viser brugerens bookinger
import MyBookingList from "./MyBookingList";
// Importér oversættelseshook til flersproget interface
import { useTranslation } from "react-i18next";

/**
 * MyPageLayout komponent
 * 
 * @param user - Bruger objektet fra AuthContext (indeholder id, email, metadata)
 * @returns Layout med profilkort og bookinglist, eller null hvis ingen bruger
 */
export default function MyPageLayout({ user }: any) {
  // Hook til at hente oversatte tekststrenge
  const { t } = useTranslation();
  
  // Hvis ingen bruger er logget ind, vis ingenting
  // Dette er en sikkerhedsforanstaltning, selvom siden normalt er beskyttet
  if (!user) return null;

  return (
    // Container med max bredde og centrering
    <div className="w-full max-w-[1600px] mx-auto px-6 py-6 space-y-8">
      {/* Sidetitel */}
      <h1 className="text-3xl font-bold text-main">{t("booking.mypage")}</h1>

      {/* To-kolonners layout */}
      <div className="flex gap-10">
        {/* Venstre kolonne: Bookinglist (fylder resterende plads) */}
        <div className="flex-1 bg-secondary-300 p-6 rounded-xl border border-secondary-200 shadow-sm">
          {/* Send brugerens ID til bookinglist så den kan filtrere */}
          <MyBookingList userId={user.id} />
        </div>

        {/* Højre kolonne: Profilkort (fast bredde, ingen shrinking) */}
        <div className="w-[340px] shrink-0 bg-secondary-300 p-6 rounded-xl border border-secondary-200 shadow-sm flex justify-center">
          {/* Profilkort henter selv brugerdata fra context */}
          <ProfileCard />
        </div>
      </div>
    </div>
  );
}
