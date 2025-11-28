"use client";

import { useState, useEffect } from "react";
import { DateInput, TimeInput } from "@mantine/dates";
import { Button, Group } from "@mantine/core";
import dayjs from "dayjs";
import { useBookingContext } from "@/context/BookingContext";

export function BookingAdvancedFilters({
  onSearch,
}: {
  onSearch: (data: {
    timeFrom: string;
    timeTo: string;
    whiteboard: boolean;
    screen: boolean;
    board: boolean;
    fourPersons: boolean;
    sixPersons: boolean;
    eightPersons: boolean;
  }) => void;
}) {
  const {
    setSelectedDate,
    roomFilters,
    filteredRooms,
    bookings,
    selectedDate,
  } = useBookingContext();

  const [date, setDate] = useState<Date | null>(null);
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [suggestedTimes, setSuggestedTimes] = useState<string[]>([]);

  const today = dayjs().startOf("day");

  /* -----------------------------------------------------
     Forslag baseret på dato + ledige rum
  ----------------------------------------------------- */
  useEffect(() => {
    if (!selectedDate) {
      setSuggestedTimes([]);
      return;
    }

    const selectedDay = dayjs(selectedDate);
    const now = dayjs();

    const isToday = selectedDay.isSame(now, "day");

    let startHour = 8;

    if (isToday) {
      const currentHour = now.hour();
      const currentMinute = now.minute();

      // Hvis dagen er “slut”, ingen forslag
      if (currentHour > 15 || (currentHour === 15 && currentMinute > 0)) {
        setSuggestedTimes([]);
        setTimeFrom("");
        setTimeTo("");
        return;
      }

      const nextHour = currentMinute === 0 ? currentHour : currentHour + 1;
      startHour = Math.max(8, Math.min(nextHour, 15));
    }

    const times: string[] = [];

    for (let h = startHour; h <= 15; h++) {
      const slotStart = selectedDay.hour(h).minute(0).second(0);
      const slotEnd = slotStart.add(1, "hour");

      if (isToday && slotStart.isBefore(now)) continue;

      const hasFreeRoom = filteredRooms.some((room) => {
        return !bookings.some((b) => {
          if (b.room_id !== room.id) return false;

          const bStart = dayjs(b.start_time);
          const bEnd = dayjs(b.end_time);

          return slotStart.isBefore(bEnd) && slotEnd.isAfter(bStart);
        });
      });

      if (hasFreeRoom) {
        times.push(slotStart.format("HH:mm"));
      }
    }

    setSuggestedTimes(times);

    if (times.length > 0) {
      const first = times[0];
      setTimeFrom(first);
      const endHour = Number(first.split(":")[0]) + 1;
      setTimeTo(`${String(endHour).padStart(2, "0")}:00`);
    } else {
      setTimeFrom("");
      setTimeTo("");
    }
  }, [selectedDate, filteredRooms, bookings]);

  /* -----------------------------------------------------
     Dato-håndtering
  ----------------------------------------------------- */
  function handleDateChange(value: string | Date | null) {
    let next: Date | null = null;

    if (value === null) next = null;
    else if (value instanceof Date) next = value;
    else if (typeof value === "string") {
      const parsed = new Date(value);
      next = isNaN(parsed.getTime()) ? null : parsed;
    }

    if (next && dayjs(next).isBefore(today, "day")) {
      next = today.toDate();
    }

    setDate(next);
    setSelectedDate(next ? dayjs(next).format("YYYY-MM-DD") : null);
  }

  function setRelativeDay(offset: number) {
    const d = dayjs().add(offset, "day").toDate();
    setDate(d);
    setSelectedDate(dayjs(d).format("YYYY-MM-DD"));
  }

  /* -----------------------------------------------------
     UI
  ----------------------------------------------------- */
  return (
    <div className="bg-card p-5 rounded-lg shadow-sm space-y-4">
      <DateInput
        label="Dato"
        placeholder="Vælg dato"
        value={date}
        onChange={handleDateChange}
        valueFormat="DD-MM-YYYY"
        minDate={today.toDate()}
        styles={{
          input: {
            backgroundColor: "var(--color-surface-card)",
            color: "var(--color-text-main)",
            borderColor: "var(--color-secondary-200)",
          },
          label: { color: "var(--color-text-main)", fontWeight: 600 },
        }}
      />

      <Group gap={6}>
        <Button size="xs" variant="outline" onClick={() => setRelativeDay(0)}>
          I dag
        </Button>
        <Button size="xs" variant="outline" onClick={() => setRelativeDay(1)}>
          I morgen
        </Button>
        <Button size="xs" variant="outline" onClick={() => setRelativeDay(2)}>
          I overmorgen
        </Button>
      </Group>

      <label className="text-sm font-medium text-main">Fra</label>
      <TimeInput
        value={timeFrom}
        onChange={(e) => setTimeFrom(e.currentTarget.value)}
      />

      {suggestedTimes.length > 0 && (
        <div>
          <p className="text-sm text-main mb-1">Forslag</p>
          <Group gap={6}>
            {suggestedTimes.map((t) => (
              <Button
                key={t}
                size="xs"
                variant="outline"
                onClick={() => {
                  setTimeFrom(t);
                  const endHour = Number(t.split(":")[0]) + 1;
                  setTimeTo(`${String(endHour).padStart(2, "0")}:00`);
                }}
              >
                {t}
              </Button>
            ))}
          </Group>
        </div>
      )}

      <label className="text-sm font-medium text-main">Til</label>
      <TimeInput value={timeTo} onChange={(e) => setTimeTo(e.currentTarget.value)} />

      <Button
        fullWidth
        onClick={() => {
          // NY VALIDATION – forhindrer tomme input
          if (!timeFrom || !timeTo) {
            alert("Vælg venligst både start- og sluttid.");
            return;
          }

          onSearch({
            timeFrom,
            timeTo,
            whiteboard: roomFilters.whiteboard,
            screen: roomFilters.screen,
            board: roomFilters.board,
            fourPersons: false,
            sixPersons: false,
            eightPersons: false,
          });
        }}
      >
        Søg
      </Button>
    </div>
  );
}
