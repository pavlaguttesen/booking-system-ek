"use client"

import { useState } from "react";
import SettingsSidebar from "./SettingsSidebar";
import ApparanceSettings from "./ApparanceSettings";
import LanguageSettings from "./LanguageSettings";
import ProfileSettings from "./ProfileSettings";
import RulesSettings from "./RulesSettings";

export default function SettingsOverlay({open, onClose}: any) {
    const [activePage, setActivePage] = useState("profile");

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white w-[80%] h-[80%] rounded-xl flex shadow-xl relative">
        
        <button onClick={onClose} className="absolute right-4 top-4 text-xl">x</button>

        <SettingsSidebar activePage={activePage} setActivePage={setActivePage} />

        <div className="flex-1 p-8 overflow-y-auto">
        {activePage === "apparance" && <ApparanceSettings />}
        {activePage === "profile" && <ProfileSettings />}
        {activePage === "language" && <LanguageSettings />}
        {activePage === "rules" && <RulesSettings />}
        </div>

        </div>
        </div> 
    );
}

