"use client";
import { useLanguage } from "@/context/LanguageContext";
import { useTranslation } from "react-i18next";

export default function LanguageSettings() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();

  return (
    <div>
      <p className="mb-6">{t("settings.language_text")}</p>

      <div className="flex gap-16">
        {/* Dansk sprog*/}
        <div className="text-center">
          <img src="/flag_of_denmark.svg" className="h-24 mx-auto mb-2" />
          <label className="flex items-center gap-2 justify-center">
            <input
              type="radio"
              checked={language === "da"}
              onChange={() => setLanguage("da")}
            />
            {t("settings.language_danish")}
          </label>
        </div>

        {/* Engelsk sprog*/}
        <div className="text-center">
          <img
            src="/Flag_of_the_United_Kingdom.svg"
            className="h-24 mx-auto mb-2"
          />
          <label className="flex items-center gap-2 justify-center">
            <input
              type="radio"
              checked={language === "en"}
              onChange={() => setLanguage("en")}
            />
            {t("settings.language_english")}
          </label>
        </div>
      </div>
      <p className="mt-6 font-medium">
        {t("settings.language_mode")} : {""}{" "}
        {language === "da"
          ? t("settings.language_danish")
          : t("settings.language_english")}
      </p>
    </div>
  );
}
