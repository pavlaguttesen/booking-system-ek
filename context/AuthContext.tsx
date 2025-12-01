"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

// Dansk kommentar: Typer til vores auth context
export type AuthContextType = {
  user: User | null;
  profile: any | null; // Profilrække fra Supabase
  role: string | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Dansk kommentar: Henter profil-data fra Supabase
  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error && data) {
      setProfile(data);
      setRole(data.role ?? "student");
    }
  }

  useEffect(() => {
    // 1️⃣ Først henter vi nuværende session
    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);

      if (sessionUser) {
        loadProfile(sessionUser.id);
      }

      setLoading(false);
    });

    // 2️⃣ Lyt til ændringer i login/logout
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

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
