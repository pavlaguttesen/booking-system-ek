"use client"

import { useState } from "react";
import SettingsSidebar from "./SettingsSidebar";
import ApparanceSettings from "./ApparanceSettings";
import LanguageSettings from "./LanguageSettings";
import RulesSettings from "./RulesSettings";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";

export default function SettingsOverlay({open, onClose}: any) {
    const [activePage, setActivePage] = useState("apparance");

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="w-[80%] h-[80%] rounded-xl flex shadow-xl relative" style={{ backgroundColor: "var(--color-surface-card)", color: "var(--color-text-main)" }}>
        
        {/* En rød luk knap */}
        <button onClick={onClose} className="absolute right-4 top-4 text-xl"><FontAwesomeIcon icon={faCircleXmark} style={{color: "#bb271a",}} /></button> {/* En rød luk knap */}

        <SettingsSidebar activePage={activePage} setActivePage={setActivePage} />

        <div className="flex-1 p-8 overflow-y-auto">
        {activePage === "apparance" && <ApparanceSettings />}
        {activePage === "language" && <LanguageSettings />}
        {activePage === "rules" && <RulesSettings />}
        </div>

        </div>
        </div> 
    );
}

