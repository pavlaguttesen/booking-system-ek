/**
 * ThemeContext.tsx
 * 
 * Denne fil håndterer tema/appearance indstillinger for hele applikationen.
 * Den koordinerer mellem brugerens valgte tema i databasen og DOM styling.
 * 
 * HOVEDFORMÅL:
 * - Holde styr på brugerens valgte tema (lys eller mørk tilstand)
 * - Synkronisere tema-valg med databasen (persistering)
 * - Anvende tema på DOM via data-theme attribut
 * - Levere en central kilde til sandhed for tema i hele applikationen
 * 
 * FLOW:
 * 1. Ved login: Hent brugerens gemte tema fra profil (via AuthContext)
 * 2. Når bruger skifter tema: Opdater lokal state, DOM OG database
 * 3. Ved logout: State ryddes automatisk (via AuthContext re-render)
 * 
 * TEKNISK IMPLEMENTATION:
 * - Bruger data-theme attribut på document.documentElement (html tag)
 * - CSS variabler responderer på data-theme for styling
 * - Tailwind CSS konfiguration bruger data-theme til dark mode
 * 
 * INTEGRATION:
 * - Læser fra AuthContext (brugerens profil med theme felt)
 * - Skriver til Supabase database (profiles.theme)
 * - Opdaterer DOM (document.documentElement)
 */

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/lib/supabaseClient";

/**
 * Type definition for alle værdier tilgængelige gennem ThemeContext.
 * 
 * @property theme - Det aktuelt valgte tema ("light" for lyst, "dark" for mørkt)
 * @property setTheme - Funktion til at skifte tema (opdaterer state, DOM og database)
 */
type ThemeContextType = {
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
};

/**
 * Opretter React Context med default værdier.
 * Default til lyst tema ("light") hvis ingen Provider er sat op.
 */
const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
});

/**
 * ThemeProvider leverer tema context til hele applikationen.
 * 
 * ANSVARSOMRÅDER:
 * - Initialisere tema state (default lyst)
 * - Læse brugerens gemte tema fra deres profil
 * - Anvende tema når bruger ændrer det
 * - Opdatere DOM med korrekt tema attribut
 * - Gemme tema-ændringer i databasen
 * 
 * @param children - Child komponenter der skal have adgang til theme context
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Hent bruger data fra AuthContext
  // profile: Indeholder brugerens gemte tema præference
  // user: Bruges til at opdatere databasen når tema ændres
  const { profile, user } = useAuth();
  
  // theme: Det aktuelt valgte tema i applikationen
  // Default til lyst tema ("light") indtil brugerens præference er loaded
  const [theme, setThemeState] = useState<"light" | "dark">("light");

  /**
   * Effect der synkroniserer tema state med brugerens profil.
   * 
   * TRIGGER: Når profile ændres (typisk ved login)
   * 
   * PROCES:
   * 1. Tjek om profil er loaded og indeholder theme felt
   * 2. Hvis ja, anvend brugerens gemte tema (opdaterer både state og DOM)
   * 
   * Dette sikrer at brugerens valgte tema anvendes så snart de logger ind.
   */
  useEffect(() => {
    // Hvis bruger har en gemt tema præference, anvend den
    if (profile?.theme) {
      applyTheme(profile.theme);
    }
  }, [profile]); // Kør når profile ændres

  /**
   * Anvender et tema i alle tre lag: DOM, lokal state og database.
   * 
   * PROCES (i denne rækkefølge):
   * 1. Opdater DOM data-theme attribut (for øjeblikkelig visual ændring)
   * 2. Opdater lokal state (for React re-renders)
   * 3. Gem til database hvis bruger er logget ind (for persistering)
   * 
   * DOM MEKANIK:
   * - Sætter data-theme="light" eller data-theme="dark" på <html> element
   * - CSS variabler og Tailwind reagerer på denne attribut
   * - Ændringen er øjeblikkelig (ingen flicker)
   * 
   * BEMÆRK:
   * Database opdatering sker asynkront i baggrunden.
   * Vi venter ikke på den før UI opdateres for bedre brugeroplevelse.
   * 
   * @param newTheme - Det nye tema der skal aktiveres ("light" eller "dark")
   */
  const applyTheme = async (newTheme: "light" | "dark") => {
    // TRIN 1: Opdater DOM øjeblikkeligt
    // Sæt data-theme attribut på root HTML element
    // CSS variabler defineret i globals.css reagerer på denne attribut
    document.documentElement.setAttribute("data-theme", newTheme);
    
    // TRIN 2: Opdater lokal React state
    // Dette sikrer at komponenter der læser theme state re-renderes korrekt
    setThemeState(newTheme);

    // TRIN 3: Gem tema præference i database (hvis bruger er logget ind)
    if (user) {
      // Opdater theme feltet i brugerens profil
      // Dette gemmes permanent og vil blive loaded ved næste login
      await supabase
        .from("profiles")
        .update({ theme: newTheme })
        .eq("id", user.id);
    }
  };

  // Render Provider med theme state og updater funktion
  return (
    <ThemeContext.Provider value={{ theme, setTheme: applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Custom hook til at tilgå theme context i komponenter.
 * 
 * BRUG:
 * ```tsx
 * const { theme, setTheme } = useTheme();
 * 
 * // Læs nuværende tema
 * console.log(theme); // "light" eller "dark"
 * 
 * // Skift tema
 * setTheme("dark"); // Skifter til mørkt tema
 * ```
 * 
 * BEMÆRK:
 * Denne hook skal bruges inden for en ThemeProvider.
 * Hvis brugt uden for Provider, returneres default værdierne.
 * 
 * @returns ThemeContextType objekt med tema state og setter funktion
 */
export function useTheme() {
  return useContext(ThemeContext);
}
