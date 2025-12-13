/**
 * Profilkort-komponent der viser brugerens information på Min Side.
 * 
 * Dette kort vises i højre side af Min Side layoutet og indeholder:
 * - Profilbillede (med mulighed for at ændre)
 * - Brugerens fulde navn (fra profil) eller email (fallback)
 * - Brugerens email adresse
 * - Log ud knap
 * 
 * Komponenten henter brugerdata fra AuthContext og viser det i et centreret layout.
 */

"use client"; // Klient-side komponent for interaktivitet

// Importér auth context for at få adgang til brugerdata og logout funktionalitet
import { useAuth } from "@/context/AuthContext";
// Importér oversættelseshook for flersproget interface
import { useTranslation } from "react-i18next";
// Importér profilbillede-komponenten der håndterer upload og visning
import ProfilePicture from "./ProfilePicture";

/**
 * ProfileCard komponent
 * 
 * Viser brugerens profiloplysninger i et kompakt kort-format.
 * Bruger data fra AuthContext og viser fallback værdier hvis data mangler.
 * 
 * @returns Profilkort med billede, navn, email og log ud knap
 */
export default function ProfileCard() {
  // Hent brugerdata og logout funktion fra AuthContext
  // profile: Indeholder full_name og andre profildata fra profiles tabellen
  // user: Indeholder auth data (email, id) fra Supabase Auth
  // logout: Funktion til at logge brugeren ud
  const { profile, user, logout } = useAuth();
  
  // Hook til at hente oversatte tekststrenge
  const { t } = useTranslation();

  return (
    // Container med vertikal flexbox, centreret indhold
    <div className="w-full flex flex-col items-center text-center space-y-3">
      {/* Profilbillede med upload-funktionalitet */}
      <ProfilePicture/>
      
      {/* Brugerens fulde navn */}
      {/* Prioritering: 1) Fuldt navn fra profil, 2) Email, 3) "Ukendt bruger" */}
      <h2 className="text-xl font-semibold text-main">
        {profile?.full_name ?? user?.email ?? t("unknown.unknownUser")}
      </h2>

      {/* Brugerens email adresse (mindre og nedtonet) */}
      <p className="text-sm text-main/70">{user?.email}</p>

      {/* Log ud knap */}
      {/* Kalder logout funktionen fra AuthContext når der klikkes */}
      {/* Rød farve indikerer destruktiv handling */}
      <button
        onClick={logout}
        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 cursor-pointer transition"
      >
        {t("booking.logout")}
      </button>
    </div>
  );
}
