// Navigationslinje viser EK logo, links til kalender/min side, indstillinger og admin panel.

"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import SettingsOverlay from "./settings/SettingsOverlay";
import { useTranslation } from "react-i18next";

export default function NavBar() {
  const { role } = useAuth();
  const [openSettings, setOpenSettings] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <header className="w-full bg-secondary-200 px-10 py-4 flex justify-between items-center">
        {/* Logo med link til kalenderen */}
        <Link href="/" className="flex items-center gap-4">
          <Image
            src="/ek_logo_business-blue_rgb.png"
            alt="Erhvervsakademiet København"
            width={140}
            height={50}
          />
        </Link>

        {/* Navigation */}
        <nav className="flex gap-10 text-primary-600 font-sm text-lg">
          <Link href="/" className="hover:underline">
            {t("navbar.calender")}
          </Link>

          <Link href="/mypage" className="hover:underline">
            {t("navbar.mypage")}
          </Link>

          <button
            onClick={() => setOpenSettings(true)}
            className="hover:underline"
          >
            {t("navbar.settings")}
          </button>

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
