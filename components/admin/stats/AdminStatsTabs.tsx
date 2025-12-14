"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StatsRepeatAndUsers, StatsRoomsComparison } from ".";

export default function AdminStatsTabs() {
  const { t } = useTranslation();
  // Vi samler "Udnyttelse pr. lokale" og "Sammenligning af lokaler" i samme faneblad
  const [tab, setTab] = useState<"rooms" | "repeat">("rooms");

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
      <div className="flex items-center gap-2 mb-4 text-secondary">
        <button
          className={`px-3 py-2 rounded ${tab === "rooms" ? "bg-secondary-50 font-medium" : "hover:bg-secondary-50"}`}
          onClick={() => setTab("rooms")}
        >
          {t("adminStats.tabsRooms")}
        </button>
        <button
          className={`px-3 py-2 rounded ${tab === "repeat" ? "bg-secondary-50 font-medium" : "hover:bg-secondary-50"}`}
          onClick={() => setTab("repeat")}
        >
          {t("adminStats.tabsRepeat")}
        </button>
      </div>

      {tab === "rooms" && <StatsRoomsComparison />}
      {tab === "repeat" && <StatsRepeatAndUsers />}
    </div>
  );
}
