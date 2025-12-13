/**
 * AuthContext.tsx
 * 
 * Denne fil implementerer authentication context for hele applikationen.
 * Den håndterer brugerauthentificering via Supabase, holder styr på login-status,
 * brugerdata, profil-information og roller.
 * 
 * HOVEDFORMÅL:
 * - Håndtere bruger login/logout state gennem hele applikationen
 * - Hente og cache bruger-profil fra databasen
 * - Levere brugerrolle for autorisation (student/teacher/admin)
 * - Lytte efter auth state ændringer i realtid
 * - Levere en central kilde til sandhed for brugerdata
 * 
 * BRUGES AF:
 * - Alle komponenter der behøver at vide om brugeren er logget ind
 * - Komponenter der skal vise brugerspecifikt indhold
 * - Guards der skal beskytte ruter baseret på rolle
 * - ThemeContext og LanguageContext der læser bruger-præferencer
 */

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

/**
 * Type definition for en brugerprofil fra databasen.
 * 
 * VIGTIGT: Denne type SKAL inkludere alle felter der bruges af ThemeContext og LanguageContext.
 * Dette sikrer at hele applikationen har adgang til bruger-præferencer.
 * 
 * @property id - UUID der matcher Supabase auth user id (primary key)
 * @property full_name - Brugerens fulde navn (kan være null hvis ikke udfyldt)
 * @property role - Brugerens rolle i systemet, afgør adgangsrettigheder
 * @property avatar_url - URL til brugerens profilbillede (optional, kan være null)
 * @property language - Brugerens foretrukne sprog ("da" for dansk, "en" for engelsk)
 * @property theme - Brugerens foretrukne tema ("light" for lyst tema, "dark" for mørkt tema)
 */
export type Profile = {
  id: string;
  full_name: string | null;
  role: "student" | "teacher" | "admin";
  avatar_url?: string | null;
  language?: "da" | "en" | null;
  theme?: "light" | "dark" | null;
};

/**
 * Type definition for alle værdier der er tilgængelige gennem AuthContext.
 * Dette er den contract som alle komponenter kan forlade sig på.
 * 
 * @property user - Supabase auth User objekt (null hvis ikke logget ind)
 * @property profile - Brugerens profil fra vores database (null hvis ikke logget ind eller ikke hentet endnu)
 * @property role - Brugerens rolle som string for nem adgang (null hvis ikke logget ind)
 * @property loading - true mens vi henter initial auth state, false når data er klar
 * @property logout - Async funktion til at logge brugeren ud
 */
export type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  role: string | null;
  loading: boolean;
  logout: () => Promise<void>;
};

/**
 * Opretter React Context med default værdier.
 * Default værdier bruges kun som fallback og bør aldrig ses i praksis
 * hvis AuthProvider er korrekt wrappet omkring komponenter der bruger useAuth.
 */
const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: null,
  loading: true,
  logout: async () => {},
});

/**
 * AuthProvider komponenten wrapper hele applikationen og leverer auth state.
 * 
 * ANSVARSOMRÅDER:
 * - Initialisere auth state ved app start
 * - Lytte efter auth ændringer i realtid
 * - Hente bruger-profil når nogen logger ind
 * - Opdatere state når nogen logger ud
 * - Levere context værdier til child komponenter
 * 
 * @param children - Child komponenter der skal have adgang til auth context
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // user: Supabase auth User objekt, indeholder email, id, osv.
  const [user, setUser] = useState<User | null>(null);
  
  // profile: Vores egen bruger-profil fra 'profiles' tabellen i databasen
  // Indeholder rolle, navn, præferencer mm.
  const [profile, setProfile] = useState<Profile | null>(null);
  
  // role: Brugerens rolle som separat state for nem adgang
  // Gemmes separat så komponenter nemt kan tjekke rolle uden at gå gennem profile objektet
  const [role, setRole] = useState<string | null>(null);
  
  // loading: Indikerer om vi stadig henter initial auth state
  // Bruges til at vise loading states og forhindre flash af forkert indhold
  const [loading, setLoading] = useState(true);

  /**
   * Henter bruger-profil fra 'profiles' tabellen i Supabase.
   * 
   * Denne funktion kaldes når:
   * - En bruger logger ind
   * - Ved app start hvis en session eksisterer
   * - Efter en session er genoprettet
   * 
   * PROCES:
   * 1. Query profiles tabellen med brugerens ID
   * 2. Forvent præcis én række (single())
   * 3. Gem profil data i state hvis succesfuld
   * 4. Gem rolle separat for nem adgang
   * 5. Sæt loading til false når færdig
   * 
   * @param userId - Supabase auth bruger ID (UUID)
   */
  async function loadProfile(userId: string) {
    // Hent alle felter fra profiles tabellen for denne bruger
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single(); // single() fordi vi forventer præcis én profil per bruger

    // Hvis ingen fejl og vi fik data tilbage, gem det i state
    if (!error && data) {
      setProfile(data as Profile);
      // Gem rolle separat, fallback til "student" hvis ikke sat (burde ikke ske)
      setRole(data.role ?? "student");
    }

    // Sæt loading til false uanset om vi fik data eller ej
    // Dette sikrer at UI kan vises selv ved fejl
    setLoading(false);
  }

  /**
   * Effect der håndterer initial session load og lytter efter auth state ændringer.
   * 
   * Dette effect kører når komponenten mounter og sætter to ting op:
   * 1. Henter initial session state (hvis bruger allerede er logget ind)
   * 2. Sætter en listener op der lytter efter alle fremtidige auth ændringer
   * 
   * INITIAL LOAD PROCES:
   * - Hent nuværende session fra Supabase
   * - Hvis session findes, hent bruger-profil
   * - Hvis ingen session, sæt loading til false
   * 
   * AUTH STATE LISTENER:
   * - Lytter efter SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, osv.
   * - Opdaterer user state ved alle ændringer
   * - Henter profil ved login, rydder profil ved logout
   * 
   * CLEANUP:
   * - Unsubscribe fra listener når komponenten unmounter
   */
  useEffect(() => {
    // FØRSTE DEL: Hent initial session state
    // Dette tjekker om brugeren allerede er logget ind (f.eks. fra en tidligere session)
    supabase.auth.getSession().then(({ data }) => {
      // Udtræk user fra session, brug null hvis ingen session
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);

      if (sessionUser) {
        // Bruger er logget ind - hent deres profil
        loadProfile(sessionUser.id);
      } else {
        // Ingen bruger er logget ind - sæt loading til false
        setLoading(false);
      }
    });

    // ANDEN DEL: Lyt til auth state ændringer
    // Dette subscriber til real-time auth events (login, logout, token refresh)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Opdater user state når auth state ændrer sig
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          // Ny bruger er logget ind - hent profil
          loadProfile(currentUser.id);
        } else {
          // Bruger er logget ud - ryd state og stop loading
          setProfile(null);
          setRole(null);
          setLoading(false);
        }
      }
    );

    // Cleanup: Unsubscribe når komponenten unmounter
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []); // Tom dependency array = kør kun ved mount

  /**
   * Logger brugeren ud af systemet.
   * 
   * PROCES:
   * 1. Kalder Supabase signOut() for at invalidere sessionen
   * 2. Rydder lokal user state
   * 3. Rydder profil state
   * 4. Rydder rolle state
   * 
   * Efter logout vil auth state listener automatisk blive trigget,
   * hvilket sender brugeren til login siden.
   * 
   * @returns Promise der resolver når logout er fuldført
   */
  async function logout() {
    // Logout fra Supabase (invaliderer session, fjerner tokens, osv.)
    await supabase.auth.signOut();
    
    // Ryd all lokal state relateret til brugeren
    setUser(null);
    setProfile(null);
    setRole(null);
  }

  // Render Provider med alle context værdier
  // Alle child komponenter kan nu tilgå disse værdier via useAuth hook
  return (
    <AuthContext.Provider
      value={{
        user,          // Supabase auth User objekt
        profile,       // Bruger-profil fra database
        role,          // Brugerens rolle (student/teacher/admin)
        loading,       // Loading state for initial data fetch
        logout,        // Funktion til at logge ud
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook til at tilgå auth context i komponenter.
 * 
 * BRUG:
 * ```tsx
 * const { user, profile, role, loading, logout } = useAuth();
 * ```
 * 
 * BEMÆRK: Denne hook skal bruges inden for en AuthProvider.
 * Hvis den bruges uden for en Provider, vil den returnere default værdierne.
 * 
 * @returns AuthContextType objekt med alle auth-relaterede værdier og funktioner
 */
export function useAuth() {
  return useContext(AuthContext);
}
