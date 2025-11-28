"use client";

// BookingFilters styrer dato, lokaler og booking-type for timeline/listen.

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

  const pickerValue: Date | null = selectedDate
    ? dayjs(selectedDate, "YYYY-MM-DD").toDate()
    : null;

  const setToday = () => {
    setSelectedDate(dayjs().format("YYYY-MM-DD"));
  };

  const setTomorrow = () => {
    setSelectedDate(dayjs().add(1, "day").format("YYYY-MM-DD"));
  };

  const clearDate = () => setSelectedDate(null);

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
          {/* Dato */}
          <Stack gap={4} style={{ minWidth: "240px" }}>
            <DatePickerInput
              label="Dato"
              placeholder="Vælg dato"
              value={pickerValue}
              onChange={(value) => {
                if (value) {
                  const iso = dayjs(value).format("YYYY-MM-DD");
                  setSelectedDate(iso);
                } else {
                  setSelectedDate(null);
                }
              }}
              clearable
              valueFormat="DD-MM-YYYY"
              styles={inputStyles}
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

          {/* Lokale */}
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

          {/* Type */}
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
