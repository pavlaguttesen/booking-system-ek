"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabaseClient";

type RoomForEdit = {
  id: string;
  room_name: string;
  room_type: string | null;
  capacity: number | null;
  floor: number | null;
  has_whiteboard: boolean | null;
  has_screen: boolean | null;
  has_board: boolean | null;
  is_closed: boolean | null;
  nr_of_seats?: number | null;
};

type EditRoomOverlayProps = {
  room: RoomForEdit;
  onClose: () => void;
  onSave: () => void;
};

export default function EditRoomOverlay({
  room,
  onClose,
  onSave,
}: EditRoomOverlayProps) {
  const [mounted, setMounted] = useState(false);

  const [roomName, setRoomName] = useState(room.room_name);
  const [capacity, setCapacity] = useState(room.capacity ?? 0);
  const [seats, setSeats] = useState(room.nr_of_seats ?? 0);
  const [hasWhiteboard, setHasWhiteboard] = useState(
    room.has_whiteboard ?? false
  );
  const [hasScreen, setHasScreen] = useState(room.has_screen ?? false);
  const [hasBoard, setHasBoard] = useState(room.has_board ?? false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSave() {
    const { error } = await supabase
      .from("rooms")
      .update({
        room_name: roomName,
        capacity,
        nr_of_seats: seats,
        has_board: hasBoard,
        has_whiteboard: hasWhiteboard,
        has_screen: hasScreen,
      })
      .eq("id", room.id);

    if (error) {
      console.error("Update error:", error);
      alert("Der skete en fejl — ændringerne blev ikke gemt.");
      return;
    }

    onSave();
    onClose();
  }

  if (!mounted) return null;

  const overlay = (
    <div className="fixed inset-0 bg-black/40 z-[9999] flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl border border-secondary-200">
        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-secondary-200">
          <h2 className="text-xl font-semibold text-main">Rediger lokale</h2>

          {/* Close button to match other overlays */}
          <button
            onClick={onClose}
            className="text-2xl leading-none text-secondary-600 hover:text-main"
          >
            ×
          </button>
        </div>

        {/* CONTENT */}
        <div className="px-6 py-6 space-y-6">
          {/* Lokalenavn */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Lokalenavn
            </label>
            <input
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-400 focus:outline-none"
            />
          </div>

          {/* Kapacitet */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Kapacitet
            </label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-400 focus:outline-none"
            />
          </div>

          {/* Antal sæder */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Antal sæder
            </label>
            <input
              type="number"
              value={seats}
              onChange={(e) => setSeats(Number(e.target.value))}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-400 focus:outline-none"
            />
          </div>

          {/* Faciliteter */}
          <div className="flex items-center gap-6 mt-2">
            <label className="flex items-center gap-2 text-secondary-700">
              <input
                type="checkbox"
                checked={hasWhiteboard}
                onChange={() => setHasWhiteboard(!hasWhiteboard)}
                className="h-4 w-4"
              />
              Whiteboard
            </label>

            <label className="flex items-center gap-2 text-secondary-700">
              <input
                type="checkbox"
                checked={hasBoard}
                onChange={() => setHasBoard(!hasBoard)}
                className="h-4 w-4"
              />
              Tavle
            </label>

            <label className="flex items-center gap-2 text-secondary-700">
              <input
                type="checkbox"
                checked={hasScreen}
                onChange={() => setHasScreen(!hasScreen)}
                className="h-4 w-4"
              />
              Skærm
            </label>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-secondary-200 bg-secondary-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-secondary-200 text-secondary-700 hover:bg-secondary-300"
          >
            Annuller
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-600/90"
          >
            Gem ændringer
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.getElementById("overlay-root")!);
}
