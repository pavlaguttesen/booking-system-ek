"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import dayjs from "dayjs";
import {
  Button,
  Select,
  TextInput,
  Group,
  Card,
  Text,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";

export default function AdminBookingPanel() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  const [roomFilter, setRoomFilter] = useState<string | null>(null);
  const [userFilter, setUserFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  async function loadData() {
    const [{ data: b }, { data: r }, { data: p }] = await Promise.all([
      supabase.from("bookings").select("*"),
      supabase.from("rooms").select("*"),
      supabase.from("profiles").select("*"),
    ]);

    setBookings(b || []);
    setRooms(r || []);
    setProfiles(p || []);
  }

  useEffect(() => {
    loadData();
  }, []);

  function deleteBooking(id: string) {
    supabase.from("bookings").delete().eq("id", id);
    setBookings((prev) => prev.filter((b) => b.id !== id));
  }

  const filtered = bookings.filter((b) => {
    const start = dayjs(b.start_time);

    if (roomFilter && b.room_id !== roomFilter) return false;
    if (userFilter && b.user_id !== userFilter) return false;
    if (typeFilter && b.booking_type !== typeFilter) return false;

    if (dateFrom && start.isBefore(dateFrom, "day")) return false;
    if (dateTo && start.isAfter(dateTo, "day")) return false;

    return true;
  });

  return (
    <div className="w-full flex flex-col gap-8">

      <h2 className="text-xl font-semibold text-main">Alle bookinger</h2>

      {/* Filters */}
      <Group grow>

        <Select
          label="Rum"
          placeholder="Alle rum"
          value={roomFilter}
          onChange={setRoomFilter}
          data={rooms.map((r) => ({ value: r.id, label: r.room_name }))}
        />

        <Select
          label="Bruger"
          placeholder="Alle brugere"
          value={userFilter}
          onChange={setUserFilter}
          data={profiles.map((p) => ({ value: p.id, label: p.full_name }))}
        />

        <Select
          label="Type"
          placeholder="Alle typer"
          value={typeFilter}
          onChange={setTypeFilter}
          data={[
            { value: "normal", label: "Normal booking" },
            { value: "exam", label: "Eksamensbooking" },
          ]}
        />
      </Group>

      {/* Date filters */}
      <Group grow>

        <DatePickerInput
          label="Fra dato"
          value={dateFrom ? dayjs(dateFrom).format("YYYY-MM-DD") : null}
          valueFormat="DD-MM-YYYY"
          onChange={(v) => setDateFrom(v ? new Date(v) : null)}
        />

        <DatePickerInput
          label="Til dato"
          value={dateTo ? dayjs(dateTo).format("YYYY-MM-DD") : null}
          valueFormat="DD-MM-YYYY"
          onChange={(v) => setDateTo(v ? new Date(v) : null)}
        />
      </Group>

      {/* Week shortcuts */}
      <Group>
        <Button onClick={() => {
          const d = dayjs();
          setDateFrom(d.startOf("day").toDate());
          setDateTo(d.endOf("day").toDate());
        }}>I dag</Button>

        <Button onClick={() => {
          const d = dayjs().add(1, "day");
          setDateFrom(d.startOf("day").toDate());
          setDateTo(d.endOf("day").toDate());
        }}>I morgen</Button>

        <Button onClick={() => {
          const start = dayjs().startOf("week").add(1, "day");
          const end = dayjs().endOf("week").add(1, "day");
          setDateFrom(start.toDate());
          setDateTo(end.toDate());
        }}>Denne uge</Button>

        <Button onClick={() => {
          const start = dayjs().add(1, "week").startOf("week").add(1, "day");
          const end = dayjs().add(1, "week").endOf("week").add(1, "day");
          setDateFrom(start.toDate());
          setDateTo(end.toDate());
        }}>Næste uge</Button>

        <Button variant="outline" onClick={() => {
          setDateFrom(null);
          setDateTo(null);
        }}>Reset</Button>
      </Group>

      {/* Booking cards */}
      <div className="flex flex-col gap-4">
        {filtered.map((b) => {
          const room = rooms.find((r) => r.id === b.room_id);
          const user = profiles.find((p) => p.id === b.user_id);

          return (
            <Card key={b.id} withBorder padding="lg">
              <Group justify="space-between">
                <div>
                  <Text fw={600}>{b.title}</Text>
                  <Text size="sm" c="var(--color-secondary-700)">
                    {room?.room_name} • 
                    {dayjs(b.start_time).format("DD/MM/YYYY HH:mm")} – 
                    {dayjs(b.end_time).format("HH:mm")}
                  </Text>
                  <Text size="sm">{user?.full_name || "Ukendt bruger"}</Text>
                </div>

                <Button color="red" onClick={() => deleteBooking(b.id)}>
                  Slet
                </Button>
              </Group>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
