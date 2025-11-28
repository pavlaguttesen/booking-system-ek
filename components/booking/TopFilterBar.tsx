"use client";

import { useBookingContext } from "@/context/BookingContext";
import { useState } from "react";

export default function TopFilterBar() {
  const {
    roomFilters,
    toggleRoomFilter,
    setCapacityFilter,
    resetRoomFilters,
    setFloorFilter,
  } = useBookingContext();

  const [capacityInput, setCapacityInput] = useState("");

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
    <div className="w-full flex items-center justify-between mb-4">

      {/* LEFT SIDE */}
      <div className="flex items-center gap-10">

        {/* FACILITETER */}
        <div>
          <label className="text-sm font-semibold text-main">Faciliteter</label>
          <div className="flex gap-3 mt-1">

            {/* Whiteboard */}
            <button
              onClick={() => toggleRoomFilter("whiteboard")}
              className={`px-4 py-2 rounded-md border text-sm transition
                ${roomFilters.whiteboard
                  ? "bg-primary-600 text-invert border-primary-600"
                  : "bg-secondary-300 text-main border-secondary-200"
                }`}
            >
              Whiteboard
            </button>

            {/* Skærm */}
            <button
              onClick={() => toggleRoomFilter("screen")}
              className={`px-4 py-2 rounded-md border text-sm transition
                ${roomFilters.screen
                  ? "bg-primary-600 text-invert border-primary-600"
                  : "bg-secondary-300 text-main border-secondary-200"
                }`}
            >
              Skærm
            </button>

            {/* Opslagstavle */}
            <button
              onClick={() => toggleRoomFilter("board")}
              className={`px-4 py-2 rounded-md border text-sm transition
                ${roomFilters.board
                  ? "bg-primary-600 text-invert border-primary-600"
                  : "bg-secondary-300 text-main border-secondary-200"
                }`}
            >
              Opslagstavle
            </button>

          </div>
        </div>

        {/* ANTAL PERSONER */}
        <div>
          <label className="text-sm font-semibold text-main">Antal personer</label>
          <input
            type="text"
            value={capacityInput}
            placeholder="Fx 4"
            onChange={(e) => handleCapacityChange(e.target.value)}
            className="px-3 py-2 rounded-md border text-sm bg-secondary-300 border-secondary-200 text-main w-24 mt-1"
          />
        </div>

        {/* ETAGE — NEW */}
        <div>
          <label className="text-sm font-semibold text-main">Etage</label>
          <div className="flex gap-3 mt-1">

            {[1, 2, 3, 4].map((f) => (
              <button
                key={f}
                onClick={() => setFloorFilter(roomFilters.floor === f ? null : f)}
                className={`px-4 py-2 rounded-md border text-sm transition
                  ${roomFilters.floor === f
                    ? "bg-primary-600 text-invert border-primary-600"
                    : "bg-secondary-300 text-main border-secondary-200"
                  }`}
              >
                {f}
              </button>
            ))}

          </div>
        </div>

      </div>

      {/* RESET BUTTON */}
      <button
        onClick={() => {
          resetRoomFilters();
          setCapacityInput("");
        }}
        className="px-5 py-2 rounded-md border text-sm transition bg-secondary-300 border-secondary-200 text-main hover:bg-secondary-200 active:scale-[0.98]"
      >
        Nulstil filtre
      </button>
    </div>
  );
}
