/**
 * ApparanceSettings Komponent
 * 
 * Indstillings-sektion til udseende/tema valg. Tillader brugeren at vælge mellem
 * lyst og mørkt tema med visuelle previews og viser aktuel status.
 * 
 * Funktionalitet:
 * - Radio buttons til valg mellem lys/mørk tilstand
 * - Visuelle preview-bokse der viser hvordan temaet ser ud
 * - Aktuel tema-status vises nederst
 * - Tema gemmes i SettingsContext og localStorage
 * - Ændringer træder i kraft øjeblikkeligt
 * 
 * Temaer:
 * - light: Lys baggrund, mørk tekst
 * - dark: Mørk baggrund, lys tekst
 */

"use client";

import { useSettings } from "@/context/SettingsContext";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";

export default function ApparanceSettings() {
  // Hent nuværende tema og funktion til at ændre det
  const { theme, setTheme } = useSettings();
  
  // Oversættelses-funktionalitet
  const { t } = useTranslation();
  
  // Hent aktuel sprog-indstilling (bruges til status-visning)
  // Hent aktuel sprog-indstilling (bruges til status-visning)
  const { language } = useLanguage();

  return (
    <div>
       {/* Introduktions-tekst */}
       <p className="mb-6">{t("settings.appearance_text")}</p>
       
      {/* Container for tema-valgmuligheder */}
      <div className="flex gap-16 mt-8">
        {/* Mørkt tema option */}
        <div className="text-center">
          {/* Preview boks der viser mørk farve */}
          <div className="w-32 h-20 bg-gray-700 rounded mb-2"></div>
          <label className="flex items-center gap-2 justify-center">
            {/* Radio button - checked hvis mørkt tema er aktivt */}
            <input
              type="radio"
              checked={theme === "dark"}
              onChange={() => setTheme("dark")} // Skift til mørkt tema
            />
            {t("settings.appearance_mode_dark")}
          </label>
        </div>

        {/* Lyst tema option */}
        <div className="text-center">
          {/* Preview boks der viser lys farve */}
          <div className="w-32 h-20 bg-white border border-gray-400 rounded mb-2"></div>
          <label className="flex items-center gap-2 justify-center">
            {/* Radio button - checked hvis lyst tema er aktivt */}
            <input
              type="radio"
              checked={theme === "light"}
              onChange={() => setTheme("light")} // Skift til lyst tema
            />
            {t("settings.appearance_mode_light")}
          </label>
        </div>
      </div>

      {/* Status-tekst der viser aktuelt valgt tema */}
      <p className="mt-6 font-medium">
        {t("settings.language_mode")}{" "}
        {theme === "light"
          ? t("settings.appearance_mode_light")
          : t("settings.appearance_mode_dark")}
      </p>
    </div>
  );
}
