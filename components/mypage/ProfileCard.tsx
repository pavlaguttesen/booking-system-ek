// Kort der viser brugerens navn, email og logout-knap.

"use client";

import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import ProfilePicture from "./ProfilePicture";

export default function ProfileCard() {
  const { profile, user, logout } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="w-full flex flex-col items-center text-center space-y-3">
      <ProfilePicture/>
      
      
      <h2 className="text-xl font-semibold text-main">
        {profile?.full_name ?? user?.email ?? t("unknown.unknownUser")}
      </h2>

      <p className="text-sm text-main/70">{user?.email}</p>

      <button
        onClick={logout}
        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 cursor-pointer transition"
      >
        {t("booking.logout")}
      </button>
    </div>
  );
}
