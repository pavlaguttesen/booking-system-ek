"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {supabase} from "@/lib/supabaseClient";
import Logo from "./logo";

export default function LoginForm() {
  const router = useRouter();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    const role = data.user?.user_metadata?.role;

    if (role === "admin") router.push("/admin");
    else if (role === "teacher") router.push("/teacher");
    else router.push("/student");

    setLoading(false);
  }

  return (
    <form onSubmit={handleLogin} className="w-full max-w-md">

      <Logo />

      {/* Intro til login siden */}
      <h2 className="text-main text-sm mb-1">
        Velkommen til bookingsystemet
      </h2>

      <p className="text-secondary-300 text-sm mb-8">
        Her kan du nemt booke lokaler, udstyr og studiepladser. <br />
        Log ind med dit EK København-login.
      </p>


      <label className="block mb-2 text-main font-medium">E-mail:</label>
      <input
        type="email"
        className="border border-secondary-200 bg-card text-main rounded w-full p-2 mb-4"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <label className="block mb-2 text-main font-medium">Kodeord:</label>
      <input
        type="password"
        className="border border-secondary-200 bg-card text-main rounded w-full p-2 mb-2"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <a className="text-primary-600 text-sm mb-6 inline-block" href="#">
        Glemt kodeord?
      </a>

      {errorMsg && (
        <p className="text-status-booked text-sm mb-4">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-primary-600 text-invert hover:opacity-90 font-bold py-2 px-4 rounded w-full"
      >
        {loading ? "Logger ind..." : "Log ind"}
      </button>

      <label className="flex items-center mt-4 text-main">
        <input
          type="checkbox"
          checked={remember}
          onChange={() => setRemember(!remember)}
          className="mr-2"
        />
        Husk mig
      </label>

    </form>
  );
}
