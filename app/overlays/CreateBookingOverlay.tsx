"use client";

// Denne modal bruges til at oprette bookinger. Brugeren kan vælge dato,
// start- & sluttid samt lokale. Modalen åbner når man klikker i timeline
// eller når avanceret søgning finder et ledigt rum.

import {
  Modal,
  TextInput,
  Button,
  Select,
  Group,
  Text,
  Stack,
} from "@mantine/core";
import { DatePickerInput, TimeInput } from "@mantine/dates";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import type { Room } from "@/context/BookingContext";

type CreateBookingOverlayProps = {
  opened: boolean;
  onClose: () => void;
  roomId: string;
  start: Date;
  end: Date;
  rooms: Room[];
  onSubmit: (data: {
    roomId: string;
    title: string;
    start: Date;
    end: Date;
  }) => void;
};

export function CreateBookingOverlay({
  opened,
  onClose,
  roomId: initialRoomId,
  start: initialStart,
  end: initialEnd,
  rooms,
  onSubmit,
}: CreateBookingOverlayProps) {
  const [roomId, setRoomId] = useState<string>(initialRoomId);
  const [title, setTitle] = useState<string>("");
  const [chosenDate, setChosenDate] = useState<Date | null>(initialStart);
  const [startTime, setStartTime] = useState<Date>(initialStart);
  const [endTime, setEndTime] = useState<Date>(initialEnd);

  // Reset når modal åbner
  useEffect(() => {
    setRoomId(initialRoomId);
    setChosenDate(initialStart);
    setStartTime(initialStart);
    setEndTime(initialEnd);
    setTitle("");
  }, [opened, initialRoomId, initialStart, initialEnd]);

  function combine(date: Date | null, time: Date): Date {
    if (!date) return new Date();
    return dayjs(date)
      .hour(dayjs(time).hour())
      .minute(dayjs(time).minute())
      .second(0)
      .toDate();
  }

  function handleTimeChange(value: string, setter: (d: Date) => void) {
    if (!value || !chosenDate) return;
    const [h, m] = value.split(":");
    const dateObj = dayjs(chosenDate)
      .hour(Number(h))
      .minute(Number(m))
      .second(0)
      .toDate();
    setter(dateObj);
  }

  function handleSubmit() {
    const finalStart = combine(chosenDate, startTime);
    const finalEnd = combine(chosenDate, endTime);

    onSubmit({
      roomId,
      title,
      start: finalStart,
      end: finalEnd,
    });

    onClose();
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Opret booking" centered>
      <Stack gap="md">
        {/* Lokalevælger */}
        <Select
          label="Lokale"
          data={rooms.map((r) => ({
            value: r.id,
            label: r.room_name,
          }))}
          value={roomId}
          onChange={(val) => setRoomId(val || initialRoomId)}
        />

        {/* Titel */}
        <TextInput
          label="Titel"
          placeholder="Fx 'Gruppeøvelse i UX'"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Dato */}
        <DatePickerInput
          label="Dato"
          value={chosenDate}
          valueFormat="DD-MM-YYYY"
          onChange={(value) => {
            if (!value) {
              setChosenDate(null);
              return;
            }

            if (value && typeof value !== "string") {
              setChosenDate(value);
              return;
            }

            const parsed = dayjs(value, "DD-MM-YYYY").toDate();
            setChosenDate(parsed);
          }}
        />

        {/* Tid */}
        <Group grow>
          <TimeInput
            label="Starttid"
            value={dayjs(startTime).format("HH:mm")}
            onChange={(event) =>
              handleTimeChange(event.currentTarget.value, setStartTime)
            }
          />
          <TimeInput
            label="Sluttid"
            value={dayjs(endTime).format("HH:mm")}
            onChange={(event) =>
              handleTimeChange(event.currentTarget.value, setEndTime)
            }
          />
        </Group>

        {/* Preview */}
        <Text size="sm">
          <b>Start:</b>{" "}
          {dayjs(combine(chosenDate, startTime)).format("DD/MM/YYYY HH:mm")}
          <br />
          <b>Slut:</b>{" "}
          {dayjs(combine(chosenDate, endTime)).format("DD/MM/YYYY HH:mm")}
        </Text>

        <Button fullWidth onClick={handleSubmit}>
          Opret booking
        </Button>
      </Stack>
    </Modal>
  );
}
