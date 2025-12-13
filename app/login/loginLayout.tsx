/**
 * LOGIN LAYOUT KOMPONENT - TO-SPALTET LOGIN INTERFACE
 * 
 * Dette er layout komponenten for login-siden med visuelt design.
 * Opretter en to-spaltet visning med form til venstre og branding til højre.
 * 
 * KOMPONENT TYPE:
 * - Client Component ("use client") da den bruger MantineProvider
 * 
 * DESIGN:
 * - Venstre side (50%): Hvid baggrund med login form, centreret
 * - Højre side (50%): Lysblå baggrund (#C9D4F1) med EK logo som vandmærke
 * 
 * PROPS:
 * @param children - Login formular component (LoginForm) renders her
 * 
 * LAYOUT DETALJER:
 * - Fylder hele skærmen (w-screen h-screen)
 * - Flexbox layout med to lige store spalter
 * - LoginForm wrapper har max-width 420px for læsbarhed
 * - Logo er semi-transparent (opacity 0.25) og placeret som dekorativt element
 */

"use client";

import { MantineProvider } from "@mantine/core";

/**
 * LOGIN LAYOUT COMPONENT
 * 
 * Opretter det visuelle layout for login-siden.
 * 
 * @param children - React children (typisk LoginForm komponent)
 * @returns {JSX.Element} To-spaltet login layout med branding
 */
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Mantine Provider nødvendig for at bruge Mantine komponenter i form
    <MantineProvider>
      {/* HOVEDCONTAINER - Fuld skærm, flex layout */}
      <div className="w-screen h-screen flex overflow-hidden">
        
        {/* VENSTRE SIDE - LOGIN FORMULAR */}
        <div
          className="
            w-1/2 
            flex 
            items-center 
            justify-center 
            bg-white 
            px-[6vw]
          "
        >
          {/* Form wrapper med max-width for optimal læsbarhed */}
          <div className="w-full max-w-[420px]">
            {/* LoginForm component renders her */}
            {children}
          </div>
        </div>

        {/* HØJRE SIDE - BRANDING OG VISUEL IDENTITET */}
        <div
          className="
            w-1/2 
            h-full 
            relative 
            bg-[#C9D4F1]
            overflow-hidden
          "
        >
          {/* 
            EK KØBENHAVN LOGO - DEKORATIVT VANDMÆRKE
            - Placeret i øverste højre hjørne
            - Stor og semi-transparent for at fungere som baggrundselement
            - Skaleret og positioneret med negative margins for at skabe dybde
          */}
          <img
            src="/ek_sekundaert-logo_business-blue_rgb.png"
            alt="EK sekundært logo"
            className="
              absolute 
              right-[-12%]
              top-[8%]
              w-[90%]
              max-w-none
              opacity-[0.25]
              scale-[1.4]
            "
          />
        </div>
      </div>
    </MantineProvider>
  );
}
