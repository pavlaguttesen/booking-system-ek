/**
 * RoomFiltersDropdown.tsx
 * 
 * FORMÅL:
 * Delt filter-komponent til filtrering af lokaler baseret på forskellige kriterier.
 * Bruges både i TopFilterBar (kompakt) og i BookingAdvancedFilters (fuld størrelse).
 * 
 * FILTER-TYPER:
 * 1. FACILITETER (toggle buttons):
 *    - Whiteboard
 *    - Skærm
 *    - Opslagstavle
 *    Flere kan være valgt samtidig (logisk AND)
 * 
 * 2. KAPACITET (number input):
 *    - Minimum antal pladser
 *    - Kun lokaler med mindst dette antal vises
 * 
 * 3. ETAGE (toggle buttons - kun admin):
 *    - Filter til specifikke etager (1, 2, 3, 4)
 *    - Kun én etage kan vælges ad gangen
 * 
 * 4. LOKALETYPE (dropdown):
 *    - Studierum
 *    - Klasseværelse
 *    - Auditorium
 *    Filtreret baseret på brugerens rolle
 * 
 * ROLLE-BEGRÆNSNINGER:
 * - Studerende: Kan kun se studierum
 * - Undervisere: Kan kun se klasseværelser og auditorier
 * - Admin: Kan se alle typer
 * 
 * PROPS:
 * - compact: boolean - Skifter mellem kompakt og fuld størrelse styling
 * 
 * STATE HÅNDTERING:
 * Alle filter-værdier håndteres af BookingContext.
 * Komponenten er bare UI og kalder context callbacks.
 * 
 * HYDRATION SIKKERHED:
 * Bruger useMounted hook til at undgå hydration mismatch fejl.
 */

"use client";

import { useState, useEffect } from "react";
import { useBookingContext } from "@/context/BookingContext";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

/**
 * Custom hook til at tracke om komponenten er mounted (client-side).
 * Forhindrer hydration mismatch fejl ved SSR.
 * 
 * @returns true hvis komponenten er mounted, false ellers
 * 
 * BRUG:
 * Render placeholder/skeleton indtil mounted er true,
 * derefter render den faktiske interaktive UI.
 */
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/**
 * RoomFiltersDropdown komponent.
 * 
 * @param compact - Hvis true, bruges mindre buttons og inputs til kompakt layout
 */
export default function RoomFiltersDropdown({ compact = false }: { compact?: boolean }) {
  // Hent filter state og callback funktioner fra BookingContext
  const {
    roomFilters,           // Aktuelle filter værdier
    toggleRoomFilter,      // Toggle facilitet on/off
    setCapacityFilter,     // Sæt minimum kapacitet
    setFloorFilter,        // Sæt etage filter
    setRoomTypeFilter,     // Sæt lokaletype filter
    resetRoomFilters,      // Nulstil alle filtre til standard
  } = useBookingContext();

  // Hent brugerens rolle fra AuthContext
  const { role } = useAuth();
  
  // Tjek om komponenten er mounted (for hydration sikkerhed)
  const mounted = useMounted();
  
  // Lokal state for kapacitet input (string til at håndtere tom værdi)
  const [capacityInput, setCapacityInput] = useState(
    roomFilters.capacity ? String(roomFilters.capacity) : ""
  );
  
  const { t } = useTranslation();

  /**
   * Lokaletype muligheder med oversættelse.
   * Definerer alle mulige lokaletyper i systemet.
   */
  const roomTypeOptions = [
    { value: "studierum", label: t("booking.studyroom") },
    { value: "klasseværelse", label: t("booking.classroom") },
    { value: "auditorium", label: "Auditorium" },
  ];

  /**
   * ROLLE-BASERET ADGANGSKONTROL:
   * Definerer hvilke lokaletyper hver rolle må se og filtrere.
   * - Studerende: Kun studierum (de må ikke se undervisningslokaler)
   * - Undervisere: Kun klasseværelser og auditorier (ikke studierum)
   * - Admin: Alle typer (fuld adgang)
   */
  const allowedTypesByRole: Record<string, string[]> = {
    student: ["studierum"],
    teacher: ["klasseværelse", "auditorium"],
    admin: ["studierum", "klasseværelse", "auditorium"],
  };
  // Hent de tilladte typer for aktuel brugers rolle
  const allowedRoomTypes = allowedTypesByRole[role ?? "student"];

  /**
   * Facilitet muligheder.
   * Hver facilitet har en key (bruges i filter state) og label (vist til bruger).
   */
  const facilityOptions: { key: "whiteboard" | "screen" | "board"; label: string }[] = [
    { key: "whiteboard", label: "Whiteboard" },
    { key: "screen", label: t("admin.screen") },
    { key: "board", label: t("admin.bulletinboard") },
  ];

  /**
   * Håndterer ændringer i kapacitet input feltet.
   * 
   * @param val - Ny værdi fra input feltet (som string)
   * 
   * LOGIK:
   * 1. Opdater lokal input state (for at vise værdien)
   * 2. Konverter til nummer
   * 3. Hvis valid nummer > 0: Sæt filter
   * 4. Ellers: Nulstil filter (null)
   * 
   * Dette tillader både tom værdi (intet filter) og numeriske værdier.
   */
  function handleCapacityChange(val: string) {
    setCapacityInput(val);
    const n = Number(val);
    if (!isNaN(n) && n > 0) {
      setCapacityFilter(n);
    } else {
      setCapacityFilter(null);
    }
  }

  return (
    <div className={compact ? "flex flex-wrap items-center gap-2 p-1" : "flex flex-wrap items-start gap-6"}>
      {/* 
        FACILITETER FILTER:
        Toggle buttons for hver facilitet.
        Flere kan være aktive samtidig (logisk AND i filtreringen).
        Aktive buttons vises med primær farve (blå), inaktive med sekundær (grå).
      */}
      <div className={compact ? "flex flex-col items-start" : "flex flex-col"}>
        <label className={compact ? "text-xs font-semibold text-main" : "text-sm font-semibold text-main"}>
          {t("booking.facilities")}
        </label>
        <div className={compact ? "flex gap-1 mt-1" : "flex gap-3 mt-1"}>
          {facilityOptions.map((item) => (
            <button
              key={item.key}
              // Toggle facilitet filter on/off
              onClick={() => toggleRoomFilter(item.key)}
              // Dynamisk styling baseret på compact mode og aktiv/inaktiv tilstand
              className={
                compact
                  ? `px-2 py-1 rounded border text-xs font-medium transition ${
                      roomFilters[item.key] 
                        ? "bg-primary-600 text-white border-primary-600"  // Aktiv: Blå
                        : "bg-secondary-200 text-main border-secondary-200 hover:bg-secondary-100"  // Inaktiv: Grå
                    }`
                  : `px-4 py-2 rounded-md border text-sm font-medium transition ${
                      roomFilters[item.key] 
                        ? "bg-primary-600 text-white border-primary-600"  // Aktiv: Blå
                        : "bg-secondary-300 text-main border-secondary-200 hover:bg-secondary-200"  // Inaktiv: Grå
                    }`
              }
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 
        KAPACITET FILTER:
        Text input til at specificere minimum antal pladser.
        Kun lokaler med mindst dette antal pladser vises.
        
        HYDRATION SIKKERHED:
        Input vises kun når mounted er true.
        Før det vises en placeholder div for at undgå mismatch.
      */}
      <div className={compact ? "flex flex-col items-start" : "flex flex-col"}>
        <label className={compact ? "text-xs font-semibold text-main" : "text-sm font-semibold text-main"}>
          {t("booking.number")}
        </label>
        {mounted ? (
          // Faktisk input (kun vist client-side)
          <input
            type="text"
            value={capacityInput}
            placeholder={t("admin.numberPlaceholder")}
            onChange={(e) => handleCapacityChange(e.target.value)}
            className={
              compact 
                ? "px-2 py-1 rounded border text-xs bg-secondary-200 border-secondary-200 text-main w-16 mt-1" 
                : "px-3 py-2 rounded-md border text-sm bg-secondary-300 border-secondary-200 text-main w-24 mt-1"
            }
          />
        ) : (
          // Placeholder div (vist under SSR)
          <div className={
            compact 
              ? "w-16 h-6 mt-1 bg-secondary-200 rounded border border-secondary-200" 
              : "w-24 h-36px mt-1 bg-secondary-300 rounded-md border border-secondary-200"
          } />
        )}
      </div>

      {/* 
        ETAGE FILTER (KUN ADMIN):
        Toggle buttons for hver etage (1, 2, 3, 4).
        Kun én etage kan være valgt ad gangen (eksklusiv).
        Klik på aktiv etage deaktiverer filteret (viser alle etager).
        
        SYNLIGHED:
        Denne sektion vises kun for admin-brugere.
        Studerende og undervisere har ikke brug for etage-filter.
      */}
      {role === "admin" && (
        <div className={compact ? "flex flex-col items-start" : "flex flex-col"}>
          <label className={compact ? "text-xs font-semibold text-main" : "text-sm font-semibold text-main"}>
            {t("admin.floor")}
          </label>
          <div className={compact ? "flex gap-1 mt-1" : "flex gap-3 mt-1"}>
            {/* Hardcoded etager 1-4 (kan udvides hvis flere etager tilføjes) */}
            {[1, 2, 3, 4].map((f) => (
              <button
                key={f}
                // Toggle logik: Hvis allerede valgt, nulstil til null, ellers sæt til f
                onClick={() => setFloorFilter(roomFilters.floor === f ? null : Number(f))}
                className={
                  compact
                    ? `px-2 py-1 rounded border text-xs font-medium transition ${
                        roomFilters.floor === f 
                          ? "bg-primary-600 text-white border-primary-600"  // Aktiv: Blå
                          : "bg-secondary-200 text-main border-secondary-200 hover:bg-secondary-100"  // Inaktiv: Grå
                      }`
                    : `px-4 py-2 rounded-md border text-sm transition font-medium ${
                        roomFilters.floor === f 
                          ? "bg-primary-600 text-white border-primary-600"  // Aktiv: Blå
                          : "bg-secondary-300 text-main border-secondary-200 hover:bg-secondary-200"  // Inaktiv: Grå
                      }`
                }
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 
        LOKALETYPE FILTER:
        Dropdown menu til at vælge en specifik lokaletype.
        Første option er "Alle" (tom værdi) for at nulstille filteret.
        
        ROLLE-FILTRERING:
        Kun lokaletyper som brugerens rolle må se vises i dropdown.
        Studerende ser kun "Studierum".
        Undervisere ser "Klasseværelse" og "Auditorium".
        Admin ser alle tre typer.
      */}
      <div className={compact ? "flex flex-col items-start" : "flex flex-col"}>
        <label className={compact ? "text-xs font-semibold text-main" : "text-sm font-semibold text-main"}>
          {t("booking.roomtype")}
        </label>
        <select
          className={
            compact 
              ? "px-2 py-1 rounded border text-xs bg-secondary-200 border-secondary-200 text-main mt-1" 
              : "px-4 py-2 rounded-md border text-sm bg-secondary-300 border-secondary-200 text-main mt-1"
          }
          value={roomFilters.roomType ?? ""}
          // Tom string bliver til null (intet filter)
          onChange={(e) => setRoomTypeFilter(e.target.value || null)}
        >
          {/* Default option: Vis alle typer */}
          <option value="">{t("admin.all")}</option>
          {/* Filtrer til kun tilladte typer for brugerens rolle */}
          {roomTypeOptions
            .filter((o) => allowedRoomTypes.includes(o.value))
            .map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
        </select>
      </div>

      {/* 
        NULSTIL KNAP:
        Labeled reset control aligned like other filters.
      */}
      <div className={compact ? "flex flex-col items-start" : "flex flex-col"}>
        <label className={compact ? "text-xs font-semibold text-main" : "text-sm font-semibold text-main"}>
          {t("booking.resetfilter")}
        </label>
        <button
          onClick={() => {
            resetRoomFilters();
            setCapacityInput("");  // Nulstil lokal input state
          }}
          className={
            compact
              ? "h-6 px-2 rounded border text-xs transition bg-secondary-200 border-secondary-200 text-main hover:bg-secondary-100 active:scale-[0.98] mt-1"
              : "h-10 px-5 rounded-md border text-sm transition bg-secondary-300 border-secondary-200 text-main hover:bg-secondary-200 active:scale-[0.98]"
          }
        >
          {t("booking.resetfilter")}
        </button>
      </div>
    </div>
  );
}
