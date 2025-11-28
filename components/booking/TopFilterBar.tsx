"use client";

import { useState } from "react";
import { useBookingContext } from "@/context/BookingContext";

interface ToggleProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function ToggleButton({ label, active, onClick }: ToggleProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-md text-sm font-medium border transition select-none
        whitespace-nowrap
        ${
          active
            ? "bg-primary-600 text-invert border-primary-600"
            : "bg-secondary-300 text-main border-secondary-200 hover:bg-secondary-200"
        }
      `}
    >
      {label}
    </button>
  );
}

export default function TopFilterBar() {
  const { roomFilters, toggleRoomFilter, setCapacityFilter, resetRoomFilters } =
    useBookingContext();

  const [capacityInput, setCapacityInput] = useState("");

  function handleCapacityChange(v: string) {
    setCapacityInput(v);

    const num = Number(v);
    if (!v || isNaN(num)) {
      setCapacityFilter(null);
    } else {
      setCapacityFilter(num);
    }
  }

  function handleReset() {
    resetRoomFilters();
    setCapacityInput("");
  }

  return (
    <div className="w-full flex flex-wrap items-end gap-8">
      {/* FACILITETER */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-main">Faciliteter</label>

        <div className="flex flex-wrap gap-3">
          <ToggleButton
            label="Whiteboard"
            active={roomFilters.whiteboard}
            onClick={() => toggleRoomFilter("whiteboard")}
          />
          <ToggleButton
            label="Skærm"
            active={roomFilters.screen}
            onClick={() => toggleRoomFilter("screen")}
          />
          <ToggleButton
            label="Opslagstavle"
            active={roomFilters.board}
            onClick={() => toggleRoomFilter("board")}
          />
        </div>
      </div>

      {/* ANTAL PERSONER */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-main">Antal personer</label>

        <input
          type="text"
          value={capacityInput}
          onChange={(e) => handleCapacityChange(e.target.value)}
          placeholder="Fx 4"
          className="
            px-3 py-2 rounded-md border text-sm 
            bg-secondary-300 border-secondary-200 text-main
            focus:outline-none focus:ring-2 focus:ring-primary-400
            w-[90px]
          "
        />
      </div>

      {/* RESET KNAP — ALTID HØJRE JUSTERET MEN WRAPPER PÆNT */}
      <div className="ml-auto">
        <button
          onClick={handleReset}
          className="
    px-4 py-2 rounded-md text-sm font-medium border 
    bg-secondary-300 text-main border-secondary-200
    transition-all duration-150 whitespace-nowrap
    hover:bg-secondary-200 hover:shadow-sm
    active:scale-[0.97] active:bg-secondary-300 active:shadow-inner
  "
        >
          Nulstil filtre
        </button>
      </div>
    </div>
  );
}
