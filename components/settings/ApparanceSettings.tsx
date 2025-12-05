"use client";

import { useSettings } from "@/context/SettingsContext";

export default function ApparanceSettings() {
  const { theme, setTheme } = useSettings();

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
            Mørk tilstand
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
            Lys tilstand
          </label>
        </div>

      </div>

      <p className="mt-6 font-medium">
        Du har nu: {theme === "light" ? "Lys tilstand" : "Mørk tilstand"} slået til
      </p>
    </div>
  );
}
