"use client";

// Dansk kommentar: Modal til oprettelse af booking
// Indeholder validering på overlap, ugyldige tider og lokaletype-rolle checks.

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
import type { Room, Booking } from "@/context/BookingContext";
import { useAuth } from "@/context/AuthContext";
import { useBookingContext } from "@/context/BookingContext";

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
  const { role } = useAuth();
  const { filteredBookings } = useBookingContext();

  const [roomId, setRoomId] = useState<string>(initialRoomId);
  const [title, setTitle] = useState<string>("");
  const [chosenDate, setChosenDate] = useState<Date | null>(initialStart);
  const [startTime, setStartTime] = useState<Date>(initialStart);
  const [endTime, setEndTime] = useState<Date>(initialEnd);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset når modal åbner
  useEffect(() => {
    setRoomId(initialRoomId);
    setChosenDate(initialStart);
    setStartTime(initialStart);
    setEndTime(initialEnd);
    setTitle("");
    setErrorMessage(null);
  }, [opened, initialRoomId, initialStart, initialEnd]);

  function combine(date: Date | null, time: Date): Date {
    if (!date) return new Date();
    return dayjs(date)
      .hour(dayjs(time).hour())
      .minute(dayjs(time).minute())
      .second(0)
      .toDate();
  }

  // Liste over hvilke lokaletyper en rolle må booke
  const allowedTypesForRole: Record<string, string[]> = {
    student: ["studierum", "møderum"],
    teacher: ["møderum", "klasseværelse", "auditorium"],
    admin: ["studierum", "møderum", "klasseværelse", "auditorium"],
  };

  // Dansk kommentar: Finder alle bookinger i det valgte lokale
  const bookingsInRoom = filteredBookings.filter((b) => b.room_id === roomId);

  // ------------------------------------------------------------------
  // Dansk kommentar: Tjekker om valgt start/slut overlapper en booking
  // ------------------------------------------------------------------
  function validateOverlap(finalStart: Date, finalEnd: Date) {
    if (!chosenDate) return null;

    for (const b of bookingsInRoom) {
      const bs = new Date(b.start_time);
      const be = new Date(b.end_time);

      const overlaps =
        (finalStart >= bs && finalStart < be) ||
        (finalEnd > bs && finalEnd <= be) ||
        (finalStart <= bs && finalEnd >= be);

      if (overlaps) {
        const range = `${dayjs(bs).format("HH:mm")}–${dayjs(be).format(
          "HH:mm"
        )}`;

        // Returnér præcis fejlbesked:
        if (finalStart >= bs && finalStart < be) {
          return `Starttid overlapper eksisterende booking kl. ${range}`;
        }

        if (finalEnd > bs && finalEnd <= be) {
          return `Sluttid overlapper eksisterende booking kl. ${range}`;
        }

        return `Valgte tidsrum overlapper eksisterende booking kl. ${range}`;
      }
    }

    return null;
  }

  // ------------------------------------------------------------------
  // Dansk kommentar: Hoved-validering
  // ------------------------------------------------------------------
  function validate() {
    const finalStart = combine(chosenDate, startTime);
    const finalEnd = combine(chosenDate, endTime);

    if (finalEnd <= finalStart) {
      return "Sluttid skal være senere end starttid.";
    }

    const selectedRoom = rooms.find((r) => r.id === roomId);
    if (selectedRoom && selectedRoom.room_type) {
      const allowed = allowedTypesForRole[role ?? "student"];
      if (!allowed.includes(selectedRoom.room_type)) {
        return `Du har ikke adgang til at booke denne type lokale: ${selectedRoom.room_type}`;
      }
    }

    const overlapErr = validateOverlap(finalStart, finalEnd);
    if (overlapErr) return overlapErr;

    return null;
  }

  // ------------------------------------------------------------------
  // Dansk kommentar: Håndtering af klik på "Opret booking"
  // ------------------------------------------------------------------
  function handleSubmit() {
    const err = validate();
    if (err) {
      setErrorMessage(err);
      return;
    }

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

  // Book-knap deaktiveret hvis der er fejl
  const isDisabled = !!validate();

  return (
    <Modal opened={opened} onClose={onClose} title="Opret booking" centered>
      <Stack gap="md">
        {validate() && (
          <Text c="red" size="sm">
            {validate()}
          </Text>
        )}

        <Select
          label="Lokale"
          data={rooms.map((r) => ({
            value: r.id,
            label: r.room_name,
          }))}
          value={roomId}
          onChange={(val) => {
            setRoomId(val || initialRoomId);
            setErrorMessage(null);
          }}
        />

        <TextInput
          label="Titel"
          placeholder="Fx 'Gruppeøvelse i UX'"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <DatePickerInput
          label="Dato"
          value={chosenDate}
          valueFormat="DD-MM-YYYY"
          onChange={(value) => {
            if (value === null) {
              setChosenDate(null);
            } else {
              // Dansk kommentar: Mantine kan returnere både Date og string.
              // Vi parser altid til en gyldig Date via dayjs.
              const parsed = dayjs(value).toDate();
              setChosenDate(parsed);
            }
            setErrorMessage(null);
          }}
        />

        <Group grow>
          <TimeInput
            label="Starttid"
            value={dayjs(startTime).format("HH:mm")}
            onChange={(event) => {
              const val = event.currentTarget.value;
              if (val) {
                const [h, m] = val.split(":");
                setStartTime(dayjs(startTime).hour(+h).minute(+m).toDate());
              }
              setErrorMessage(null);
            }}
          />

          <TimeInput
            label="Sluttid"
            value={dayjs(endTime).format("HH:mm")}
            onChange={(event) => {
              const val = event.currentTarget.value;
              if (val) {
                const [h, m] = val.split(":");
                setEndTime(dayjs(endTime).hour(+h).minute(+m).toDate());
              }
              setErrorMessage(null);
            }}
          />
        </Group>

        <Text size="sm">
          <b>Start:</b>{" "}
          {dayjs(combine(chosenDate, startTime)).format("DD/MM/YYYY HH:mm")}
          <br />
          <b>Slut:</b>{" "}
          {dayjs(combine(chosenDate, endTime)).format("DD/MM/YYYY HH:mm")}
        </Text>

        <Button fullWidth onClick={handleSubmit} disabled={isDisabled}>
          Opret booking
        </Button>
      </Stack>
    </Modal>
  );
}
