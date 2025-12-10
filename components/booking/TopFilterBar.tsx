// Filterbar øverst på bookingsiden. Viser faciliteter, kapacitet, etage og lokaletype. Admin ser ekstra etage-filter.

"use client";

import RoomFiltersDropdown from "./RoomFiltersDropdown";

import React from "react";

export default function TopFilterBar() {
  return (
    <div className="w-full flex items-start justify-between mb-2">
      <RoomFiltersDropdown compact />
    </div>
  );
}
