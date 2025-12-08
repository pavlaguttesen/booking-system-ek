// Avanceret søgefilter til højre på bookingsiden. Brugeren kan søge efter ledige lokaler
// baseret på dato, tid og faciliteter. Viser foreslåede tidslots.

"use client";

import { useState, useEffect } from "react";
import { DateInput, TimeInput } from "@mantine/dates";
import { Button, Group } from "@mantine/core";
import dayjs from "dayjs";
import { useBookingContext } from "@/context/BookingContext";
import { useTranslation } from "react-i18next";

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

export function BookingAdvancedFilters({
  onSearch,
  onError,
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

  onError: (title: string, message: string) => void;
}) {
  const mounted = useMounted();
  const { t } = useTranslation();

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
      setTimeTo(
        `${String(Number(first.split(":")[0]) + 1).padStart(2, "0")}:00`
      );
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
     Kun klient-rendering (hydrering fix)
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
     TEGNING
  ----------------------------------------------------- */
  return (
    <div className="bg-card p-5 rounded-lg shadow-sm space-y-4">
      {/* Dato */}
      <DateInput
        label={t("booking.date")}
        placeholder={t("booking.selectdate")}
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
          {t("booking.today")}
        </Button>
        <Button size="xs" variant="outline" onClick={() => setRelativeDay(1)}>
          {t("booking.tomorrow")}
        </Button>
        <Button size="xs" variant="outline" onClick={() => setRelativeDay(2)}>
          {t("booking.dayaftertomorrow")}
        </Button>
      </Group>

      {/* Fra */}
      <label className="text-sm font-medium text-main">{t("booking.from")}</label>
      <TimeInput
        value={timeFrom}
        onChange={(e) => setTimeFrom(e.currentTarget.value)}
      />

      {/* Forslag */}
      {suggestedTimes.length > 0 && (
        <div>
          <p className="text-sm text-main mb-1">{t("booking.suggestion")}</p>
          <Group gap={6}>
            {suggestedTimes.map((t_time) => (
              <Button
                key={t_time}
                size="xs"
                variant="outline"
                onClick={() => {
                  setTimeFrom(t_time);
                  setTimeTo(
                    `${String(Number(t_time.split(":")[0]) + 1).padStart(2, "0")}:00`
                  );
                }}
              >
                {t_time}
              </Button>
            ))}
          </Group>
        </div>
      )}

      {/* Til */}
      <label className="text-sm font-medium text-main">{t("booking.to")}</label>
      <TimeInput
        value={timeTo}
        onChange={(e) => setTimeTo(e.currentTarget.value)}
      />

      {/* Søg */}
      <Button
        fullWidth
        onClick={() => {
          if (!timeFrom || !timeTo) {
            onError(t("booking.choosedate"), t("booking.choosestartandendtime"));
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
        {t("booking.search")}
      </Button>
    </div>
  );
}

export default BookingAdvancedFilters;
