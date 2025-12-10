"use client";

// Modal til oprettelse af booking.
// Regler i UI:
// - Rolle-baseret lokaletype (studierum/klasseværelse/auditorium).
// - Booking skal ligge mellem 08:00 og 16:00.
// - Studerende: maks 4 timer pr. booking og maks 4 fremtidige bookinger.
// - Overlap-tjek i valgt lokale.

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
import { validateBookingLimits } from "@/context/BookingRules";
import { useTranslation } from "react-i18next";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 16;

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

// Normalisering af lokaletype.
function normalizeType(type: string | null): string | null {
  if (!type) return null;
  return type === "møderum" ? "studierum" : type;
}

export function CreateBookingOverlay({
  opened,
  onClose,
  roomId: initialRoomId,
  start: initialStart,
  end: initialEnd,
  rooms,
  onSubmit,
}: CreateBookingOverlayProps) {
  const { user, role } = useAuth();
  const { bookings, filteredBookings } = useBookingContext();
  const { t } = useTranslation();

  // Sørg for at vi altid har en streng-rolle.
  const effectiveRole: string = role ?? "student";

  const [roomId, setRoomId] = useState<string>(initialRoomId);
  const [title, setTitle] = useState<string>("");
  const [chosenDate, setChosenDate] = useState<Date | null>(initialStart);
  const [startTime, setStartTime] = useState<Date>(initialStart);
  const [endTime, setEndTime] = useState<Date>(initialEnd);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset state hver gang overlay åbnes.
  useEffect(() => {
    setRoomId(initialRoomId);
    setChosenDate(initialStart);
    setStartTime(initialStart);
    setEndTime(initialEnd);
    setTitle("");
    setErrorMessage(null);
  }, [opened, initialRoomId, initialStart, initialEnd]);

  // Kombinerer valgt dato og valgt tidspunkt.
  function combine(date: Date | null, time: Date): Date {
    if (!date) return new Date();
    return dayjs(date)
      .hour(dayjs(time).hour())
      .minute(dayjs(time).minute())
      .second(0)
      .toDate();
  }

  // Rolle → tilladte typer.
  const allowedTypesForRole: Record<string, string[]> = {
    student: ["studierum"],
    teacher: ["klasseværelse", "auditorium"],
    admin: ["studierum", "klasseværelse", "auditorium"],
  };

  // Rum der må vælges i dropdown ud fra rollen.
  const allowedRoomsForDropdown = rooms.filter((room) => {
    const t = normalizeType(room.room_type);
    return allowedTypesForRole[effectiveRole].includes(t || "");
  });

  // Bookinger i valgt lokale (til overlap).
  const bookingsInRoom = filteredBookings.filter((b) => b.room_id === roomId);

  // Tjekker overlap i samme lokale.
  function validateOverlap(finalStart: Date, finalEnd: Date) {
    for (const b of bookingsInRoom) {
      const bs = new Date(b.start_time);
      const be = new Date(b.end_time);

      const overlaps =
        (finalStart >= bs && finalStart < be) ||
        (finalEnd > bs && finalEnd <= be) ||
        (finalStart <= bs && finalEnd >= be);

      if (overlaps) {
        return `${t("booking.overlappingbooking")} ${dayjs(
          bs
        ).format("HH:mm")}–${dayjs(be).format("HH:mm")}`;
      }
    }
    return null;
  }

  // Hoved-validering – returnerer evt. fejltekst.
  function validate(): string | null {
    const finalStart = combine(chosenDate, startTime);
    const finalEnd = combine(chosenDate, endTime);

    if (finalEnd <= finalStart) {
      return t("booking.endtimebeforestarttime");
    }

    // Åbningstider – skal ligge mellem 08:00 og 16:00.
    const startHour =
      dayjs(finalStart).hour() + dayjs(finalStart).minute() / 60;
    const endHour = dayjs(finalEnd).hour() + dayjs(finalEnd).minute() / 60;

    if (startHour < DAY_START_HOUR || endHour > DAY_END_HOUR) {
      return t("booking.bookingoutsideopeninghours");
    }

    // Rolle vs. lokaletype.
    const selectedRoom = rooms.find((r) => r.id === roomId);
    if (selectedRoom) {
      const t_type = normalizeType(selectedRoom.room_type);

      if (!allowedTypesForRole[effectiveRole].includes(t_type || "")) {
        return t("booking.noaccesstoroom");
      }
    }

    // Studerende: maks 4 fremtidige bookinger + 4 timer.
    if (user) {
      const now = new Date();
      const futureBookingsForUser = bookings.filter(
        (b) =>
          b.user_id === user.id &&
          new Date(b.end_time).getTime() > now.getTime()
      );

      const limits = validateBookingLimits(
        effectiveRole,
        futureBookingsForUser,
        finalStart,
        finalEnd
      );

      if (!limits.ok) {
        return limits.message ? t(limits.message) : t("booking.bookinglimitexceeded");
      }
    }

    const overlapErr = validateOverlap(finalStart, finalEnd);
    if (overlapErr) return overlapErr;

    return null;
  }

  // Når der trykkes "Opret booking".
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
    <Modal opened={opened} onClose={onClose} centered title={null}>
      {/* Luk-knap med FontAwesome */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-500 hover:text-red-500 cursor-pointer transition"
      >
        <FontAwesomeIcon icon={faCircleXmark} className="text-2xl" />
      </button>

      <Text fw={700} size="xl" className="mb-2">
        {t("booking.createbooking")}
      </Text>

      <Stack gap="md">
        {/* Fejlbesked */}
        {(errorMessage || validate()) && (
          <Text c="red" size="sm">
            {errorMessage || validate()}
          </Text>
        )}

        {/* Lokalevalg – kun lokaler som rollen må booke */}
        <Select
          label={t("booking.room")}
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
          label={t("booking.title")}
          placeholder={t("booking.example")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <DatePickerInput
          label={t("booking.date")}
          value={chosenDate}
          valueFormat="DD-MM-YYYY"
          onChange={(value) => {
            setChosenDate(value ? dayjs(value).toDate() : null);
            setErrorMessage(null);
          }}
        />

        <Group grow>
          <TimeInput
            label={t("booking.starttime")}
            value={dayjs(startTime).format("HH:mm")}
            onChange={(event) => {
              const [h, m] = event.currentTarget.value.split(":");
              setStartTime(dayjs(startTime).hour(+h).minute(+m).toDate());
              setErrorMessage(null);
            }}
          />

          <TimeInput
            label={t("booking.endtime")}
            value={dayjs(endTime).format("HH:mm")}
            onChange={(event) => {
              const [h, m] = event.currentTarget.value.split(":");
              setEndTime(dayjs(endTime).hour(+h).minute(+m).toDate());
              setErrorMessage(null);
            }}
          />
        </Group>

        <Button fullWidth onClick={handleSubmit} disabled={isDisabled}>
          {t("booking.createbooking")}
        </Button>
      </Stack>
    </Modal>
  );
}
