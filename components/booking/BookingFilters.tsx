"use client";

import { DatePickerInput } from "@mantine/dates";
import {
  Select,
  Button,
  Card,
  Group,
  Stack,
  Text,
  type SelectProps,
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

  // DatePickerInput kører her med string|null
  const pickerValue: string | null = selectedDate || null;

  const setToday = () => {
    setSelectedDate(dayjs().format("YYYY-MM-DD"));
  };

  const setTomorrow = () => {
    setSelectedDate(dayjs().add(1, "day").format("YYYY-MM-DD"));
  };

  const clearDate = () => setSelectedDate("");

  // Fælles input-styles til Mantine-komponenter
  const inputStyles: SelectProps["styles"] = {
    input: {
      backgroundColor: "#222B36",
      color: "#C9D1D9",
      borderColor: "#30363D",
    },
    dropdown: {
      backgroundColor: "#161B22",
      borderColor: "#30363D",
    },
  };

  return (
    <Card
      radius="md"
      p="lg"
      style={{
        backgroundColor: "#1E2630",
        border: "1px solid #30363D",
      }}
    >
      <Stack gap="sm">
        <Text fw={600} size="lg" c="#C9D1D9">
          Filtre
        </Text>

        <Group grow wrap="wrap" gap="md">
          {/* Dato-filter */}
          <Stack gap={4} style={{ minWidth: "240px" }}>
            <DatePickerInput
              label="Dato"
              placeholder="Vælg dato"
              value={pickerValue}
              onChange={(value: string | null) => {
                if (value) {
                  const iso = dayjs(value).format("YYYY-MM-DD");
                  setSelectedDate(iso);
                } else {
                  setSelectedDate("");
                }
              }}
              clearable
              valueFormat="DD-MM-YYYY"
              styles={inputStyles}
            />

            <Group gap={6}>
              <Button variant="outline" size="xs" onClick={setToday}>
                I dag
              </Button>
              <Button variant="outline" size="xs" onClick={setTomorrow}>
                I morgen
              </Button>
              <Button variant="outline" size="xs" onClick={clearDate}>
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
