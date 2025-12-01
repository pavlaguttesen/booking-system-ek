"use client";

// Dansk kommentar: AuthGate sørger for, at alle sider kræver login.
// Login-siden er undtaget. Brugeren sendes automatisk til /login,
// hvis der ikke findes en aktiv session.

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      // Dansk kommentar: Login-siden skal ikke beskyttes
      if (pathname === "/login") {
        setLoading(false);
        return;
      }

      // Dansk kommentar: Hent session fra Supabase
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Dansk kommentar: Hvis brugeren ikke er logget ind
      if (!session) {
        router.replace("/login");
        return;
      }

      setLoading(false);
    }

    checkAuth();
  }, [pathname, router]);

  // Dansk kommentar: Vis intet indhold før auth-status er kendt
  if (loading) return null;

  return <>{children}</>;
}
