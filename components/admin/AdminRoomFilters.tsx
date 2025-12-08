"use client";

import { Select, TextInput, Group } from "@mantine/core";
import { useTranslation } from "react-i18next";

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
}: Props) 
{
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4 mb-12">
      <TextInput
        label={t("booking.search")}
        placeholder={t("admin.lookforroom")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Group grow>
        <Select
          label="Type"
          placeholder={t("admin.allTypes")}
          value={typeFilter}
          onChange={setTypeFilter}
          data={[
            { value: null, label: t("admin.allTypes") },
            { value: "studierum", label: t("booking.stydyroom") },
            { value: "møderum", label: t("booking.meetingroom") },
            { value: "klasseværelse", label: t("booking.classroom") },
            { value: "auditorium", label: "Auditorium" },
          ].map((x) => ({ value: x.value ?? "", label: x.label }))}
        />

        <Select
          label={t("booking.floor")}
          placeholder={t("admin.allFloor")}
          value={floorFilter}
          onChange={setFloorFilter}
          data={[
            { value: "", label: t("admin.allFloor") },
            { value: "0", label: "0" },
            { value: "1", label: "1" },
            { value: "2", label: "2" },
            { value: "3", label: "3" },
          ]}
        />

        <Select
          label="Status"
          placeholder={t("admin.all")}
          value={statusFilter}
          onChange={setStatusFilter}
          data={[
            { value: "", label: t("admin.all") },
            { value: "open", label: t("admin.open") },
            { value: "closed", label: t("admin.closed") },
          ]}
        />
      </Group>
    </div>
  );
}
