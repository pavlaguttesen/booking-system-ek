"use client";

import { Select, TextInput, Group } from "@mantine/core";

export default function AdminRoomFilters({
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
  floorFilter,
  setFloorFilter,
  statusFilter,
  setStatusFilter,
}: {
  search: string;
  setSearch: (v: string) => void;
  typeFilter: string | null;
  setTypeFilter: (v: string | null) => void;
  floorFilter: string | null;
  setFloorFilter: (v: string | null) => void;
  statusFilter: string | null;
  setStatusFilter: (v: string | null) => void;
}) {
  return (
    <Group grow align="flex-end" className="mb-6">

      <TextInput
        label="Søg lokale"
        placeholder="Fx C.2.1"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Select
        label="Type"
        placeholder="Alle typer"
        value={typeFilter}
        onChange={setTypeFilter}
        data={[
          { value: "studierum", label: "Studierum" },
          { value: "møderum", label: "Møderum" },
          { value: "klasseværelse", label: "Klasseværelse" },
          { value: "auditorium", label: "Auditorium" },
        ]}
      />

      <Select
        label="Etage"
        placeholder="Alle"
        value={floorFilter}
        onChange={setFloorFilter}
        data={["0", "1", "2", "3", "4", "5"].map((n) => ({
          value: n,
          label: "Etage " + n,
        }))}
      />

      <Select
        label="Status"
        placeholder="Alle"
        value={statusFilter}
        onChange={setStatusFilter}
        data={[
          { value: "open", label: "Åben" },
          { value: "closed", label: "Lukket" },
        ]}
      />

    </Group>
  );
}
