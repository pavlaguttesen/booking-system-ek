// Viser liste over alle lokaler sorteret efter etage. Admin kan redigere, slette og åbne/lukke lokaler.

"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button, Group } from "@mantine/core";
import SmoothSwitch from "@/components/admin/SmoothSwitch";
import EditRoomOverlay from "@/app/overlays/EditRoomOverlay";
import { useTranslation } from "react-i18next";

// ------------------------------
// NATURLIG SORTERING
// ------------------------------
function naturalSort(a: string, b: string) {
  const ax: any[] = [];
  const bx: any[] = [];

  a.replace(/(\d+)|(\D+)/g, (_: any, num: string, str: string) => {
    ax.push([num || Infinity, str || ""]);
    return "";
  });
  b.replace(/(\d+)|(\D+)/g, (_: any, num: string, str: string) => {
    bx.push([num || Infinity, str || ""]);
    return "";
  });

  while (ax.length && bx.length) {
    const an = ax.shift();
    const bn = bx.shift();

    const numA = Number(an[0]);
    const numB = Number(bn[0]);
    if (numA !== numB) return numA - numB;

    if (an[1] !== bn[1]) return an[1].localeCompare(bn[1]);
  }

  return ax.length - bx.length;
}

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

type AdminRoomListProps = {
  search: string;
  typeFilter: string | null;
  floorFilter: string | null;
  statusFilter: string | null;
  reloadKey: number;
  onEdit: (room: Room) => void;
  onDelete: (room: Room) => void;
};

export default function AdminRoomList({
  search,
  typeFilter,
  floorFilter,
  statusFilter,
  reloadKey,
  onEdit,
  onDelete,
}: AdminRoomListProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const { t } = useTranslation();

  async function loadRooms() {
    setLoading(true);

    const { data } = await supabase.from("rooms").select("*");

    const uniqueRooms = Array.from(
      new Map((data || []).map((r) => [r.id, r])).values()
    );

    setRooms(uniqueRooms);
    setLoading(false);
  }

  const [didLoad, setDidLoad] = useState(false);

  useEffect(() => {
    if (!didLoad) {
      setDidLoad(true);
      loadRooms();
    } else {
      loadRooms();
    }
  }, [reloadKey]);

  const roomsByFloor = useMemo(() => {
    const grouped: Record<number, Room[]> = {};

    rooms.forEach((r) => {
      const floor = r.floor ?? 0;

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
    return <p className="text-main text-sm">{t("layout.retrievesrooms")}</p>;
  }

  return (
    <div className="space-y-10">
      {Object.keys(roomsByFloor)
        .map(Number)
        .sort((a, b) => a - b)
        .map((floor) => (
          <div
            key={floor}
            className="bg-white rounded-lg shadow-sm border border-secondary-200 px-8 py-6"
          >
            <h3 className="text-lg font-semibold text-main mb-4">
              {t("admin.floor")} {floor}
            </h3>

            <div className="border-t border-secondary-200/60 mb-4" />

            <div className="flex flex-col divide-y divide-secondary-200/60">
              {roomsByFloor[floor]
                .sort((a, b) => naturalSort(a.room_name, b.room_name))
                .map((room) => (
                  <div
                    key={room.id}
                    className="py-4 flex justify-between items-start gap-6"
                  >
                    {/* LEFT SIDE */}
                    <div className="flex flex-col">
                      <span className="font-medium text-main text-lg">
                        {room.room_name}
                      </span>

                      <span className="text-sm text-main/70">
                        {room.room_type} • {room.capacity} {t("booking.seats")}
                      </span>

                      {room.is_closed && (
                        <span className="text-sm text-status-booked mt-1">
                          {t("booking.roomclosed")}
                        </span>
                      )}
                    </div>

                    {/* RIGHT SIDE */}
                    <Group gap="md" wrap="wrap" className="shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-main/70">
                          {room.is_closed
                            ? t("booking.closed")
                            : t("booking.open")}
                        </span>

                        <SmoothSwitch
                          checked={!!room.is_closed}
                          onChange={async () => {
                            setRooms((prev) =>
                              prev.map((r) =>
                                r.id === room.id
                                  ? { ...r, is_closed: !room.is_closed }
                                  : r
                              )
                            );

                            await supabase
                              .from("rooms")
                              .update({ is_closed: !room.is_closed })
                              .eq("id", room.id);
                          }}
                        />
                      </div>

                      <Button variant="outline" onClick={() => onEdit(room)}>
                        {t("admin.edit")}
                      </Button>

                      <Button
                        color="red"
                        variant="outline"
                        onClick={async () => {
                          // Kør først den oprindelige callback hvis nødvendigt
                          onDelete?.(room);

                          const ok = window.confirm(
                            `${t("admin.deletebookingtext")} ${room.room_name}?`
                          );

                          if (!ok) return;

                          await supabase
                            .from("rooms")
                            .delete()
                            .eq("id", room.id);

                          loadRooms();
                        }}
                      >
                        {t("admin.delete")}
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
