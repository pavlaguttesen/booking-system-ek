"use client";

// Dansk kommentar: Modal til oprettelse af booking
// Implementerer regler:
// - Studerende må kun booke studierum
// - Undervisere må ikke booke studierum
// - Møderum → studierum (normaliseres)
// - Dropdown viser kun lokaler brugeren må booke

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

  // Dansk: normaliserer møderum til studierum
  function normalizeType(type: string | null): string | null {
    if (!type) return null;
    return type === "møderum" ? "studierum" : type;
  }

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset state ved open
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

  // Liste over hvilke lokaletyper hver rolle må booke
  const allowedTypesForRole: Record<string, string[]> = {
    student: ["studierum"],
    teacher: ["klasseværelse", "auditorium"],
    admin: ["studierum", "klasseværelse", "auditorium"],
  };

  // Drop-down filtrering baseret på rolle
  const allowedRoomsForDropdown = rooms.filter((room) => {
    const t = normalizeType(room.room_type);
    return allowedTypesForRole[role ?? "student"].includes(t || "");
  });

  // Bookinger i samme lokale
  const bookingsInRoom = filteredBookings.filter((b) => b.room_id === roomId);

  // ------------------------------------------------------------------
  // Overlap validering
  // ------------------------------------------------------------------
  function validateOverlap(finalStart: Date, finalEnd: Date) {
    for (const b of bookingsInRoom) {
      const bs = new Date(b.start_time);
      const be = new Date(b.end_time);

      const overlaps =
        (finalStart >= bs && finalStart < be) ||
        (finalEnd > bs && finalEnd <= be) ||
        (finalStart <= bs && finalEnd >= be);

      if (overlaps) {
        return `Valgte tid overlapper en eksisterende booking: ${dayjs(bs).format(
          "HH:mm"
        )}–${dayjs(be).format("HH:mm")}`;
      }
    }
    return null;
  }

  // ------------------------------------------------------------------
  // Hovedvalidering
  // ------------------------------------------------------------------
  function validate() {
    const finalStart = combine(chosenDate, startTime);
    const finalEnd = combine(chosenDate, endTime);

    if (finalEnd <= finalStart) {
      return "Sluttid skal være senere end starttid.";
    }

    // Lokaletype tjek
    const selectedRoom = rooms.find((r) => r.id === roomId);
    if (selectedRoom) {
      const t = normalizeType(selectedRoom.room_type);

      if (!allowedTypesForRole[role ?? "student"].includes(t || "")) {
        return `Du har ikke adgang til at booke denne type lokale (${t}).`;
      }
    }

    const overlapErr = validateOverlap(finalStart, finalEnd);
    if (overlapErr) return overlapErr;

    return null;
  }

  // ------------------------------------------------------------------
  // Når "Opret booking" klikkes
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

  const isDisabled = !!validate();

  return (
    <Modal opened={opened} onClose={onClose} title="Opret booking" centered>
      <Stack gap="md">
        {/* Fejlbesked */}
        {validate() && (
          <Text c="red" size="sm">
            {validate()}
          </Text>
        )}

        {/* Lokalevalg — filtreret efter rolle */}
        <Select
          label="Lokale"
          data={allowedRoomsForDropdown.map((r) => ({
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
          placeholder="Fx 'Gruppearbejde'"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <DatePickerInput
          label="Dato"
          value={chosenDate}
          valueFormat="DD-MM-YYYY"
          onChange={(value) => {
            setChosenDate(value ? dayjs(value).toDate() : null);
            setErrorMessage(null);
          }}
        />

        <Group grow>
          <TimeInput
            label="Starttid"
            value={dayjs(startTime).format("HH:mm")}
            onChange={(event) => {
              const [h, m] = event.currentTarget.value.split(":");
              setStartTime(dayjs(startTime).hour(+h).minute(+m).toDate());
              setErrorMessage(null);
            }}
          />

          <TimeInput
            label="Sluttid"
            value={dayjs(endTime).format("HH:mm")}
            onChange={(event) => {
              const [h, m] = event.currentTarget.value.split(":");
              setEndTime(dayjs(endTime).hour(+h).minute(+m).toDate());
              setErrorMessage(null);
            }}
          />
        </Group>

        <Button fullWidth onClick={handleSubmit} disabled={isDisabled}>
          Opret booking
        </Button>
      </Stack>
    </Modal>
  );
}
