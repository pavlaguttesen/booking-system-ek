/**
 * NavBar - Hovednavigationskomponent til bookingsystemet
 * 
 * Denne komponent udgør den primære navigationslinje i applikationen og vises på alle sider
 * undtagen login-siden. Den giver brugeren adgang til de centrale funktionaliteter og tilpasser
 * sig dynamisk efter brugerens rolle og autentificeringstilstand.
 * 
 * ARKITEKTUR:
 * - Client-side komponent der gengives efter hydration
 * - Integrerer med AuthContext for rollebaseret navigation
 * - Integrerer med i18next for flersproget interface
 * - Håndterer settings overlay state lokalt
 * 
 * NAVIGATION STRUKTUR:
 * - Logo: Returnerer altid til hovedkalendersiden (/)
 * - Kalender: Link til booking timeline oversigt (/)
 * - Mine Bookinger: Link til brugerens personlige bookinger (/mypage)
 * - Indstillinger: Åbner overlay med system- og præferenceindstillinger
 * - Admin: Vises KUN for brugere med admin-rolle, giver adgang til administrationspanel
 * 
 * ROLLE-BASERET ADGANGSKONTROL:
 * - Standard links (Kalender, Mine Bookinger, Indstillinger) er tilgængelige for alle
 * - Admin-link vises kun hvis brugerens rolle er "admin"
 * - Rolleinformation hentes fra AuthContext gennem useAuth hook
 */

"use client";

// Next.js navigation og billedhåndtering
import Link from "next/link";
import Image from "next/image";

// React state management
import { useState } from "react";

// Context og authentication
import { useAuth } from "@/context/AuthContext";

// Komponenter
import SettingsOverlay from "./settings/SettingsOverlay";

// Internationalisering
import { useTranslation } from "react-i18next";

/**
 * NavBar komponent
 * 
 * Hovednavigationslinje der viser EK logo, primære navigationlinks, indstillingsknap
 * og admin-adgang baseret på brugerrolle.
 * 
 * @returns JSX.Element - Header element med navigation og overlay til indstillinger
 */
export default function NavBar() {
  // Hent brugerens rolle fra authentication context
  // Bruges til at bestemme om admin-link skal vises
  const { role } = useAuth();
  
  // Lokal state til at håndtere åbning/lukning af indstillinger overlay
  // true = overlay er åben, false = overlay er lukket
  const [openSettings, setOpenSettings] = useState(false);
  
  // Hent oversættelsesfunktion fra i18next
  // Bruges til at vise navigationstekster på brugerens valgte sprog
  const { t } = useTranslation();

  return (
    <>
      {/* Hovedheader med navigationselementer */}
      <header className="w-full bg-secondary-200 px-10 py-4 flex justify-between items-center">
        
        {/* VENSTRE SEKTION: Logo med link til hovedsiden */}
        <Link href="/" className="flex items-center gap-4">
          {/* 
            EK logo - klikbart element der altid fører tilbage til kalenderoversigten
            Følger standard webkonventioner hvor logo fungerer som "hjem"-knap
          */}
          <Image
            src="/ek_logo_business-blue_rgb.png"
            alt="Erhvervsakademiet København"
            width={140}
            height={50}
          />
        </Link>

        {/* HØJRE SEKTION: Primær navigation med links og funktioner */}
        <nav className="flex gap-10 text-primary-600 font-sm text-lg">
          
          {/* Link 1: Kalender - Viser booking timeline med alle lokaler og bookinger */}
          <Link href="/" className="hover:underline">
            {/* Oversæt "Kalender" til brugerens valgte sprog */}
            {t("navbar.calender")}
          </Link>

          {/* Link 2: Mine Bookinger - Brugerens personlige bookingsoversigt */}
          <Link href="/mypage" className="hover:underline">
            {/* Oversæt "Mine Bookinger" til brugerens valgte sprog */}
            {t("navbar.mybookings")}
          </Link>

          {/* 
            Knap: Indstillinger - Åbner overlay med system- og brugerindstillinger
            Bruger button i stedet for Link da dette ikke er en rute, men en overlay
          */}
          <button
            onClick={() => setOpenSettings(true)} // Sæt state til true for at vise overlay
            className="hover:underline"
          >
            {/* Oversæt "Indstillinger" til brugerens valgte sprog */}
            {t("navbar.settings")}
          </button>

          {/* 
            BETINGET RENDERING: Admin-link
            Vises KUN hvis brugerens rolle er "admin"
            Giver adgang til administrationspanel med lokalestyring, statistikker og avancerede funktioner
          */}
          {role === "admin" && (
            <Link href="/admin" className="hover:underline">
              Admin
            </Link>
          )}
        </nav>
      </header>

      {/* 
        Settings Overlay - Modal dialog til systemindstillinger
        Vises ovenpå al andet indhold når openSettings er true
        
        Props:
        - open: Boolean der styrer om overlay er synlig (kontrolleret af lokal state)
        - onClose: Callback der kaldes når brugeren lukker overlay (nulstiller state til false)
      */}
      <SettingsOverlay
        open={openSettings}
        onClose={() => setOpenSettings(false)} // Luk overlay ved at sætte state tilbage til false
      />
    </>
  );
}
