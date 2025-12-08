"use client";

// Dansk kommentar: Admin-panel der viser alle bookinger med filtre
// og mulighed for at slette bookinger via et "er du sikker?" overlay.

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button, Select, Group, Card, Text } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import dayjs from "dayjs";
import "dayjs/locale/da";
import { DeleteBookingOverlay } from "@/app/overlays/DeleteBookingsOverlay";
import { useTranslation } from "react-i18next";

// Dansk kommentar: Vi bruger ISO-string som intern repræsentation for dato-filtre
const ISO = "YYYY-MM-DD";

export default function AdminBookingPanel() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  const [roomFilter, setRoomFilter] = useState<string | null>(null);
  const [userFilter, setUserFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  // VIGTIGT: Vi holder fast i string | null som du allerede har brugt,
  // for ikke at ødelægge eksisterende logik.
  const { t } = useTranslation();

  // VIGTIGT → Mantine v6 bruger string | null
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);

  // Dansk kommentar: State til slet-booking overlay
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<any | null>(null);

  // --------------------------------------------------------
  // LOAD DATA
  // --------------------------------------------------------
  async function loadData() {
    const [{ data: b }, { data: r }, { data: p }] = await Promise.all([
      supabase.from("bookings").select("*").order("start_time", { ascending: true }),
      supabase.from("rooms").select("*"),
      supabase.from("profiles").select("*"),
    ]);

    setBookings(b || []);
    setRooms(r || []);
    setProfiles(p || []);
  }

  useEffect(() => {
    void loadData();
  }, []);

  // --------------------------------------------------------
  // CONFIRM DELETE VIA OVERLAY
  // --------------------------------------------------------
  async function handleConfirmDelete() {
    if (!bookingToDelete) return;

    await supabase.from("bookings").delete().eq("id", bookingToDelete.id);

    // Dansk kommentar: Reload alle data, så panel og øvrige views er i sync
    await loadData();

    setDeleteOpen(false);
    setBookingToDelete(null);
  }

  // --------------------------------------------------------
  // FILTERING
  // --------------------------------------------------------
  const filtered = bookings.filter((b) => {
    const start = dayjs(b.start_time);

    if (roomFilter && b.room_id !== roomFilter) return false;
    if (userFilter && b.user_id !== userFilter) return false;
    if (typeFilter && b.booking_type !== typeFilter) return false;

    if (dateFrom && start.isBefore(dayjs(dateFrom), "day")) return false;
    if (dateTo && start.isAfter(dayjs(dateTo), "day")) return false;

    return true;
  });

  // --------------------------------------------------------
  // DATE SHORTCUT BUTTONS
  // --------------------------------------------------------
  const pickToday = () => {
    const d = dayjs().format(ISO);
    setDateFrom(d);
    setDateTo(d);
  };

  const pickTomorrow = () => {
    const d = dayjs().add(1, "day").format(ISO);
    setDateFrom(d);
    setDateTo(d);
  };

  const pickThisWeek = () => {
    const start = dayjs().startOf("week").add(1, "day");
    const end = start.add(6, "day");
    setDateFrom(start.format(ISO));
    setDateTo(end.format(ISO));
  };

  const pickNextWeek = () => {
    const start = dayjs().add(1, "week").startOf("week").add(1, "day");
    const end = start.add(6, "day");
    setDateFrom(start.format(ISO));
    setDateTo(end.format(ISO));
  };

  // --------------------------------------------------------
  // RENDER
  // --------------------------------------------------------
  return (
    <div className="flex flex-col gap-8">
      <h2 className="text-xl font-semibold text-main">Alle bookinger</h2>

      {/* FILTERS */}
      <Group grow>
        <Select
          label={t("admin.room")}
          value={roomFilter}
          onChange={setRoomFilter}
          data={rooms.map((r) => ({ value: r.id, label: r.room_name }))}
          clearable
        />

        <Select
          label={t("admin.user")}
          value={userFilter}
          onChange={setUserFilter}
          data={profiles.map((p) => ({
            value: p.id,
            label: p.full_name ?? "Ukendt",
          }))}
          clearable
        />

        <Select
          label="Type"
          value={typeFilter}
          onChange={setTypeFilter}
          data={[
            { value: "normal", label: "Normal booking" },
            { value: "exam", label: t("admin.exambooking") },
          ]}
          clearable
        />
      </Group>

      {/* DATE PICKERS */}
      <Group grow>
        <DatePickerInput
          locale="da"
          label={t("admin.fromDate")}
          value={dateFrom}
          onChange={setDateFrom}
          valueFormat="DD-MM-YYYY"
          clearable
        />

        <DatePickerInput
          locale="da"
          label={t("admin.toDate")}
          value={dateTo}
          onChange={setDateTo}
          valueFormat="DD-MM-YYYY"
          clearable
        />
      </Group>

      {/* SHORTCUT BUTTONS */}
      <Group>
        <Button onClick={pickToday}>{t("booking.today")}</Button>
        <Button onClick={pickTomorrow}>{t("booking.tomorrow")}</Button>
        <Button onClick={pickThisWeek}>{t("admin.thisWeek")}</Button>
        <Button onClick={pickNextWeek}>{t("admin.nextWeek")}</Button>
        <Button variant="outline" onClick={() => { setDateFrom(null); setDateTo(null); }}>
          Reset
        </Button>
      </Group>

      {/* RESULT LIST */}
      <div className="flex flex-col gap-4">
        {filtered.map((b) => {
          const room = rooms.find((r) => r.id === b.room_id);
          const user = profiles.find((p) => p.id === b.user_id);

          return (
            <Card key={b.id} withBorder padding="lg">
              <Group justify="space-between">
                <div>
                  <Text fw={600}>{b.title || "Booking"}</Text>

                  <Text size="sm">
                    {room?.room_name ?? t("unknown.unknownRoom")} •{" "}
                    {dayjs(b.start_time).format("DD/MM/YYYY HH:mm")} –{" "}
                    {dayjs(b.end_time).format("HH:mm")}
                  </Text>
                  <Text size="sm">{user?.full_name || t("unknown.unknownUser")}</Text>
                </div>

                <Button
                  color="red"
                  onClick={() => {
                    setBookingToDelete(b);
                    setDeleteOpen(true);
                  }}
                >
                  {t("admin.delete")}
                </Button>
              </Group>
            </Card>
          );
        })}
      </div>

      {/* SLET BOOKING OVERLAY */}
      {deleteOpen && bookingToDelete && (
        <DeleteBookingOverlay
          opened={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          booking={bookingToDelete}
          room={rooms.find((r) => r.id === bookingToDelete.room_id) || null}
          profile={profiles.find((p) => p.id === bookingToDelete.user_id) || null}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
