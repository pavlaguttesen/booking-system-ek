"use client";

import { useBookingContext } from "@/context/BookingContext";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";

// Hook der sikrer at vi kun renderer inputs på klienten
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

  // Kapacitetsændring
  function handleCapacityChange(val: string) {
    setCapacityInput(val);
    const n = Number(val);

    if (!isNaN(n) && n > 0) {
      setCapacityFilter(n);
    } else {
      setCapacityFilter(null);
    }
  }

  // Lokaletype muligheder
  const roomTypeOptions = [
    { value: "studierum", label: "Studierum" },
    { value: "møderum", label: "Mødelokale" },
    { value: "klasseværelse", label: "Klasselokale" },
    { value: "auditorium", label: "Auditorium" },
  ];

  // Rollebaseret adgang
  const allowedTypesByRole: Record<string, string[]> = {
    student: ["studierum", "møderum"],
    teacher: ["møderum", "klasseværelse", "auditorium"],
    admin: ["studierum", "møderum", "klasseværelse", "auditorium"],
  };

  const allowedRoomTypes = allowedTypesByRole[role ?? "student"];

  return (
    <div className="w-full flex items-start justify-between mb-4">

      {/* LEFT GROUP */}
      <div className="flex items-start gap-10">

        {/* FACILITETER */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-main">Faciliteter</label>

          <div className="flex gap-3 mt-1">
            <button
              onClick={() => toggleRoomFilter("whiteboard")}
              className={`px-4 py-2 rounded-md border text-sm transition
                ${
                  roomFilters.whiteboard
                    ? "bg-primary-600 text-invert border-primary-600"
                    : "bg-secondary-300 text-main border-secondary-200"
                }`}
            >
              Whiteboard
            </button>

            <button
              onClick={() => toggleRoomFilter("screen")}
              className={`px-4 py-2 rounded-md border text-sm transition
                ${
                  roomFilters.screen
                    ? "bg-primary-600 text-invert border-primary-600"
                    : "bg-secondary-300 text-main border-secondary-200"
                }`}
            >
              Skærm
            </button>

            <button
              onClick={() => toggleRoomFilter("board")}
              className={`px-4 py-2 rounded-md border text-sm transition
                ${
                  roomFilters.board
                    ? "bg-primary-600 text-invert border-primary-600"
                    : "bg-secondary-300 text-main border-secondary-200"
                }`}
            >
              Opslagstavle
            </button>
          </div>
        </div>

        {/* ANTAL PERSONER */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-main">Antal personer</label>

          {mounted ? (
            <input
              type="text"
              value={capacityInput}
              placeholder="Fx 4"
              onChange={(e) => handleCapacityChange(e.target.value)}
              className="px-3 py-2 rounded-md border text-sm bg-secondary-300 border-secondary-200 text-main w-24 mt-1"
            />
          ) : (
            <div className="w-24 h-[36px] mt-1 bg-secondary-300 rounded-md border border-secondary-200" />
          )}
        </div>

        {/* ETAGE */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-main">Etage</label>
          <div className="flex gap-3 mt-1">
            {[1, 2, 3, 4].map((f) => (
              <button
                key={f}
                onClick={() => setFloorFilter(roomFilters.floor === f ? null : f)}
                className={`px-4 py-2 rounded-md border text-sm transition
                  ${
                    roomFilters.floor === f
                      ? "bg-primary-600 text-invert border-primary-600"
                      : "bg-secondary-300 text-main border-secondary-200"
                  }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* LOKALETYPE — VIS FOR ALLE ROLLER */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-main">Lokaletype</label>

          <select
            className="px-4 py-2 rounded-md border text-sm bg-secondary-300 border-secondary-200 text-main mt-1"
            value={roomFilters.roomType ?? ""}
            onChange={(e) => setRoomTypeFilter(e.target.value || null)}
          >
            <option value="">Alle</option>

            {roomTypeOptions
              .filter((opt) => allowedRoomTypes.includes(opt.value))
              .map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* RESET BUTTON */}
      <button
        onClick={() => {
          resetRoomFilters();
          setCapacityInput("");
        }}
        className="px-5 py-2 rounded-md border text-sm transition bg-secondary-300 border-secondary-200 text-main hover:bg-secondary-200 active:scale-[0.98] h-fit"
      >
        Nulstil filtre
      </button>
    </div>
  );
}
