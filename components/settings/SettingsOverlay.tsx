// Modal overlay til brugerindstillinger. Indeholder faner for udseende, sprog og regler.

"use client";

import { useState } from "react";
import SettingsSidebar from "./SettingsSidebar";
import ApparanceSettings from "./ApparanceSettings";
import LanguageSettings from "./LanguageSettings";
import RulesSettings from "./RulesSettings";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";

export default function SettingsOverlay({ open, onClose }: any) {
  const [activePage, setActivePage] = useState("apparance");

  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
        onClick={onClose}>
    <div
      className="w-[60%] h-[60%] rounded-xl flex shadow-xl relative"
      style={{
        backgroundColor: "var(--color-surface-card)",
        color: "var(--color-text-main)",
      }}

         onClick={(e) => e.stopPropagation()} // Forhindrer klik på indhold i modal i at lukke den
         >
      {/* Luk-knap */}
      <button onClick={onClose} className="absolute right-4 top-4 text-xl">
        <FontAwesomeIcon icon={faCircleXmark} style={{ color: "#bb271a" }} />
      </button>

      <SettingsSidebar activePage={activePage} setActivePage={setActivePage} />

      {/* Hovedindhold */}
      <div className="flex-1 flex flex-col overflow-y-auto">

        {/* Header */}
        <div
          className="px-8 py-4 text-2xl font-bold justify-center flex"
          style={{
            backgroundColor: "var(--color-secondary-200)",
            color: "var(--color-text-invert)",
          }}
        >
          {activePage === "apparance" && t("settings.appearance_title")}
          {activePage === "language" && t("settings.language_title")}
          {activePage === "rules" && t("settings.rules_title")}
        </div>

        {/* Indhold */}
        <div className="p-8">
          {activePage === "apparance" && <ApparanceSettings />}
          {activePage === "language" && <LanguageSettings />}
          {activePage === "rules" && <RulesSettings />}
        </div>
      </div>
    </div>
  </div>
  );
}
