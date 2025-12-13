/**
 * LayoutClient - Client-side hovedlayout komponent
 * 
 * Dette er den primære layout wrapper for hele applikationen og udgør det øverste lag
 * i komponenthierarkiet efter root layout. Den håndterer den overordnede struktur og
 * betinget rendering af navigation baseret på den aktuelle rute.
 * 
 * ARKITEKTUR OG ROLLE:
 * - Top-level client component der wrapper alt app-indhold
 * - Bruges fra root layout (app/layout.tsx) til at tilføje client-side funktionalitet
 * - Implementerer rute-afhængig navigation rendering
 * - Tilbyder portal mount point for overlays og modals
 * 
 * KOMPONENT STRUKTUR:
 * 1. Navigation (betinget) - Vises kun hvis IKKE på login-siden
 * 2. Sideindhold (children) - Dynamisk indhold fra child routes
 * 3. Overlay portal - Mount point for alle overlays/modals i appen
 * 
 * NAVIGATION LOGIK:
 * - Login-side (/login): Navigation skjules HELT - ren login interface
 * - Alle andre sider: Navigation vises via NavbarWrapper og NavBar
 * - NavbarWrapper giver ekstra lag af kontrol for navigation-visning
 * 
 * PORTAL SYSTEM:
 * - #overlay-root div fungerer som mount point for React portals
 * - Alle overlays (booking, settings, delete, etc.) renderes her
 * - Sikrer overlays altid er ovenpå andet indhold (z-index kontrol)
 * - Holder overlay-komponenter adskilt fra normal document flow
 */

"use client";

// Next.js navigation
import { usePathname } from "next/navigation";

// Navigationskomponenter
import NavBar from "@/components/NavBar";
import NavbarWrapper from "@/components/NavbarWrapper";

/**
 * LayoutClient komponent
 * 
 * Props interface:
 * @param children - Side-specifikt indhold fra child routes (pages)
 *                   Dette er det dynamiske indhold der skifter når brugeren navigerer
 */
export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  // Hent den aktuelle rute/pathname fra Next.js router
  // Bruges til at bestemme om vi er på login-siden
  const pathname = usePathname();
  
  // Beregn om den aktuelle side er login-siden
  // true hvis pathname er nøjagtig "/login", false ellers
  const isLoginPage = pathname === "/login";

  return (
    <>
      {/* 
        BETINGET NAVIGATION RENDERING
        Navigation vises KUN hvis vi IKKE er på login-siden
        
        Dobbelt lag af beskyttelse:
        1. Denne betingelse (!isLoginPage) - Første tjek på layout niveau
        2. NavbarWrapper - Anden tjek inde i wrapper komponenten
        
        Dette dobbelte lag sikrer robust håndtering af navigation-visning
        og gør det nemt at udvide logikken i fremtiden
      */}
      {!isLoginPage && (
        <NavbarWrapper>
          {/* 
            NavBar - Hovednavigationslinje med logo, links og indstillinger
            Se NavBar.tsx for detaljeret dokumentation af navigation funktioner
          */}
          <NavBar />
        </NavbarWrapper>
      )}

      {/* 
        HOVED INDHOLD
        Dynamisk sideindhold fra child routes
        Dette er hvor page.tsx komponenter fra forskellige ruter renderes:
        - / -> app/page.tsx (booking kalender)
        - /mypage -> app/mypage/page.tsx (brugerens bookinger)
        - /admin -> app/admin/page.tsx (admin panel)
        - /login -> app/login/page.tsx (login formular)
      */}
      {children}

      {/* 
        OVERLAY PORTAL ROOT
        Portal mount point for alle overlays og modals i applikationen
        
        FORMÅL:
        - React portals kan rendre komponenter ind i denne div fra hvor som helst i appen
        - Sikrer overlays altid er ovenpå andet indhold (kan styles med z-index)
        - Holder overlay DOM-struktur adskilt fra normal side-struktur
        
        ANVENDELSE:
        Følgende overlays bruger denne portal:
        - CreateBookingOverlay - Opret ny booking
        - EditRoomOverlay - Rediger lokale-information
        - DeleteRoomOverlay - Slet lokale
        - DeleteBookingsOverlay - Slet bookinger
        - SelectRoomOverlay - Vælg lokale til booking
        - ErrorOverlay - Vis fejlbeskeder
        - SettingsOverlay - Systemindstillinger (render direkte i NavBar)
        
        Id "overlay-root" bruges af overlay komponenter til at finde mount point
      */}
      <div id="overlay-root"></div>
    </>
  );
}
