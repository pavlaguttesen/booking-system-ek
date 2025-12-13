/**
 * LanguageContext.tsx
 * 
 * Denne fil håndterer sprog-indstillinger for hele applikationen.
 * Den koordinerer mellem brugerens valgte sprog i databasen og i18n translation systemet.
 * 
 * HOVEDFORMÅL:
 * - Holde styr på brugerens valgte sprog (dansk eller engelsk)
 * - Synkronisere sprog-valg med databasen (persistering)
 * - Opdatere i18n translation system når sprog ændres
 * - Levere en central kilde til sandhed for sprog i hele applikationen
 * 
 * FLOW:
 * 1. Ved login: Hent brugerens gemte sprog fra profil (via AuthContext)
 * 2. Når bruger skifter sprog: Opdater lokal state, i18n OG database
 * 3. Ved logout: State ryddes automatisk (via AuthContext re-render)
 * 
 * INTEGRATION:
 * - Læser fra AuthContext (brugerens profil med language felt)
 * - Skriver til Supabase database (profiles.language)
 * - Opdaterer i18n instance (for translation i hele appen)
 */

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/lib/supabaseClient";
import i18n from "@/translate";

/**
 * Type for understøttede sprog i systemet.
 * "da" = Dansk
 * "en" = English (Engelsk)
 */
type Lang = "da" | "en";

/**
 * Type definition for alle værdier tilgængelige gennem LanguageContext.
 * 
 * @property language - Det aktuelt valgte sprog
 * @property setLanguage - Funktion til at skifte sprog (opdaterer state, i18n og database)
 */
type LanguageContextType = {
  language: Lang;
  setLanguage: (lang: Lang) => void;
};

/**
 * Opretter React Context med default værdier.
 * Default til dansk ("da") hvis ingen Provider er sat op.
 */
const LanguageContext = createContext<LanguageContextType>({
  language: "da",
  setLanguage: () => {},
});

/**
 * LanguageProvider leverer sprog context til hele applikationen.
 * 
 * ANSVARSOMRÅDER:
 * - Initialisere sprog state (default dansk)
 * - Læse brugerens gemte sprog fra deres profil
 * - Opdatere sprog når bruger ændrer det
 * - Synkronisere sprog med i18n systemet
 * - Gemme sprog-ændringer i databasen
 * 
 * @param children - Child komponenter der skal have adgang til language context
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Hent bruger data fra AuthContext
  // profile: Indeholder brugerens gemte sprog præference
  // user: Bruges til at opdatere databasen når sprog ændres
  const { profile, user } = useAuth();
  
  // language: Det aktuelt valgte sprog i applikationen
  // Default til dansk ("da") indtil brugerens præference er loaded
  const [language, setLanguageState] = useState<Lang>("da");

  /**
   * Effect der synkroniserer sprog state med brugerens profil.
   * 
   * TRIGGER: Når profile ændres (typisk ved login)
   * 
   * PROCES:
   * 1. Tjek om profil er loaded og indeholder language felt
   * 2. Hvis ja, opdater lokal language state til brugerens gemte præference
   * 
   * Dette sikrer at brugerens valgte sprog anvendes så snart de logger ind.
   */
  useEffect(() => {
    // Hvis bruger har en gemt sprog præference, brug den
    if (profile?.language) {
      setLanguageState(profile.language);
    }
  }, [profile]); // Kør når profile ændres

  /**
   * Opdaterer sproget i alle tre lag: lokal state, i18n system og database.
   * 
   * PROCES (i denne rækkefølge):
   * 1. Opdater lokal state (for øjeblikkelig UI respons)
   * 2. Opdater i18n instance (skifter alle translations i appen)
   * 3. Gem til database hvis bruger er logget ind (for persistering)
   * 
   * BEMÆRK:
   * Database opdatering sker asynkront i baggrunden.
   * Vi venter ikke på den før UI opdateres for bedre brugeroplevelse.
   * 
   * @param newLang - Det nye sprog der skal aktiveres ("da" eller "en")
   */
  const updateLanguage = async (newLang: Lang) => {
    // TRIN 1: Opdater lokal React state
    // Dette trigger re-render og opdaterer UI med det nye sprog
    setLanguageState(newLang);

    // TRIN 2: Opdater i18n translation system
    // Dette skifter alle translations i hele applikationen
    // i18n.changeLanguage() opdaterer også localStorage for i18n
    i18n.changeLanguage(newLang);

    // TRIN 3: Gem sprog præference i database (hvis bruger er logget ind)
    if (user) {
      // Opdater language feltet i brugerens profil
      // Dette gemmes permanent og vil blive loaded ved næste login
      await supabase
        .from("profiles")
        .update({ language: newLang })
        .eq("id", user.id);
    }
  };

  // Render Provider med language state og updater funktion
  return (
    <LanguageContext.Provider value={{ language, setLanguage: updateLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Custom hook til at tilgå language context i komponenter.
 * 
 * BRUG:
 * ```tsx
 * const { language, setLanguage } = useLanguage();
 * 
 * // Læs nuværende sprog
 * console.log(language); // "da" eller "en"
 * 
 * // Skift sprog
 * setLanguage("en"); // Skifter til engelsk
 * ```
 * 
 * BEMÆRK:
 * Denne hook skal bruges inden for en LanguageProvider.
 * Hvis brugt uden for Provider, returneres default værdierne.
 * 
 * @returns LanguageContextType objekt med sprog state og setter funktion
 */
export function useLanguage() {
  return useContext(LanguageContext);
}
