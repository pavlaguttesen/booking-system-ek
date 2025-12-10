// Shared filter dropdown for room filters
"use client";

import { useState, useEffect } from "react";
import { useBookingContext } from "@/context/BookingContext";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

export default function RoomFiltersDropdown({ compact = false }: { compact?: boolean }) {
  const {
    roomFilters,
    toggleRoomFilter,
    setCapacityFilter,
    setFloorFilter,
    setRoomTypeFilter,
    resetRoomFilters,
  } = useBookingContext();

  const { role } = useAuth();
  const mounted = useMounted();
  const [capacityInput, setCapacityInput] = useState(roomFilters.capacity ? String(roomFilters.capacity) : "");
  const { t } = useTranslation();

  // Room type options
  const roomTypeOptions = [
    { value: "studierum", label: t("booking.studyroom") },
    { value: "klasseværelse", label: t("booking.classroom") },
    { value: "auditorium", label: "Auditorium" },
  ];

  const allowedTypesByRole: Record<string, string[]> = {
    student: ["studierum"],
    teacher: ["klasseværelse", "auditorium"],
    admin: ["studierum", "klasseværelse", "auditorium"],
  };
  const allowedRoomTypes = allowedTypesByRole[role ?? "student"];

  const facilityOptions: { key: "whiteboard" | "screen" | "board"; label: string }[] = [
    { key: "whiteboard", label: "Whiteboard" },
    { key: "screen", label: t("admin.screen") },
    { key: "board", label: t("admin.bulletinboard") },
  ];

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
      {/* Facilities */}
      <div className={compact ? "flex flex-col items-start" : "flex flex-col"}>
        <label className={compact ? "text-xs font-semibold text-main" : "text-sm font-semibold text-main"}>{t("booking.facilities")}</label>
        <div className={compact ? "flex gap-1 mt-1" : "flex gap-3 mt-1"}>
          {facilityOptions.map((item) => (
            <button
              key={item.key}
              onClick={() => toggleRoomFilter(item.key)}
              className={
                compact
                  ? `px-2 py-1 rounded border text-xs font-medium transition ${roomFilters[item.key] ? "bg-primary-600 text-white border-primary-600" : "bg-secondary-200 text-main border-secondary-200 hover:bg-secondary-100"}`
                  : `px-4 py-2 rounded-md border text-sm font-medium transition ${roomFilters[item.key] ? "bg-primary-600 text-white border-primary-600" : "bg-secondary-300 text-main border-secondary-200 hover:bg-secondary-200"}`
              }
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Capacity */}
      <div className={compact ? "flex flex-col items-start" : "flex flex-col"}>
        <label className={compact ? "text-xs font-semibold text-main" : "text-sm font-semibold text-main"}>{t("booking.number")}</label>
        {mounted ? (
          <input
            type="text"
            value={capacityInput}
            placeholder={t("admin.numberPlaceholder")}
            onChange={(e) => handleCapacityChange(e.target.value)}
            className={compact ? "px-2 py-1 rounded border text-xs bg-secondary-200 border-secondary-200 text-main w-16 mt-1" : "px-3 py-2 rounded-md border text-sm bg-secondary-300 border-secondary-200 text-main w-24 mt-1"}
          />
        ) : (
          <div className={compact ? "w-16 h-6 mt-1 bg-secondary-200 rounded border border-secondary-200" : "w-24 h-36px mt-1 bg-secondary-300 rounded-md border border-secondary-200"} />
        )}
      </div>

      {/* Floor (admin only) */}
      {role === "admin" && (
        <div className={compact ? "flex flex-col items-start" : "flex flex-col"}>
          <label className={compact ? "text-xs font-semibold text-main" : "text-sm font-semibold text-main"}>{t("admin.floor")}</label>
          <div className={compact ? "flex gap-1 mt-1" : "flex gap-3 mt-1"}>
            {[1, 2, 3, 4].map((f) => (
              <button
                key={f}
                onClick={() => setFloorFilter(roomFilters.floor === f ? null : Number(f))}
                className={
                  compact
                    ? `px-2 py-1 rounded border text-xs font-medium transition ${roomFilters.floor === f ? "bg-primary-600 text-white border-primary-600" : "bg-secondary-200 text-main border-secondary-200 hover:bg-secondary-100"}`
                    : `px-4 py-2 rounded-md border text-sm transition font-medium ${roomFilters.floor === f ? "bg-primary-600 text-white border-primary-600" : "bg-secondary-300 text-main border-secondary-200 hover:bg-secondary-200"}`
                }
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Room type */}
      <div className={compact ? "flex flex-col items-start" : "flex flex-col"}>
        <label className={compact ? "text-xs font-semibold text-main" : "text-sm font-semibold text-main"}>{t("booking.roomtype")}</label>
        <select
          className={compact ? "px-2 py-1 rounded border text-xs bg-secondary-200 border-secondary-200 text-main mt-1" : "px-4 py-2 rounded-md border text-sm bg-secondary-300 border-secondary-200 text-main mt-1"}
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

      {/* Reset button */}
      <button
        onClick={() => {
          resetRoomFilters();
          setCapacityInput("");
        }}
        className={
          compact
            ? "px-2 py-1 rounded border text-xs transition bg-secondary-200 border-secondary-200 text-main hover:bg-secondary-100 active:scale-[0.98] h-fit font-medium mt-2"
            : "px-5 py-2 rounded-md border text-sm transition bg-secondary-300 border-secondary-200 text-main hover:bg-secondary-200 active:scale-[0.98] h-fit font-medium"
        }
      >
        {t("booking.resetfilter")}
      </button>
    </div>
  );
}
