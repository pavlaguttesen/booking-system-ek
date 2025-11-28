"use client";

// BookingAdvancedFilters repræsenterer UI'et som på CBS-screenshot:
// Tid (fra–til) + diverse egenskabsfiltre. Når der trykkes "Søg",
// kalder komponenten onSearch med alle valgte filtre.

import { TimeInput } from "@mantine/dates";
import { Checkbox, Button, Group, Stack, Text, Card } from "@mantine/core";
import { useState } from "react";

type FiltersState = {
  timeFrom: string;
  timeTo: string;
  whiteboard: boolean;
  screen: boolean;
  fourPersons: boolean;
  sixPersons: boolean;
  eightPersons: boolean;
  board: boolean;
};

export function BookingAdvancedFilters({
  onSearch,
}: {
  onSearch: (filters: FiltersState) => void;
}) {
  const [state, setState] = useState<FiltersState>({
    timeFrom: "",
    timeTo: "",
    whiteboard: false,
    screen: false,
    fourPersons: false,
    sixPersons: false,
    eightPersons: false,
    board: false,
  });

  function handleChange<K extends keyof FiltersState>(
    key: K,
    value: FiltersState[K]
  ) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    onSearch(state);
  }

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
          Tid & egenskaber
        </Text>

        <Stack gap={4}>
          <Text size="sm" fw={500}>
            Tid *
          </Text>
          <TimeInput
            label="Fra"
            value={state.timeFrom}
            onChange={(e) => handleChange("timeFrom", e.currentTarget.value)}
          />
          <TimeInput
            label="Til"
            value={state.timeTo}
            onChange={(e) => handleChange("timeTo", e.currentTarget.value)}
          />
        </Stack>

        <Text size="sm" fw={500} mt="xs">
          Filtre
        </Text>

        <Group align="flex-start">
          <Stack gap={4}>
            <Checkbox
              label="Whiteboard"
              checked={state.whiteboard}
              onChange={(e) =>
                handleChange("whiteboard", e.currentTarget.checked)
              }
            />
            <Checkbox
              label="Skærm"
              checked={state.screen}
              onChange={(e) =>
                handleChange("screen", e.currentTarget.checked)
              }
            />
            <Checkbox
              label="4 pers"
              checked={state.fourPersons}
              onChange={(e) =>
                handleChange("fourPersons", e.currentTarget.checked)
              }
            />
          </Stack>

          <Stack gap={4}>
            <Checkbox
              label="6 pers"
              checked={state.sixPersons}
              onChange={(e) =>
                handleChange("sixPersons", e.currentTarget.checked)
              }
            />
            <Checkbox
              label="8 pers"
              checked={state.eightPersons}
              onChange={(e) =>
                handleChange("eightPersons", e.currentTarget.checked)
              }
            />
            <Checkbox
              label="Opslagstavle"
              checked={state.board}
              onChange={(e) =>
                handleChange("board", e.currentTarget.checked)
              }
            />
          </Stack>
        </Group>

        <Button onClick={handleSubmit} mt="sm">
          Søg
        </Button>
      </Stack>
    </Card>
  );
}
