"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "./AuthContext";

type SettingsContextType = {
  theme: "light" | "dark";
  language: "da" | "en";
  setTheme: (t: "light" | "dark") => void;
  setLanguage: (l: "da" | "en") => void;
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: any) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<"light" | "dark">("light");
  const [language, setLanguageState] = useState<"da" | "en">("da");

  useEffect(() => {
    if (!user) return;

    supabase
      .from("profiles")
      .select("theme, language")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setThemeState(data.theme);
          setLanguageState(data.language);

          document.documentElement.setAttribute("data-theme", data.theme);
        }
      });
  }, [user]);

  // Save theme
  const setTheme = async (t: "light" | "dark") => {
    setThemeState(t);
    document.documentElement.setAttribute("data-theme", t);

    if (user)
      await supabase
        .from("profiles")
        .update({ theme: t })
        .eq("id", user.id);
  };

  // Save language
  const setLanguage = async (l: "da" | "en") => {
    setLanguageState(l);

    if (user)
      await supabase
        .from("profiles")
        .update({ language: l })
        .eq("id", user.id);
  };

  return (
    <SettingsContext.Provider value={{ theme, language, setTheme, setLanguage }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext)!;
