"use client";

import { useState } from "react";
import { StatsRoomUtilization, StatsRepeatAndUsers, StatsRoomsComparison } from ".";

export default function AdminStatsTabs() {
  // Vi samler "Udnyttelse pr. lokale" og "Sammenligning af lokaler" i samme faneblad
  const [tab, setTab] = useState<"rooms" | "repeat">("rooms");

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200">
      <div className="flex items-center gap-2 mb-4">
        <button
          className={`px-3 py-2 rounded ${tab === "rooms" ? "bg-secondary-50 font-medium" : "hover:bg-secondary-50"}`}
          onClick={() => setTab("rooms")}
        >
          Lokaler (udnyttelse & sammenligning)
        </button>
        <button
          className={`px-3 py-2 rounded ${tab === "repeat" ? "bg-secondary-50 font-medium" : "hover:bg-secondary-50"}`}
          onClick={() => setTab("repeat")}
        >
          Gentagelser & brugere
        </button>
      </div>

      {tab === "rooms" && (
        <div className="space-y-6">
          {/* Udnyttelse pr. lokale */}
          <StatsRoomUtilization />
          {/* Sammenligning af lokaler */}
          <StatsRoomsComparison />
        </div>
      )}
      {tab === "repeat" && <StatsRepeatAndUsers />}
    </div>
  );
}
