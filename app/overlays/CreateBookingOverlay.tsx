"use client";

import { Modal, TextInput, Button, Select } from "@mantine/core";
import dayjs from "dayjs";
import { useState } from "react";

export function CreateBookingOverlay({
  opened,
  onClose,
  roomId,
  start,
  end,
  rooms,
  onSubmit,
}: {
  opened: boolean;
  onClose: () => void;
  roomId: string;
  start: Date;
  end: Date;
  rooms: { id: string; room_name: string }[];
  onSubmit: (data: { roomId: string; title: string; start: Date; end: Date }) => void;
}) {
  const [title, setTitle] = useState("");

  return (
    <Modal opened={opened} onClose={onClose} title="Opret booking" centered>
      <div className="space-y-4">
        <Select
          label="Lokale"
          data={rooms.map((r) => ({ value: r.id, label: r.room_name }))}
          value={roomId}
          onChange={() => {}}
        />

        <TextInput
          label="Titel"
          placeholder="Fx 'Gruppeøvelse i UX'"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="text-sm">
          Start: {dayjs(start).format("DD/MM/YYYY HH:mm")}
          <br />
          Slut: {dayjs(end).format("DD/MM/YYYY HH:mm")}
        </div>

        <Button
          fullWidth
          onClick={() => onSubmit({ roomId, title, start, end })}
        >
          Opret booking
        </Button>
      </div>
    </Modal>
  );
}
