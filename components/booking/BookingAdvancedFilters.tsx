"use client";

import { useState, useEffect } from "react";
import { DateInput, TimeInput } from "@mantine/dates";
import { Button, Group } from "@mantine/core";
import dayjs from "dayjs";
import { useBookingContext } from "@/context/BookingContext";

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

export function BookingAdvancedFilters({
  onSearch,
  onError,    // <-- NY PROP
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

  onError: (title: string, message: string) => void; // <-- NY PROP
}) {
  const mounted = useMounted();

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
     Auto-forslag
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

      if (hasFreeRoom) times.push(slotStart.format("HH:mm"));
    }

    setSuggestedTimes(times);

    if (times.length > 0) {
      const first = times[0];
      setTimeFrom(first);
      setTimeTo(`${String(Number(first.split(":")[0]) + 1).padStart(2, "0")}:00`);
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

    if (value instanceof Date) next = value;
    else if (typeof value === "string") {
      const parsed = new Date(value);
      next = isNaN(parsed.getTime()) ? null : parsed;
    } else next = null;

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
     Client-only rendering (hydration fix)
  ----------------------------------------------------- */
  if (!mounted) {
    return (
      <div className="bg-card p-5 rounded-lg shadow-sm space-y-4 opacity-40 animate-pulse">
        <div className="h-6 bg-secondary-300 rounded w-40" />
        <div className="h-10 bg-secondary-200 rounded" />
        <div className="h-10 bg-secondary-200 rounded" />
        <div className="h-10 bg-secondary-200 rounded" />
      </div>
    );
  }

  /* -----------------------------------------------------
     RENDER
  ----------------------------------------------------- */
  return (
    <div className="bg-card p-5 rounded-lg shadow-sm space-y-4">

      {/* Dato */}
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

      {/* Hurtig-dato */}
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

      {/* Fra */}
      <label className="text-sm font-medium text-main">Fra</label>
      <TimeInput
        value={timeFrom}
        onChange={(e) => setTimeFrom(e.currentTarget.value)}
      />

      {/* Forslag */}
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
                  setTimeTo(
                    `${String(Number(t.split(":")[0]) + 1).padStart(2, "0")}:00`
                  );
                }}
              >
                {t}
              </Button>
            ))}
          </Group>
        </div>
      )}

      {/* Til */}
      <label className="text-sm font-medium text-main">Til</label>
      <TimeInput
        value={timeTo}
        onChange={(e) => setTimeTo(e.currentTarget.value)}
      />

      {/* Søg */}
      <Button
        fullWidth
        onClick={() => {
          if (!timeFrom || !timeTo) {
            onError("Manglende tid", "Vælg venligst både start- og sluttid.");
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

export default BookingAdvancedFilters;
