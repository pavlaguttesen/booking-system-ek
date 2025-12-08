// Håndterer tema (lys/mørk tilstand). Gemmer brugervalg i databasen og anvender tema i DOM.

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/lib/supabaseClient";

type ThemeContextType = {
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { profile, user } = useAuth();
  const [theme, setThemeState] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (profile?.theme) {
      applyTheme(profile.theme);
    }
  }, [profile]);

  const applyTheme = async (newTheme: "light" | "dark") => {
    document.documentElement.setAttribute("data-theme", newTheme);
    setThemeState(newTheme);

    if (user) {
      await supabase
        .from("profiles")
        .update({ theme: newTheme })
        .eq("id", user.id);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
