"use client";

// Denne komponent håndterer filtrering af bookinger.
// Datoen SKAL altid være en valid dato, ellers får timeline "Invalid Date".
// Derfor arbejder vi her kun med Date-objekter og konverterer til ISO ved setSelectedDate.

// Mantine-krav: DatePickerInput skal have value = Date | null, ikke år/måneds strings.

import { DatePickerInput } from "@mantine/dates";
import {
  Select,
  Button,
  Card,
  Group,
  Stack,
  Text,
  type SelectProps,
  type ButtonProps,
} from "@mantine/core";
import dayjs from "dayjs";
import { useBookingContext } from "@/context/BookingContext";

export function BookingFilters() {
  const {
    rooms,
    selectedDate,
    selectedRoomId,
    bookingTypeFilter,
    setSelectedDate,
    setSelectedRoomId,
    setBookingTypeFilter,
  } = useBookingContext();

  // 🎯 Mantine vil gerne have Date | null — ikke en string
  const pickerValue = selectedDate ? new Date(selectedDate) : null;

  // 🎯 Disse knapper sætter altid en valid ISO-dato
  const setToday = () => {
    const newDate = dayjs().format("YYYY-MM-DD");
    setSelectedDate(newDate);
  };

  const setTomorrow = () => {
    const newDate = dayjs().add(1, "day").format("YYYY-MM-DD");
    setSelectedDate(newDate);
  };

  // 🎯 Vi tillader IKKE at clearDate giver en tom streng → det ødelægger timeline
  // I stedet vælger vi "i dag"
  const clearDate = () => {
    const fallback = dayjs().format("YYYY-MM-DD");
    setSelectedDate(fallback);
  };

  // Styling
  const inputStyles: SelectProps["styles"] = {
    input: {
      backgroundColor: "var(--color-surface-card)",
      color: "var(--color-text-main)",
      borderColor: "var(--color-primary-200)",
    },
    dropdown: {
      backgroundColor: "var(--color-surface-page)",
      borderColor: "var(--color-primary-200)",
    },
    label: {
      color: "var(--color-text-main)",
    },
  };

  const buttonStyles: ButtonProps["styles"] = {
    root: {
      backgroundColor: "transparent",
      color: "var(--color-primary-600)",
      borderColor: "var(--color-primary-600)",
      "&:hover": {
        backgroundColor: "var(--color-primary-100)",
      },
    },
  };

  return (
    <Card
      radius="md"
      p="lg"
      style={{
        backgroundColor: "var(--color-surface-card)",
        border: "1px solid var(--color-primary-200)",
      }}
    >
      <Stack gap="sm">
        <Text fw={600} size="lg" c="var(--color-text-main)">
          Filtre
        </Text>

        <Group grow wrap="wrap" gap="md">
          {/* Dato-filter */}
          <Stack gap={4} style={{ minWidth: "240px" }}>
            <DatePickerInput
              label="Dato"
              placeholder="Vælg dato"
              // Mantine kræver Date | null
              value={pickerValue}
              valueFormat="DD-MM-YYYY"
              clearable={false} // ❌ ikke tilladt at lade brugeren cleare dato
              styles={inputStyles}
              onChange={(value) => {
                // value = Date | null
                if (value) {
                  // Konverter til ISO for at undgå "Invalid Date"
                  const iso = dayjs(value).format("YYYY-MM-DD");
                  setSelectedDate(iso);
                }
              }}
            />

            <Group gap={6}>
              <Button
                variant="outline"
                size="xs"
                onClick={setToday}
                styles={buttonStyles}
              >
                I dag
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={setTomorrow}
                styles={buttonStyles}
              >
                I morgen
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={clearDate}
                styles={buttonStyles}
              >
                Ryd
              </Button>
            </Group>
          </Stack>

          {/* Lokale-filter */}
          <Select
            label="Lokale"
            placeholder="Vælg lokale"
            data={[
              { value: "all", label: "Alle lokaler" },
              ...rooms.map((r) => ({ value: r.id, label: r.room_name })),
            ]}
            value={selectedRoomId}
            onChange={(val) => setSelectedRoomId(val || "all")}
            styles={inputStyles}
            style={{ minWidth: "220px" }}
          />

          {/* Type-filter */}
          <Select
            label="Type"
            placeholder="Alle typer"
            data={[
              { value: "all", label: "Alle" },
              { value: "normal", label: "Normale bookinger" },
              { value: "exam", label: "Eksamen" },
            ]}
            value={bookingTypeFilter}
            onChange={(val) =>
              setBookingTypeFilter(
                (val as "all" | "normal" | "exam") || "all"
              )
            }
            styles={inputStyles}
            style={{ minWidth: "200px" }}
          />
        </Group>
      </Stack>
    </Card>
  );
}
