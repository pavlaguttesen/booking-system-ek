"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button, Group } from "@mantine/core";
import dayjs from "dayjs";
import SmoothSwitch from "@/components/admin/SmoothSwitch";

type Room = {
  id: string;
  room_name: string;
  room_type: string | null;
  capacity: number | null;
  floor: number | null;
  has_whiteboard: boolean | null;
  has_screen: boolean | null;
  has_board: boolean | null;
  is_closed: boolean | null;
};

export default function AdminRoomList({
  search,
  typeFilter,
  floorFilter,
  statusFilter,
}: {
  search: string;
  typeFilter: string | null;
  floorFilter: string | null;
  statusFilter: string | null;
}) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadRooms() {
    setLoading(true);
    const { data } = await supabase.from("rooms").select("*");
    setRooms(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadRooms();
  }, []);

  const roomsByFloor = useMemo(() => {
    const grouped: Record<number, Room[]> = {};

    rooms.forEach((r) => {
      const floor = r.floor ?? 0;

      // FILTERING
      if (search && !r.room_name.toLowerCase().includes(search.toLowerCase()))
        return;

      if (typeFilter && r.room_type !== typeFilter) return;
      if (floorFilter && String(floor) !== String(floorFilter)) return;

      if (statusFilter === "open" && r.is_closed) return;
      if (statusFilter === "closed" && !r.is_closed) return;

      if (!grouped[floor]) grouped[floor] = [];
      grouped[floor].push(r);
    });

    return grouped;
  }, [rooms, search, typeFilter, floorFilter, statusFilter]);

  if (loading) {
    return <p className="text-main text-sm">Henter lokaler...</p>;
  }

  return (
    <div className="space-y-10">
      {Object.keys(roomsByFloor)
        .map(Number)
        .sort((a, b) => a - b)
        .map((floor) => (
          <div
            key={floor}
            className="
              bg-white 
              rounded-xl 
              shadow-sm 
              border 
              border-secondary-200 
              px-8 
              py-6
            "
          >
            {/* Floor title */}
            <h3 className="text-lg font-semibold text-main mb-4">
              Etage {floor}
            </h3>

            <div className="border-t border-secondary-200/60 mb-4" />

            {/* Rooms list */}
            <div className="flex flex-col divide-y divide-secondary-200/60">
              {roomsByFloor[floor].map((room) => (
                <div
                  key={room.id}
                  className="py-4 flex justify-between items-center"
                >
                  {/* Left side */}
                  <div className="flex flex-col">
                    <span className="font-medium text-main text-lg">
                      {room.room_name}
                    </span>

                    <span className="text-sm text-secondary-600">
                      {room.room_type} • {room.capacity} pladser
                    </span>

                    {room.is_closed && (
                      <span className="text-sm text-red-600 mt-1">
                        Dette lokale er midlertidigt lukket
                      </span>
                    )}
                  </div>

                  {/* Right side: toggle + buttons */}
                  <Group gap="md">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-secondary-600">
                        {room.is_closed ? "Lukket" : "Åben"}
                      </span>

                      <SmoothSwitch
                        checked={!!room.is_closed}
                        onChange={async () => {
                          await supabase
                            .from("rooms")
                            .update({ is_closed: !room.is_closed })
                            .eq("id", room.id);
                          loadRooms();
                        }}
                      />
                    </div>

                    <Button variant="outline">Rediger</Button>

                    <Button
                      color="red"
                      variant="outline"
                      onClick={async () => {
                        await supabase.from("rooms").delete().eq("id", room.id);
                        loadRooms();
                      }}
                    >
                      Slet
                    </Button>
                  </Group>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
