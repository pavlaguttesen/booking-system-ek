/**
 * SettingsContext.tsx
 * 
 * Dette er en kombineret kontekst der håndterer både tema og sprog indstillinger.
 * Den leverer en samlet API for at administrere bruger-præferencer.
 * 
 * FORMÅL:
 * - Samle tema og sprog administration i én context
 * - Levere en simpel API for components der skal ændre begge indstillinger
 * - Synkronisere begge indstillinger med database
 * - Koordinere mellem brugerens gemte præferencer og aktiv UI state
 * 
 * FORHOLD TIL ANDRE CONTEXTS:
 * Dette er en alternativ/legacy implementation til ThemeContext + LanguageContext.
 * Moderne komponenter bør foretrække at bruge de separate contexts (useTheme + useLanguage)
 * for bedre separation of concerns, men denne context er bibeholdt for
 * bagudkompatibilitet med eksisterende komponenter.
 * 
 * INTEGRATION:
 * - Læser fra AuthContext (brugerens profil)
 * - Skriver til Supabase database (profiles.theme og profiles.language)
 * - Opdaterer DOM for tema (document.documentElement)
 * 
 * BEMÆRK:
 * Denne context håndterer IKKE i18n opdatering (i modsætning til LanguageContext).
 * Komponenter der bruger denne skal manuelt håndtere i18n hvis nødvendigt.
 */

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "./AuthContext";

/**
 * Type definition for alle værdier tilgængelige gennem SettingsContext.
 * 
 * @property theme - Det aktuelt valgte tema ("light" eller "dark")
 * @property language - Det aktuelt valgte sprog ("da" eller "en")
 * @property setTheme - Funktion til at ændre tema (opdaterer state, DOM og database)
 * @property setLanguage - Funktion til at ændre sprog (opdaterer state og database, men IKKE i18n)
 */
type SettingsContextType = {
  theme: "light" | "dark";
  language: "da" | "en";
  setTheme: (t: "light" | "dark") => void;
  setLanguage: (l: "da" | "en") => void;
};

/**
 * Opretter React Context med null som default.
 * Komponenter skal bruge useSettings hook som tvinger Provider-wrapping.
 */
const SettingsContext = createContext<SettingsContextType | null>(null);

/**
 * SettingsProvider leverer settings context til komponenter.
 * 
 * ANSVARSOMRÅDER:
 * - Initialisere tema og sprog state (defaults)
 * - Hente brugerens gemte præferencer ved login
 * - Opdatere state når præferencer ændres
 * - Gemme ændringer i database
 * - Anvende tema på DOM
 * 
 * @param children - Child komponenter der skal have adgang til settings context
 */
export function SettingsProvider({ children }: any) {
  // Hent user fra AuthContext for at læse og opdatere profil
  const { user } = useAuth();
  
  // theme: Det aktuelt valgte tema
  // Default til lyst tema ("light") indtil brugerens præference er loaded
  const [theme, setThemeState] = useState<"light" | "dark">("light");
  
  // language: Det aktuelt valgte sprog
  // Default til dansk ("da") indtil brugerens præference er loaded
  const [language, setLanguageState] = useState<"da" | "en">("da");

  /**
   * Effect der henter og anvender brugerens gemte præferencer.
   * 
   * TRIGGER: Når user ændres (typisk ved login/logout)
   * 
   * PROCES:
   * 1. Vent til user er loaded
   * 2. Query database for brugerens theme og language
   * 3. Opdater lokal state med gemte værdier
   * 4. Anvend tema på DOM øjeblikkeligt
   * 
   * BEMÆRK:
   * Dette effect henter kun theme og language (ikke hele profilen)
   * for at minimere data transfer.
   */
  useEffect(() => {
    // Vent på at bruger er logget ind
    if (!user) return;

    // Hent brugerens tema og sprog præferencer fra database
    supabase
      .from("profiles")
      .select("theme, language") // Hent kun de felter vi har brug for
      .eq("id", user.id)
      .single() // Forvent præcis én profil
      .then(({ data }) => {
        if (data) {
          // Opdater lokal state med gemte værdier
          setThemeState(data.theme);
          setLanguageState(data.language);

          // Anvend tema på DOM øjeblikkeligt
          // Dette sikrer at temaet er korrekt fra første render
          document.documentElement.setAttribute("data-theme", data.theme);
        }
      });
  }, [user]); // Kør når user ændres (login/logout)

  /**
   * Opdaterer tema i state, DOM og database.
   * 
   * PROCES (i denne rækkefølge):
   * 1. Opdater lokal state (trigger re-render)
   * 2. Opdater DOM data-theme attribut (visual ændring)
   * 3. Gem til database hvis bruger er logget ind
   * 
   * BEMÆRK:
   * Denne funktion håndterer kun tema-visning.
   * Den opdaterer IKKE CSS variabler eller andre tema-relaterede systemer
   * ud over data-theme attributten.
   * 
   * @param t - Det nye tema der skal aktiveres ("light" eller "dark")
   */
  const setTheme = async (t: "light" | "dark") => {
    // Opdater lokal React state
    setThemeState(t);
    
    // Anvend tema på DOM øjeblikkeligt
    document.documentElement.setAttribute("data-theme", t);

    // Gem til database hvis bruger er logget ind
    if (user)
      await supabase.from("profiles").update({ theme: t }).eq("id", user.id);
  };

  /**
   * Opdaterer sprog i state og database.
   * 
   * PROCES:
   * 1. Opdater lokal state (trigger re-render)
   * 2. Gem til database hvis bruger er logget ind
   * 
   * VIGTIGT:
   * Denne funktion opdaterer IKKE i18n translation systemet.
   * Hvis komponenter har brug for fuld i18n support, bør de bruge
   * LanguageContext (useLanguage) i stedet for denne context.
   * 
   * Dette er primært til at gemme sprog præference, ikke til
   * at håndtere translations i realtid.
   * 
   * @param l - Det nye sprog der skal gemmes ("da" eller "en")
   */
  const setLanguage = async (l: "da" | "en") => {
    // Opdater lokal React state
    setLanguageState(l);

    // Gem til database hvis bruger er logget ind
    // BEMÆRK: i18n opdateres IKKE her (i modsætning til LanguageContext)
    if (user)
      await supabase.from("profiles").update({ language: l }).eq("id", user.id);
  };

  // Render Provider med alle settings værdier og updater funktioner
  return (
    <SettingsContext.Provider
      value={{ theme, language, setTheme, setLanguage }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

/**
 * Custom hook til at tilgå settings context i komponenter.
 * 
 * BRUG:
 * ```tsx
 * const { theme, language, setTheme, setLanguage } = useSettings();
 * 
 * // Læs nuværende indstillinger
 * console.log(theme);    // "light" eller "dark"
 * console.log(language); // "da" eller "en"
 * 
 * // Ændre indstillinger
 * setTheme("dark");      // Skifter til mørkt tema
 * setLanguage("en");     // Gemmer engelsk som præference (opdaterer IKKE i18n)
 * ```
 * 
 * BEMÆRK - VIGTIG BEGRÆNSNING:
 * setLanguage opdaterer IKKE i18n systemet.
 * Hvis du har brug for fuld sprog-skift funktionalitet med translation updates,
 * brug i stedet useLanguage() fra LanguageContext.
 * 
 * SIKKERHED:
 * Bruger non-null assertion (!) fordi vi forventer at context altid er sat op.
 * Hvis brugt uden for SettingsProvider vil dette kaste en runtime fejl.
 * 
 * @returns SettingsContextType objekt med tema, sprog og setter funktioner
 */
export const useSettings = () => useContext(SettingsContext)!;
