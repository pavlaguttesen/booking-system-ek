/**
 * LanguageSettings Komponent
 * 
 * Indstillings-sektion til sprog-valg. Tillader brugeren at vælge mellem
 * dansk og engelsk med visuelle flag-ikoner og viser aktuel status.
 * 
 * Funktionalitet:
 * - Radio buttons til valg mellem dansk/engelsk
 * - Visuelle flag-ikoner for hver sprog-option
 * - Aktuel sprog-status vises nederst
 * - Sprog gemmes i LanguageContext og localStorage
 * - Ændringer opdaterer hele applikationen via i18n
 * 
 * Sprog:
 * - da: Dansk
 * - en: Engelsk
 */

"use client";
import { useLanguage } from "@/context/LanguageContext";
import { useTranslation } from "react-i18next";

export default function LanguageSettings() {
  // Oversættelses-funktionalitet
  const { t } = useTranslation();
  
  // Hent nuværende sprog og funktion til at ændre det
  // Hent nuværende sprog og funktion til at ændre det
  const { language, setLanguage } = useLanguage();

  return (
    <div>
      {/* Introduktions-tekst */}
      <p className="mb-6">{t("settings.language_text")}</p>

      {/* Container for sprog-valgmuligheder */}
      <div className="flex gap-16">
        {/* Dansk sprog option */}
        <div className="text-center">
          {/* Dansk flag som visuelt ikon */}
          <img src="/flag_of_denmark.svg" className="h-24 mx-auto mb-2" />
          <label className="flex items-center gap-2 justify-center">
            {/* Radio button - checked hvis dansk er aktivt */}
            <input
              type="radio"
              checked={language === "da"}
              onChange={() => setLanguage("da")} // Skift til dansk
            />
            {t("settings.language_danish")}
          </label>
        </div>

        {/* Engelsk sprog option */}
        <div className="text-center">
          {/* Britisk flag som visuelt ikon */}
          <img
            src="/Flag_of_the_United_Kingdom.svg"
            className="h-24 mx-auto mb-2"
          />
          <label className="flex items-center gap-2 justify-center">
            {/* Radio button - checked hvis engelsk er aktivt */}
            <input
              type="radio"
              checked={language === "en"}
              onChange={() => setLanguage("en")} // Skift til engelsk
            />
            {t("settings.language_english")}
          </label>
        </div>
      </div>
      
      {/* Status-tekst der viser aktuelt valgt sprog */}
      <p className="mt-6 font-medium">
        {t("settings.language_mode")} : {""}{" "}
        {language === "da"
          ? t("settings.language_danish")
          : t("settings.language_english")}
      </p>
    </div>
  );
}
