/**
 * LOGIN FORMULAR KOMPONENT - AUTENTIFICERINGS INTERFACE
 * 
 * Dette er selve login formularen hvor brugere indtaster deres credentials.
 * Håndterer autentificering via Supabase og redirecter ved succes.
 * 
 * KOMPONENT TYPE:
 * - Client Component ("use client") da den bruger hooks og state
 * 
 * FUNKTIONALITET:
 * - Email/password input felter
 * - "Husk mig" checkbox (visuelt, funktionalitet ikke implementeret)
 * - Form validering og submission
 * - Fejlhåndtering med brugervenlige beskeder
 * - Loading state under autentificering
 * - Automatisk redirect til "/" efter succesfuld login
 * 
 * AUTENTIFICERING FLOW:
 * 1. Bruger indtaster email og password
 * 2. Submit kalder Supabase auth.signInWithPassword()
 * 3. Supabase opretter session med JWT tokens
 * 4. Hent bruger profil fra database
 * 5. Redirect til hovedside
 * 
 * STATE VARIABLER:
 * - email: Brugerens email input
 * - password: Brugerens password input
 * - remember: "Husk mig" checkbox værdi (ikke i brug endnu)
 * - errorMsg: Fejlbesked der vises til bruger
 * - loading: Om login request er i gang
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Logo from "./logo";
import { useTranslation } from "react-i18next";
import { error } from "console";

/**
 * LOGIN FORM COMPONENT
 * 
 * Renderer login formular med email/password felter.
 * Håndterer autentificering og redirect.
 * 
 * @returns {JSX.Element} Login formular med alle input felter
 */
export default function LoginForm() {
  // Next.js router til navigation efter login
  const router = useRouter();

  /* STATE MANAGEMENT */
  
  // Form input state
  const [email, setEmail] = useState("");           // Email input værdi
  const [password, setPassword] = useState("");     // Password input værdi
  const [remember, setRemember] = useState(false);  // "Husk mig" checkbox (ikke implementeret endnu)
  
  // UI state
  const [errorMsg, setErrorMsg] = useState("");     // Fejlbesked til bruger
  const [loading, setLoading] = useState(false);    // Indlæsningsstatus under autentificering

  // Hook til oversættelser (internationalisering)
  const { t } = useTranslation();

  /* -------------------------------------------------------
     LOGIN FUNKTION MED SUPABASE AUTENTIFICERING
     
     Håndterer hele login processen:
     1. Valider input (automatisk via HTML5 required)
     2. Kald Supabase auth API
     3. Opret session (håndteres automatisk af Supabase)
     4. Hent bruger profil
     5. Redirect til hovedside
  ------------------------------------------------------- */
  
  /**
   * Håndterer login form submission.
   * 
   * FLOW:
   * 1. Prevent default form behavior
   * 2. Sæt loading state
   * 3. Kald Supabase signInWithPassword
   * 4. Håndter fejl (forkert password, netværksfejl, etc.)
   * 5. Valider at bruger objekt eksisterer
   * 6. Hent bruger profil fra database
   * 7. Redirect til hovedside
   * 
   * @param e - React form submit event
   */
  async function handleLogin(e: React.FormEvent) {
    // Forhindrer standard formularindsendelse (side genindlæsning)
    e.preventDefault();

    // Aktivér indlæsningsstatus og nulstil eventuelle tidligere fejl
    setLoading(true);
    setErrorMsg("");

    /* TRIN 1: AUTENTIFICÉR MED SUPABASE */
    
    // Kald Supabase auth API med email og password
    // Dette opretter automatisk en session med JWT tokens
    const { data: loginData, error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    // Håndter autentificerings fejl (forkert password, bruger findes ikke, etc.)
    if (loginError) {
      setErrorMsg(t("ErrorMsg.wrongEmail_Password"));
      setLoading(false);
      return;
    }

    // Valider at bruger objekt eksisterer i response
    const user = loginData.user;
    if (!user) {
      setErrorMsg(t("ErrorMsg.loginFailed"));
      setLoading(false);
      return;
    }

    /* TRIN 2: HENT BRUGER PROFIL FRA DATABASE */
    
    // Hent komplet profil data fra profiles tabel
    // Dette påvirker ikke sessionen, men giver ekstra bruger info
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // Håndter database fejl eller manglende profil
    if (profileError || !profileData) {
      setErrorMsg(t("ErrorMsg.wrongEmail_Password"));
      setLoading(false);
      return;
    }

    /* TRIN 3: REDIRECT TIL HOVEDSIDE */
    
    // Navigation til "/" (booking hovedside)
    // AuthProvider vil automatisk opdage sessionen
    router.push("/");

    // Deaktivér loading (nødvendigt hvis redirect fejler)
    setLoading(false);
  }

  /* -------------------------------------------------------
     RENDER LOGIN FORMULAR
     
     Viser alle form elementer: logo, inputs, knapper
  ------------------------------------------------------- */
  
  /**
   * KOMPONENT RETURN - LOGIN FORMULAR UI
   * 
   * Strukturen består af:
   * 1. EK logo
   * 2. Velkomst overskrift og undertekst
   * 3. Email input felt (required)
   * 4. Password input felt (required)
   * 5. Fejlbesked (betinget)
   * 6. Login knap (disabled under loading)
   * 7. "Husk mig" checkbox
   */
  return (
    <form onSubmit={handleLogin} className="w-full max-w-md">
      {/* EK KØBENHAVN LOGO */}
      <Logo />

      {/* VELKOMST OVERSKRIFT */}
      {/* Tekst: "Velkommen til EK" (eller engelsk "Welcome to EK") */}
      <h2 className="text-main text-sm mb-1">{t("welcome.title")}</h2>

      {/* UNDERTEKST */}
      {/* Tekst: "Log ind for at fortsætte" */}
      <p className="text-secondary-300 text-sm mb-8">{t("welcome.subtitle")}</p>

      {/* EMAIL INPUT FELT */}
      <label className="block mb-2 text-main font-medium">E-mail:</label>
      <input
        type="email"          // email validation
        className="border border-secondary-200 bg-card text-main rounded w-full p-2 mb-4"
        value={email}
        onChange={(e) => setEmail(e.target.value)}  // Opdater state ved ændring
        required              // Påkrævet felt
      />

      {/* PASSWORD INPUT FELT */}
      <label className="block mb-2 text-main font-medium">
        {t("welcome.password")}:
      </label>
      <input
        type="password"       // Skjuler input med prikker
        className="border border-secondary-200 bg-card text-main rounded w-full p-2 mb-2"
        value={password}
        onChange={(e) => setPassword(e.target.value)}  // Opdater state ved ændring
        required              // Påkrævet felt
      />

      {/* FEJLBESKED (BETINGET RENDERING) */}
      {/* Vises kun hvis der er en fejl (forkert password, netværksfejl, etc.) */}
      {errorMsg && (
        <p className="text-status-booked text-sm mb-4">{errorMsg}</p>
      )}

      {/* LOGIN KNAP */}
      {/* Disabled under loading for at forhindre multiple submissions */}
      <button
        type="submit"
        disabled={loading}
        className="bg-primary-600 text-invert hover:opacity-90 font-bold py-2 px-4 rounded w-full"
      >
        {/* Vis "Logger ind..." under loading, ellers "Log ind" */}
        {loading ? t("welcome.loggingIn") : t("welcome.login")}
      </button>

      {/* "HUSK MIG" CHECKBOX */}
      {/* NOTE: Funktionalitet ikke implementeret endnu - kun visuel */}
      <label className="flex items-center mt-4 text-main">
        <input
          type="checkbox"
          checked={remember}
          onChange={() => setRemember(!remember)}  // Toggle checkbox værdi
          className="mr-2"
        />
        {t("welcome.remember")}
      </label>
    </form>
  );
}
