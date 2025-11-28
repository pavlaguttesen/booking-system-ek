"use client";

import { useState } from "react";
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
  const { setSelectedDate, roomFilters } = useBookingContext();

  const [date, setDate] = useState<Date | null>(null);
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");

  const today = dayjs().startOf("day");

  function handleDateChange(value: string | Date | null) {
    let next: Date | null = null;

    if (value instanceof Date) next = value;
    else if (typeof value === "string") {
      const parsed = new Date(value);
      next = isNaN(parsed.getTime()) ? null : parsed;
    }

    if (next && dayjs(next).startOf("day").isBefore(today)) {
      return; // No selecting past dates
    }

    setDate(next);
    setSelectedDate(next ? dayjs(next).format("YYYY-MM-DD") : null);
  }

  function setRelativeDay(offset: number) {
    const d = dayjs().add(offset, "day").toDate();
    setDate(d);
    setSelectedDate(dayjs(d).format("YYYY-MM-DD"));
  }

  // If today has passed completely
  const now = dayjs();
  const dayEnded =
    date &&
    dayjs(date).isSame(today, "day") &&
    now.hour() >= 16;

  return (
    <div className="bg-card p-5 rounded-lg shadow-sm space-y-4">
      <DateInput
        label="Dato"
        placeholder="Vælg dato"
        value={date}
        onChange={handleDateChange}
        valueFormat="DD-MM-YYYY"
        minDate={today.toDate()}
      />

      <Group gap={6}>
        <Button variant="outline" size="xs" onClick={() => setRelativeDay(0)}>
          I dag
        </Button>
        <Button variant="outline" size="xs" onClick={() => setRelativeDay(1)}>
          I morgen
        </Button>
        <Button variant="outline" size="xs" onClick={() => setRelativeDay(2)}>
          I overmorgen
        </Button>
      </Group>

      {dayEnded ? (
        <p className="text-sm text-red-500 font-medium">
          Du kan ikke længere booke for i dag.
        </p>
      ) : (
        <>
          <TimeInput
            label="Fra"
            value={timeFrom}
            onChange={(e) => setTimeFrom(e.currentTarget.value)}
          />
          <TimeInput
            label="Til"
            value={timeTo}
            onChange={(e) => setTimeTo(e.currentTarget.value)}
          />

          <Button
            fullWidth
            className="bg-primary-600 text-invert hover:opacity-90"
            onClick={() =>
              onSearch({
                timeFrom,
                timeTo,
                whiteboard: roomFilters.whiteboard,
                screen: roomFilters.screen,
                board: roomFilters.board,
                fourPersons: false,
                sixPersons: false,
                eightPersons: false,
              })
            }
          >
            Søg
          </Button>
        </>
      )}
    </div>
  );
}
