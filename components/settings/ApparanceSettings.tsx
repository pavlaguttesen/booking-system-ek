// Indstillinger for tema (lys/mørk tilstand). Brugeren kan skifte mellem tilstandene og se preview.

"use client";

import { useSettings } from "@/context/SettingsContext";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";

export default function ApparanceSettings() {
  const { theme, setTheme } = useSettings();
  const { t } = useTranslation();
  const { language } = useLanguage();

  return (
    <div>
      <div className="flex gap-16 mt-8">
        <div className="text-center">
          <div className="w-32 h-20 bg-gray-700 rounded mb-2"></div>
          <label className="flex items-center gap-2 justify-center">
            <input
              type="radio"
              checked={theme === "dark"}
              onChange={() => setTheme("dark")}
            />
            {t("settings.appearance_mode_dark")}
          </label>
        </div>

        <div className="text-center">
          <div className="w-32 h-20 border border-gray-400 rounded mb-2"></div>
          <label className="flex items-center gap-2 justify-center">
            <input
              type="radio"
              checked={theme === "light"}
              onChange={() => setTheme("light")}
            />
            {t("settings.appearance_mode_light")}
          </label>
        </div>
      </div>

      <p className="mt-6 font-medium">
        {t("settings.language_mode")}{" "}
        {theme === "light"
          ? t("settings.appearance_mode_light")
          : t("settings.appearance_mode_dark")}
      </p>
    </div>
  );
}
