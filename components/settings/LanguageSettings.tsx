"use client";
import { useLanguage } from "@/context/LanguageContext";

export default function LanguageSettings() {
  const { language, setLanguage } = useLanguage();

  return (
    <div>
      <p className="mb-6">
        Du kan ændre sproget på siden.
      </p>

      <div className="flex gap-16">

      {/* Dansk sprog*/}
        <div className="text-center">
          <img src="/flag_of_denmark.svg" className="h-24 mx-auto mb-2"/>
          <label className="flex items-center gap-2 justify-center">
        <input
          type="radio"
          checked={language === "da"}
          onChange={() => setLanguage("da")}
        />
        Dansk
      </label>
      </div>

       {/* Engelsk sprog*/}
        <div className="text-center">
          <img src="/Flag_of_the_United_Kingdom.svg" className="h-24 mx-auto mb-2"/>
          <label className="flex items-center gap-2 justify-center">
        <input
          type="radio"
          checked={language === "en"}
          onChange={() => setLanguage("en")}
        />
        English
      </label>
      </div>

      </div>
      <p className="mt-6 font-medium">
        Du har nu: {language === "da" ? "Dansk" : "English"} sprog slået til
      </p>
    </div>
  );
}
