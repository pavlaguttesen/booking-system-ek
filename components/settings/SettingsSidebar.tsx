/**
 * SettingsSidebar Komponent
 * 
 * Sidebar navigations-komponent til indstillinger modal. Viser en liste af
 * indstillings-sektioner med ikoner og håndterer navigation mellem dem.
 * Indeholder også et bruger-profil kort nederst der linker til Min Side.
 * 
 * Funktionalitet:
 * - Navigation knapper til tre indstillings-sektioner
 * - Visuel indikation af aktiv sektion (highlight)
 * - Hover-effekter på navigation items
 * - Bruger-profil kort med avatar og email
 * - Link til Min Side der også lukker modal
 * - Oversættelse af labels via i18n
 * 
 * Props:
 * @param activePage - ID på den aktuelle aktive indstillings-side
 * @param setActivePage - Callback til at ændre aktiv side
 * @param onClose - Callback til at lukke modal (bruges når man går til Min Side)
 * 
 * Navigation Items:
 * - apparance: Udseende/tema indstillinger
 * - language: Sprog-indstillinger
 * - rules: Booking-regler baseret på brugerrolle
 */

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

export default function SettingsSidebar({
  activePage,
  setActivePage,
  onClose
}: {
  activePage: string;
  setActivePage: (page: string) => void;
  onClose: () => void;

}) {
  // Oversættelses-funktionalitet til labels
  const { t } = useTranslation();
  
  // Hent bruger og profil data fra AuthContext
  const { user, profile } = useAuth();

  // Array af navigation items med id, oversættelse-nøgle og emoji-ikon
  // Array af navigation items med id, oversættelse-nøgle og emoji-ikon
  const items = [
    { id: "apparance", label: t("settings.appearance_title"), icon: "🎨" },
    { id: "language", label: t("settings.language_title"), icon: "🌐" },
    { id: "rules", label: t("settings.rules_title"), icon: "📜" },
  ];

  return (
    <div
      className="w-64 p-4 flex flex-col rounded-l-xl"
      style={{
        backgroundColor: "var(--color-secondary-200",
        color: "var(--color-text-main",
      }}
    >
      {/* Map over navigation items og render knapper */}
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => setActivePage(item.id)} // Skift aktiv side ved klik
          className={`flex items-center gap-3 p-3 rounded-lg text-left transition
            ${
              // Highlight aktiv side med lysere baggrund
              activePage === item.id ? "bg-white/40" : "hover:bg-white/40"
            }`}
        >
          <span>{item.icon}</span>
          {item.label}
        </button>
      ))}

      {/* Bruger-profil kort nederst i sidebar */}
      {/* mt-auto skubber dette element til bunden af flex container */}
      <Link
        href="/mypage"
        className="mt-auto bg-white/40 p-4 rounded-lg flex items-center gap-3 hover:bg-white/80 transition"
        onClick={onClose} // Lukker modal når brugeren navigerer til Min Side
      >
        {/* Profilbillede - viser brugerens avatar eller standard ikon */}
        <img
          src={profile?.avatar_url || "https://vmyzbnqvfwwmhoazveei.supabase.co/storage/v1/object/public/avatar/user-regular-full.svg"}
          className="w-10 h-10 rounded-full object-cover bg-white border border-gray-300"
        />

        {/* Bruger info - navn og email */}
        <div>
          <p className="font-xs text-gray-600">
            {profile?.full_name || "Bruger"}
          </p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>

      </Link>
    </div>
  );
}
