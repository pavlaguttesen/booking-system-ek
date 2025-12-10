// Filterbar øverst på bookingsiden. Viser faciliteter, kapacitet, etage og lokaletype. Admin ser ekstra etage-filter.

"use client";

import { useState, useEffect } from "react";
import { useBookingContext } from "@/context/BookingContext";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

// Hook som sikrer at inputs kun vises på klienten
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

export default function TopFilterBar() {
  const {
    roomFilters,
    toggleRoomFilter,
    setCapacityFilter,
    resetRoomFilters,
    setFloorFilter,
    setRoomTypeFilter,
  } = useBookingContext();

  const { role } = useAuth();
  const mounted = useMounted();
  const [capacityInput, setCapacityInput] = useState("");

  // Kapacitet
  function handleCapacityChange(val: string) {
    setCapacityInput(val);
    const n = Number(val);

    if (!isNaN(n) && n > 0) {
      setCapacityFilter(n);
    } else {
      setCapacityFilter(null);
    }
  }

  // NORMALIZED ROOM TYPES:
  // "møderum" → "studierum"
  const normalizeType = (type: string | null) =>
    type === "møderum" ? "studierum" : type;


  // Kalder på Translation
  const { t } = useTranslation();

  // Lokaletype muligheder
  const roomTypeOptions = [
    { value: "studierum", label: t("booking.studyroom") },
    { value: "klasseværelse", label: t("booking.classroom") },
    { value: "auditorium", label: "Auditorium" },
  ];

  // Hvilke rumtyper må vises for hver rolle?
  const allowedTypesByRole: Record<string, string[]> = {
    student: ["studierum"],
    teacher: ["klasseværelse", "auditorium"],
    admin: ["studierum", "klasseværelse", "auditorium"],
  };

  const allowedRoomTypes = allowedTypesByRole[role ?? "student"];

  // Facilitet-knapper typed
  const facilityOptions: { key: "whiteboard" | "screen" | "board"; label: string }[] = [
    { key: "whiteboard", label: "Whiteboard" },
    { key: "screen", label: t("admin.screen") },
    { key: "board", label: t("admin.bulletinboard") },
  ];

  // ---------------------------------------------------------
  // TEGNING
  // ---------------------------------------------------------

  return (
    <div className="w-full flex items-start justify-between mb-4">

      {/* LEFT COLUMN GROUP ---------------------------- */}
      <div className="flex items-start gap-10">

        {/* FACILITETER */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-main">{t("booking.facilities")}</label>

          <div className="flex gap-3 mt-1">
            {facilityOptions.map((item) => (
              <button
                key={item.key}
                onClick={() => toggleRoomFilter(item.key)}
                className={`px-4 py-2 rounded-md border text-sm font-medium transition
                ${
                  roomFilters[item.key]
                    ? "bg-primary-600 text-white border-primary-600"
                    : "bg-secondary-300 text-main border-secondary-200 hover:bg-secondary-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* ANTAL PERSONER */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-main">{t("booking.number")}</label>

          {mounted ? (
            <input
              type="text"
              value={capacityInput}
              placeholder={t("admin.numberPlaceholder")}
              onChange={(e) => handleCapacityChange(e.target.value)}
              className="px-3 py-2 rounded-md border text-sm bg-secondary-300 border-secondary-200 text-main w-24 mt-1"
            />
          ) : (
            <div className="w-24 h-36px mt-1 bg-secondary-300 rounded-md border border-secondary-200" />
          )}
        </div>

        {/* ETAGE — KUN ADMIN */}
        {role === "admin" && (
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-main">{t("admin.floor")}</label>
            <div className="flex gap-3 mt-1">
              {[1, 2, 3, 4].map((f) => (
                <button
                  key={f}
                  onClick={() =>
                    setFloorFilter(roomFilters.floor === f ? null : f)
                  }
                  className={`px-4 py-2 rounded-md border text-sm transition font-medium
                    ${
                      roomFilters.floor === f
                        ? "bg-primary-600 text-white border-primary-600"
                        : "bg-secondary-300 text-main border-secondary-200 hover:bg-secondary-200"
                    }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* LOKALETYPE */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-main">{t("booking.roomtype")}</label>

          <select
            className="px-4 py-2 rounded-md border text-sm bg-secondary-300 border-secondary-200 text-main mt-1"
            value={roomFilters.roomType ?? ""}
            onChange={(e) => setRoomTypeFilter(e.target.value || null)}
          >
            <option value="">{t("admin.all")}</option>

            {roomTypeOptions
              .filter((o) => allowedRoomTypes.includes(o.value))
              .map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
          </select>
        </div>

      </div>

      {/* RESET KNAP */}
      <button
        onClick={() => {
          resetRoomFilters();
          setCapacityInput("");
        }}
        className="px-5 py-2 rounded-md border text-sm transition bg-secondary-300 border-secondary-200 text-main hover:bg-secondary-200 active:scale-[0.98] h-fit font-medium"
      >
        {t("booking.resetfilter")}
      </button>
    </div>
  );
}
