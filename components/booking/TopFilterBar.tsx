/**
 * TopFilterBar.tsx
 * 
 * FORMÅL:
 * Simpel wrapper-komponent for filter-kontrolelementerne øverst på bookingsiden.
 * Holder layout konsistent og giver mulighed for fremtidig udvidelse.
 * 
 * STRUKTUR:
 * - Full bredde container
 * - Indeholder RoomFiltersDropdown i kompakt tilstand
 * - Flexbox layout med items-start for top-alignering
 * - Bottom margin for afstand til timeline/liste under
 * 
 * FREMTIDIG UDVIDELSE:
 * Dette komponent kan nemt udvides med yderligere elementer som:
 * - Søgefelt
 * - View toggle (liste/timeline)
 * - Sortering
 * - Eksport knapper
 * 
 * RELATERET:
 * - RoomFiltersDropdown: Den faktiske filter UI
 * - BookingContext: Håndterer filter state og logik
 */

"use client";

import RoomFiltersDropdown from "./RoomFiltersDropdown";

import React from "react";

/**
 * TopFilterBar komponent.
 * Viser filter-kontroller øverst på booking siden.
 * 
 * @returns Filter bar med kompakt dropdown layout
 */
export default function TopFilterBar() {
  return (
    <div className="w-full flex items-start justify-between mb-2">
      {/* 
        RoomFiltersDropdown i kompakt tilstand:
        - Mindre knapper og inputs
        - Optimeret til at fylde mindre i højden
        - Perfekt til at være øverst på siden
      */}
      <RoomFiltersDropdown compact />
    </div>
  );
}
