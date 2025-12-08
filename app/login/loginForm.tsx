"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Logo from "./logo";
import { useTranslation } from "react-i18next";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const { t } = useTranslation();
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    // 1️⃣ Log in
    const { data: loginData, error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (loginError) {
      setErrorMsg("Forkert e-mail eller kodeord");
      setLoading(false);
      return;
    }

    const user = loginData.user;
    if (!user) {
      setErrorMsg("Login fejlede. Prøv igen senere.");
      setLoading(false);
      return;
    }

    // 2️⃣ Fetch profile row
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profileData) {
      setErrorMsg("Kunne ikke hente brugerprofil.");
      setLoading(false);
      return;
    }

    const role = profileData.role ?? "student";

    // 3️⃣ Store in localStorage (temporary state until context is used)
    localStorage.setItem(
      "booking_profile",
      JSON.stringify({
        id: user.id,
        email: user.email,
        role,
        full_name: profileData.full_name ?? "",
      })
    );

    // 4️⃣ Redirect user
    router.push("/");

    setLoading(false);
  }

  return (
    <form onSubmit={handleLogin} className="w-full max-w-md">
      <Logo />

      <h2 className="text-main text-sm mb-1">
        {t("welcome.title")}
      </h2>

      <p className="text-secondary-300 text-sm mb-8">
      {t("welcome.subtitle")}
      </p>

      <label className="block mb-2 text-main font-medium">E-mail:</label>
      <input
        type="email"
        className="border border-secondary-200 bg-card text-main rounded w-full p-2 mb-4"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <label className="block mb-2 text-main font-medium">{t("welcome.password")}:</label>
      <input
        type="password"
        className="border border-secondary-200 bg-card text-main rounded w-full p-2 mb-2"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      {errorMsg && (
        <p className="text-status-booked text-sm mb-4">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-primary-600 text-invert hover:opacity-90 font-bold py-2 px-4 rounded w-full"
      >
        {loading ? t("welcome.loggingIn") : t("welcome.login")}
      </button>

      <label className="flex items-center mt-4 text-main">
        <input
          type="checkbox"
          checked={remember}
          onChange={() => setRemember(!remember)}
          className="mr-2"
        />
        {t("welcome.remember")}
      </label>
    </form>
  );
}
