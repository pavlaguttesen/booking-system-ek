// Konfigurationsfil for i18next oversættelsessystemet.
// Dette er kernen af applikationens flersprogede funktionalitet.
// i18next håndterer alle tekstoversættelser mellem dansk og engelsk.

"use client"; // Marker som klient-side kode for Next.js

// Importér i18next kernefunktionalitet
import i18n from "i18next";
// Importér React integration for i18next
import { initReactI18next } from "react-i18next";

// Importér alle oversættelsesfiler
import en from "./locals/en.json"; // Engelske oversættelser
import da from "./locals/da.json"; // Danske oversættelser

// Konfigurér og initialiser i18next med React-support
i18n.use(initReactI18next).init({
    // Definition af tilgængelige sprog og deres oversættelser
    resources: {
        en: {
            // Engelsk oversættelse namespace
            translation: en,
        },
        da: {
            // Dansk oversættelse namespace
            translation: da,
        },
    },
    // Standardsprog når applikationen starter
    lng: "da",
    // Fallback sprog hvis en oversættelse mangler
    fallbackLng: "da",
    // Interpolations-indstillinger for dynamiske værdier i oversættelser
    interpolation: {
        // Deaktiver escape af HTML for at tillade formattering
        // React håndterer XSS-beskyttelse automatisk
        escapeValue: false,
    },
});

// Eksportér den konfigurerede i18n instans til brug i hele applikationen
export default i18n;