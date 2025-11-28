"use client";

import { Modal, Button } from "@mantine/core";

type SelectRoomOverlayProps = {
  opened: boolean;
  onClose: () => void;
  rooms: { id: string; room_name: string; capacity: number | null }[];
  start: Date;
  end: Date;
  onSelect: (roomId: string) => void;
};

export function SelectRoomOverlay({
  opened,
  onClose,
  rooms,
  start,
  end,
  onSelect,
}: SelectRoomOverlayProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Vælg et ledigt lokale" centered>
      <div className="space-y-3">
        {rooms.length === 0 && (
          <p className="text-center text-main">Ingen matchende rum fundet.</p>
        )}

        {rooms.map((r) => (
          <Button
            key={r.id}
            fullWidth
            className="bg-primary-600 hover:bg-primary-700 text-invert"
            onClick={() => onSelect(r.id)}
          >
            {r.room_name} (Kapacitet: {r.capacity ?? "ukendt"})
          </Button>
        ))}
      </div>
    </Modal>
  );
}
