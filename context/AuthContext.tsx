"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

/* ----------------------------------------------------
   Profile type MUST include all DB fields 
   used by ThemeContext + LanguageContext
---------------------------------------------------- */
export type Profile = {
  id: string;
  full_name: string | null;
  role: "student" | "teacher" | "admin";
  language?: "da" | "en" | null;
  theme?: "light" | "dark" | null;
};

export type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  role: string | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /* ----------------------------------------------------
     LOAD PROFILE FROM SUPABASE
  ---------------------------------------------------- */
  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error && data) {
      setProfile(data as Profile);
      setRole(data.role ?? "student");
    }

    setLoading(false);
  }

  /* ----------------------------------------------------
     INITIAL SESSION LOAD
  ---------------------------------------------------- */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);

      if (sessionUser) {
        loadProfile(sessionUser.id);
      } else {
        setLoading(false);
      }
    });

    /* ----------------------------------------------------
       LISTEN FOR LOGIN / LOGOUT
    ---------------------------------------------------- */
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const sessionUser = session?.user ?? null;
        setUser(sessionUser);

        if (sessionUser) {
          loadProfile(sessionUser.id);
        } else {
          setProfile(null);
          setRole(null);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  /* ----------------------------------------------------
     LOGOUT
  ---------------------------------------------------- */
  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRole(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        loading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
