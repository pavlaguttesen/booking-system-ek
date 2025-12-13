/**
 * LOGO KOMPONENT - EK KØBENHAVN BRANDING
 * 
 * Dette er en simpel komponent der viser EK København's primære logo.
 * Bruges øverst i login formularen for branding og identifikation.
 * 
 * KOMPONENT TYPE:
 * - Server Component (default - ingen "use client" nødvendigt)
 * 
 * STYLING:
 * - Bredde: 320px (w-80 = 20rem)
 * - Margin bottom: 32px (mb-8 = 2rem) for spacing til form elementer
 * 
 * BILLEDSTI:
 * - Logo filen ligger i /public/ek_logo_business-blue_rgb.png
 * - Next.js serverer statiske filer fra /public direkte
 */

/**
 * LOGO COMPONENT
 * 
 * Viser EK København's primære logo som billede.
 * Simpel presentational component uden logik.
 * 
 * @returns {JSX.Element} EK logo billede element
 */
export default function Logo() {
  return (
    <img
      className="w-80 mb-8"                         // Styling: bredde 320px, margin-bottom 32px
      src="/ek_logo_business-blue_rgb.png"         // Logo fra public mappe
      alt="EK logo"                                 // Alt text til accessibility
    />
  );
}
