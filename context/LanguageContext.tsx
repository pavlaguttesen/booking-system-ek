"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/lib/supabaseClient";

type Lang = "da" | "en";

type LanguageContextType = {
  language: Lang;
  setLanguage: (lang: Lang) => void;
};

const LanguageContext = createContext<LanguageContextType>({
  language: "da",
  setLanguage: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { profile, user } = useAuth();
  const [language, setLanguageState] = useState<Lang>("da");

  useEffect(() => {
    if (profile?.language) {
      setLanguageState(profile.language);
    }
  }, [profile]);

  const updateLanguage = async (newLang: Lang) => {
    setLanguageState(newLang);

    if (user) {
      await supabase.from("profiles").update({ language: newLang }).eq("id", user.id);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: updateLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
