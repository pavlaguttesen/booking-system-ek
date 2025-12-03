"use client"

import {useState} from "react";

export default function LanguageSettings() {
    const [lang, setLang] = useState("da");

    return (
        <div>
      <h2 className="text-2xl font-semibold mb-4">Vælg sprog</h2>
      <p className="mb-6">
        Du kan ændre sproget på siden.
      </p>

      <div className="flex gap-16">
        
        {/* Dansk sprog*/}
        <div className="text-center">
          <img src="/flag_of_denmark.svg" className="w-24 mx-auto mb-2"/>
          <label className="flex items-center gap-2 justify-center">
            <input
              type="radio"
              checked={lang === "da"}
              onChange={() => setLang("da")}
            />
            Dansk
          </label>
        </div>

        {/* Engelsk sprog*/}
        <div className="text-center">
          <img src="/Flag_of_the_United_Kingdom.svg" className="w-24 mx-auto mb-2"/>
          <label className="flex items-center gap-2 justify-center">
            <input
              type="radio"
              checked={lang === "en"}
              onChange={() => setLang("en")}
            />
            Engelsk
          </label>
        </div>

      </div>

      <p className="mt-6 font-medium">
        Du har nu: {lang === "da" ? "Dansk" : "Engelsk"} sprog slået til
      </p>
    </div>
  );

}