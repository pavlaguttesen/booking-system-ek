"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import SettingsOverlay from "./settings/SettingsOverlay";

export default function NavBar() {
  const { role } = useAuth();
  const [openSettings, setOpenSettings] = useState(false);

  return (
    <>
      <header className="w-full bg-secondary-200 px-10 py-4 flex justify-between items-center">

        {/* Logo */}
        <div className="flex items-center gap-4">
          <Image
            src="/ek_logo_business-blue_rgb.png"
            alt="Erhvervsakademiet København"
            width={140}
            height={50}
          />
        </div>

        {/* Navigation */}
        <nav className="flex gap-10 text-primary-600 font-medium text-lg">
          <Link href="/" className="hover:underline">
            Kalender
          </Link>

          <Link href="/min-side" className="hover:underline">
            Min side
          </Link>

          <button
            onClick={() => setOpenSettings(true)}
            className="hover:underline"
          >
            Indstillinger
          </button>

          {/* ADMIN LINK — visible only for role === "admin" */}
          {role === "admin" && (
            <Link href="/admin" className="hover:underline">
              Admin
            </Link>
          )}
        </nav>
      </header>

      {/* Settings overlay */}
      <SettingsOverlay
        open={openSettings}
        onClose={() => setOpenSettings(false)}
      />
    </>
  );
}
