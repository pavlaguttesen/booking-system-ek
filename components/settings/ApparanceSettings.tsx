"use client"

import {useState} from "react";

export default function ApparanceSettings() {
    const [mode, setMode] = useState("light");

    return (
        <div>
      <h2 className="text-2xl font-semibold mb-4">Udseende</h2>
      <p className="mb-6">
        Du kan ændre udseende mellem lys og mørk tilstand.
      </p>

      <div className="flex gap-16">

        {/* Mørk tilstand */}
      <div className="text-center">
          <div className="w-32 h-20 bg-gray-700 rounded mb-2"></div>
          <label className="flex items-center gap-2 justify-center">
            <input
              type="radio"
              checked={mode === "dark"}
              onChange={() => setMode("dark")}
            />
            Mørk tilstand
          </label>
        </div>

        {/* Lys tilstand */}
        <div className="text-center">
          <div className="w-32 h-20 border border-gray-400 rounded mb-2"></div>
          <label className="flex items-center gap-2 justify-center">
            <input
              type="radio"
              checked={mode === "light"}
              onChange={() => setMode("light")}
            />
            Lys tilstand
          </label>
        </div>
        </div>

        <p className="mt-6 font-medium">
        Du har nu: {mode === "light" ? "Lys" : "Mørk"} tilstand slået til
      </p>
    </div>
    );
}