/**
 * NavbarWrapper - Betinget wrapper til navigationslinje
 * 
 * Denne komponent fungerer som en intelligent wrapper omkring navigationslinjen,
 * der kontrollerer hvor og hvornår navigationen skal vises i applikationen.
 * 
 * FORMÅL I ARKITEKTUREN:
 * - Implementerer rute-baseret betinget rendering af navigation
 * - Skjuler navigation på login-siden for en renere login-oplevelse
 * - Fungerer som indirektionslag mellem layout og navigation
 * - Gør det nemt at tilføje flere betingelser for navigation-visning i fremtiden
 * 
 * NAVIGATION LOGIK:
 * - På /login ruten: Navigation skjules HELT (return null)
 * - På alle andre ruter: Navigation vises normalt (render children)
 * 
 * DESIGN BESLUTNINGER:
 * - Login-siden har sit eget dedikerede layout uden navigation
 * - Dette sikrer en fokuseret login-oplevelse uden distraktioner
 * - Holder adskillelse mellem offentlige (login) og beskyttede (app) sider
 * 
 * @param children - NavBar komponent eller andet indhold der skal wrappes
 */

"use client";

// Next.js navigation hooks
import { usePathname } from "next/navigation";

/**
 * NavbarWrapper komponent
 * 
 * Props interface:
 * @param children - React children der skal wrappes (typisk NavBar komponenten)
 */
export default function NavbarWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  // Hent den aktuelle rute/pathname fra Next.js router
  // Returnerer den fulde pathname, f.eks. "/", "/login", "/admin", etc.
  const pathname = usePathname();

  // BETINGET RENDERING: Skjul navigation på login-siden
  // Hvis brugeren er på login-ruten, vis INTET (return null)
  // Dette sikrer at login-siden har et rent, dedikeret interface uden navigation
  if (pathname === "/login") return null;

  // For alle andre ruter: Render children (navigationen) normalt
  // Fragment (<></>) bruges da vi ikke behøver en ekstra wrapper-div
  return <>{children}</>;
}
