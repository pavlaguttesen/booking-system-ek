/**
 * ROOT LAYOUT - APPLIKATIONENS HOVED-LAYOUT
 * 
 * Dette er root layout-filen for hele Next.js applikationen. Den wrapper alle sider
 * og definerer den globale struktur der er fælles for hele applikationen.
 * 
 * ROUTING KONTEKST:
 * - Dette er en Server Component (default i Next.js 13+)
 * - Filen ligger i app/layout.tsx og gælder for alle ruter i applikationen
 * - Alle undersider renders ind i {children} parameteren
 * 
 * PROVIDERS HIERARKI (vigtigt - inderste først):
 * 1. ThemeProvider - Håndterer lys/mørk tema og farver
 * 2. LanguageProvider - Håndterer sprog (dansk/engelsk)
 * 3. MantineProvider - UI-komponent bibliotek (modals, dates, etc.)
 * 4. AuthProvider - Autentificering og bruger-session
 * 5. SettingsProvider - Brugerindstillinger og præferencer
 * 
 * VIGTIGE KOMPONENTER:
 * - NavbarWrapper & NavBar - Navigation der vises på alle sider
 * - overlay-root - Container til modals/overlays (SKAL være udenfor MantineProvider)
 */

import type { Metadata } from "next";
import "./globals.css";

// Mantine UI bibliotek styles - bruges til modals, datepickers, etc.
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";

import { MantineProvider, createTheme } from "@mantine/core";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { SettingsProvider } from "@/context/SettingsContext";
import "../translate/index";

import { AuthProvider } from "@/context/AuthContext";

import NavbarWrapper from "@/components/NavbarWrapper";
import NavBar from "@/components/NavBar";

/**
 * METADATA - Next.js metadata export til SEO og browser tabs
 * Definerer titlen og beskrivelsen der vises i browser tab og søgemaskiner
 */
export const metadata: Metadata = {
  title: "Booking system",
  description: "Book lokaler til undervisning og eksamen",
};

/**
 * FONT KONFIGURATION - Google Fonts Inter
 * Loader Inter skrifttype og definerer CSS variabel --font-sans
 * 
 * @param subsets - Hvilket charset der skal loades (latin for dansk/engelsk)
 * @param variable - CSS variabel navn der kan bruges i Tailwind config
 * @param display - Font display strategi ("swap" = vis fallback mens font loader)
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

/**
 * MANTINE TEMA KONFIGURATION
 * Definerer custom farvepalette og styling for Mantine komponenter
 * 
 * PRIMARY FARVER:
 * - Array med 10 nuancer fra lys til mørk (standard Mantine format)
 * - Index 9 (#0038A7) er primær farve - business blue fra EK
 * 
 * FONT FAMILY:
 * - Bruger Inter via CSS variabel defineret ovenfor
 * - Gælder både normal tekst og headings
 */
const theme = createTheme({
  colors: {
    primary: [
      "#E9ECFF", // 0 - Meget lys blå
      "#CBD1FF", // 1
      "#B7C2E6", // 2
      "#AAB6DE", // 3
      "#8798D0", // 4
      "#6075B5", // 5
      "#4A5EA3", // 6
      "#344890", // 7
      "#1F327D", // 8
      "#0038A7", // 9 - EK Business Blue (primær)
    ],
  },
  primaryColor: "primary",
  primaryShade: 9, // Bruger index 9 fra array ovenfor
  fontFamily: "var(--font-sans), Inter, sans-serif",
  headings: { fontFamily: "var(--font-sans), Inter, sans-serif" },
});

/**
 * ROOT LAYOUT COMPONENT
 * 
 * Dette er hovedkomponenten der wrapper hele applikationen.
 * Det er en Server Component, så den renderer på serveren.
 * 
 * @param children - Alle undersider renders her (injiceres af Next.js router)
 * 
 * STRUKTUR:
 * 1. <html> tag med dansk sprog og Inter font CSS variabel
 * 2. <body> med Tailwind utility classes for baggrund og tekst
 * 3. Provider hierarki (se kommentar øverst)
 * 4. NavbarWrapper + NavBar - Global navigation
 * 5. {children} - Sidernes indhold renders her
 * 6. overlay-root div - Portal target for overlays/modals
 * 
 * VIGTIG NOTE OM OVERLAY-ROOT:
 * Denne div SKAL være udenfor MantineProvider for at modals fungerer korrekt.
 * Den bruges som React Portal target via ReactDOM.createPortal i overlay komponenter.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="da" className={inter.variable}>
      <body className="bg-page text-main font-sans">
        {/* Tema provider - Lys/mørk mode */}
        <ThemeProvider>
          {/* Sprog provider - Dansk/engelsk oversættelse */}
          <LanguageProvider>
            {/* Mantine UI provider - UI komponenter og styling */}
            <MantineProvider theme={theme} defaultColorScheme="light">
              {/* Autentificering provider - Login session og brugerdata */}
              <AuthProvider>
                {/* Indstillinger provider - Brugerindstillinger */}
                <SettingsProvider>
                  {/* Navigation wrapper og bar - Vises på alle sider */}
                  <NavbarWrapper>
                    <NavBar />
                  </NavbarWrapper>

                  {/* Sideindhold - Her renders alle undersider */}
                  {children}
                </SettingsProvider>
              </AuthProvider>
            </MantineProvider>
          </LanguageProvider>
        </ThemeProvider>

        {/* 
          OVERLAY ROOT CONTAINER
          Portal target for alle overlays/modals i applikationen.
          VIGTIGT: Må IKKE ligge inde i MantineProvider for at undgå z-index konflikter.
        */}
        <div id="overlay-root"></div>
      </body>
    </html>
  );
}
