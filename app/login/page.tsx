/**
 * LOGIN SIDE - AUTENTIFICERINGS INTERFACE
 * 
 * Dette er login-siden hvor brugere autentificerer sig før adgang til systemet.
 * 
 * ROUTING KONTEKST:
 * - Fil: app/login/page.tsx (route: "/login")
 * - Dette er en Server Component (default i Next.js)
 * - Brugere redirectes hertil hvis de ikke er logget ind
 * - Efter succesfuld login redirectes til "/" (hovedside)
 * 
 * STRUKTUR:
 * Denne komponent er meget simpel og kombinerer blot:
 * - LoginLayout: To-spaltet layout med branding
 * - LoginForm: Selve login formularen med email/password
 * 
 * FLOW:
 * 1. Bruger indtaster email og password i LoginForm
 * 2. LoginForm validerer og sender til Supabase
 * 3. Ved success: Redirect til "/"
 * 4. Ved fejl: Vis fejlbesked i form
 */

import LoginLayout from "./loginLayout";
import LoginForm from "./loginForm";

/**
 * LOGIN PAGE COMPONENT
 * 
 * Server Component der renderer login-siden.
 * Kombinerer layout og form komponenter.
 * 
 * @returns {JSX.Element} Login interface med layout og formular
 */
export default function Page() {
  return (
    <LoginLayout>
      <LoginForm />
    </LoginLayout>
  );
}
