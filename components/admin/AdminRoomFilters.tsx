"use client";

import { Select, TextInput, Group } from "@mantine/core";

type Props = {
  search: string;
  setSearch: (v: string) => void;

  typeFilter: string | null;
  setTypeFilter: (v: string | null) => void;

  floorFilter: string | null;
  setFloorFilter: (v: string | null) => void;

  statusFilter: string | null;
  setStatusFilter: (v: string | null) => void;
};

export default function AdminRoomFilters({
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
  floorFilter,
  setFloorFilter,
  statusFilter,
  setStatusFilter,
}: Props) {
  return (
    <div className="flex flex-col gap-4 mb-12">
      <TextInput
        label="Søg"
        placeholder="Søg efter lokale…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Group grow>
        <Select
          label="Type"
          placeholder="Alle typer"
          value={typeFilter}
          onChange={setTypeFilter}
          data={[
            { value: null, label: "Alle typer" },
            { value: "studierum", label: "Studierum" },
            { value: "møderum", label: "Møderum" },
            { value: "klasseværelse", label: "Klasselokale" },
            { value: "auditorium", label: "Auditorium" },
          ].map((x) => ({ value: x.value ?? "", label: x.label }))}
        />

        <Select
          label="Etage"
          placeholder="Alle etager"
          value={floorFilter}
          onChange={setFloorFilter}
          data={[
            { value: "", label: "Alle etager" },
            { value: "0", label: "0" },
            { value: "1", label: "1" },
            { value: "2", label: "2" },
            { value: "3", label: "3" },
          ]}
        />

        <Select
          label="Status"
          placeholder="Alle"
          value={statusFilter}
          onChange={setStatusFilter}
          data={[
            { value: "", label: "Alle" },
            { value: "open", label: "Åbne" },
            { value: "closed", label: "Lukkede" },
          ]}
        />
      </Group>
    </div>
  );
}
