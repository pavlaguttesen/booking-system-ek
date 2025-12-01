"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import dayjs from "dayjs";
import { Button, Select, Group, TextInput, Card, Text } from "@mantine/core";

export default function AdminBookingList() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  const [roomFilter, setRoomFilter] = useState<string | null>(null);
  const [userFilter, setUserFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  async function loadData() {
    const { data: b } = await supabase.from("bookings").select("*");
    const { data: r } = await supabase.from("rooms").select("*");
    const { data: p } = await supabase.from("profiles").select("*");

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

  // -----------------------
  // FILTERED BOOKINGS
  // -----------------------
  const filtered = bookings.filter((b) => {
    const start = dayjs(b.start_time);

    if (roomFilter && b.room_id !== roomFilter) return false;
    if (typeFilter && b.booking_type !== typeFilter) return false;
    if (userFilter && b.user_id !== userFilter) return false;

    if (dateFrom && start.isBefore(dateFrom, "day")) return false;
    if (dateTo && start.isAfter(dateTo, "day")) return false;

    return true;
  });

  return (
    <div className="flex flex-col gap-6">

      <h2 className="text-xl font-semibold text-main mb-4">
        Alle bookinger
      </h2>

      {/* ----------------------- */}
      {/* FILTERS */}
      {/* ----------------------- */}
      <Group grow className="mb-4">

        <Select
          label="Rum"
          placeholder="Alle rum"
          value={roomFilter}
          onChange={setRoomFilter}
          data={[
            { value: "", label: "Alle rum" },
            ...rooms.map((r) => ({ value: r.id, label: r.room_name })),
          ]}
        />

        <Select
          label="Bruger"
          placeholder="Alle brugere"
          value={userFilter}
          onChange={setUserFilter}
          data={[
            { value: "", label: "Alle brugere" },
            ...profiles.map((p) => ({ value: p.id, label: p.full_name })),
          ]}
        />

        <Select
          label="Type"
          placeholder="Alle typer"
          value={typeFilter}
          onChange={setTypeFilter}
          data={[
            { value: "", label: "Alle typer" },
            { value: "normal", label: "Normal booking" },
            { value: "exam", label: "Eksamensbooking" },
          ]}
        />
      </Group>

      {/* DATE FILTERS */}
      <Group grow>

        <TextInput
          label="Fra dato"
          placeholder="DD-MM-YYYY"
          value={dateFrom ? dayjs(dateFrom).format("DD-MM-YYYY") : ""}
          onChange={(e) => {
            const v = e.target.value.trim();
            const d = dayjs(v, "DD-MM-YYYY", true);
            setDateFrom(d.isValid() ? d.toDate() : null);
          }}
        />

        <TextInput
          label="Til dato"
          placeholder="DD-MM-YYYY"
          value={dateTo ? dayjs(dateTo).format("DD-MM-YYYY") : ""}
          onChange={(e) => {
            const v = e.target.value.trim();
            const d = dayjs(v, "DD-MM-YYYY", true);
            setDateTo(d.isValid() ? d.toDate() : null);
          }}
        />
      </Group>

      {/* SHORTCUT BUTTONS */}
      <Group className="my-3">
        <Button onClick={() => setDateFrom(new Date())}>I dag</Button>
        <Button onClick={() => setDateFrom(dayjs().add(1, "day").toDate())}>
          I morgen
        </Button>
        <Button
          onClick={() =>
            setDateFrom(dayjs().startOf("week").add(1, "day").toDate())
          }
        >
          Denne uge
        </Button>
        <Button
          onClick={() => {
            const nextWeekStart = dayjs()
              .add(1, "week")
              .startOf("week")
              .add(1, "day");
            const nextWeekEnd = nextWeekStart.add(6, "day");

            setDateFrom(nextWeekStart.toDate());
            setDateTo(nextWeekEnd.toDate());
          }}
        >
          Næste uge
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            setDateFrom(null);
            setDateTo(null);
          }}
        >
          Reset
        </Button>
      </Group>

      {/* ----------------------- */}
      {/* BOOKING LIST */}
      {/* ----------------------- */}
      <div className="flex flex-col gap-4">
        {filtered.map((b) => {
          const room = rooms.find((r) => r.id === b.room_id);
          const user = profiles.find((p) => p.id === b.user_id);

          return (
            <Card
              key={b.id}
              padding="lg"
              radius="md"
              withBorder
              style={{ borderColor: "var(--color-primary-200)" }}
            >
              <Group justify="space-between" align="flex-start">
                <div>
                  <Text fw={600}>{b.title || "Booking"}</Text>
                  <Text c="var(--color-primary-200)" size="sm">
                    {room?.room_name} •{" "}
                    {dayjs(b.start_time).format("DD/MM/YYYY HH:mm")} –{" "}
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
