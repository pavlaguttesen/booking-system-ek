// Admin-panel der viser alle bookinger med mulighed for at filtrere efter lokale, bruger, type og dato.

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button, Select, Group, Card, Text, Tabs } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import dayjs from "dayjs";
import "dayjs/locale/da";
import { DeleteBookingOverlay } from "@/app/overlays/DeleteBookingsOverlay";
import { useTranslation } from "react-i18next";

// ISO-string som intern repræsentation for dato-filtre
const ISO = "YYYY-MM-DD";

export default function AdminBookingPanel() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [repeatingBookings, setRepeatingBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  const [roomFilter, setRoomFilter] = useState<string | null>(null);
  const [userFilter, setUserFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  //Oversættelses konstant
  const { t } = useTranslation();

  // VIGTIGT! Mantine v6 bruger string | null
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);

  //State til slet-booking overlay
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<any | null>(null);

  //State til slet-repeating booking
  const [deleteRepeatingOpen, setDeleteRepeatingOpen] = useState(false);
  const [repeatingToDelete, setRepeatingToDelete] = useState<any | null>(null);

  // --------------------------------------------------------
  // INDLÆS DATA
  // --------------------------------------------------------
  async function loadData() {
    const [{ data: b }, { data: rb }, { data: r }, { data: p }] = await Promise.all([
      supabase
        .from("bookings")
        .select("*")
        .order("start_time", { ascending: true }),
      supabase
        .from("repeating_bookings")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("rooms").select("*"),
      supabase.from("profiles").select("*"),
    ]);

    setBookings(b || []);
    setRepeatingBookings(rb || []);
    setRooms(r || []);
    setProfiles(p || []);
  }

  useEffect(() => {
    void loadData();
  }, []);

  // --------------------------------------------------------
  // BEKRÆFT SLETNING VIA OVERLAY
  // --------------------------------------------------------
  async function handleConfirmDelete() {
    if (!bookingToDelete) return;

    await supabase.from("bookings").delete().eq("id", bookingToDelete.id);

    // Reload alle data, så panel og øvrige views er i sync
    await loadData();

    setDeleteOpen(false);
    setBookingToDelete(null);
  }

  // --------------------------------------------------------
  // BEKRÆFT SLETNING AF TILBAGEVENDENDE BOOKING
  // --------------------------------------------------------
  async function handleConfirmDeleteRepeating() {
    if (!repeatingToDelete) return;

    // Slet både tilbagevendende booking og alle dens tilknyttede bookinger
    await Promise.all([
      supabase.from("repeating_bookings").delete().eq("id", repeatingToDelete.id),
      supabase.from("bookings").delete().eq("parent_repeating_id", repeatingToDelete.id),
    ]);

    // Reload alle data
    await loadData();

    setDeleteRepeatingOpen(false);
    setRepeatingToDelete(null);
  }

  // --------------------------------------------------------
  // FILTRERING
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
  // DATO GENVEJSKNAPPER
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

  // Get recurrence type label
  const getRecurrenceLabel = (type: string) => {
    switch (type) {
      case "daily":
        return t("repeatingBooking.recurrenceTypeDaily");
      case "weekly":
        return t("repeatingBooking.recurrenceTypeWeekly");
      case "biweekly":
        return t("repeatingBooking.recurrenceTypeBiweekly");
      case "monthly":
        return t("repeatingBooking.recurrenceTypeMonthly");
      default:
        return type;
    }
  };

  // --------------------------------------------------------
  // TEGNING
  // --------------------------------------------------------
  return (
    <div className="flex flex-col gap-8">
      <h2 className="text-xl font-semibold text-secondary">{t("admin.allbookings")}</h2>

      <Tabs defaultValue="regular">
        <Tabs.List>
          <Tabs.Tab value="regular">{t("repeatingBooking.regularBookings")} ({filtered.length})</Tabs.Tab>
          <Tabs.Tab value="repeating">{t("repeatingBooking.recurringBookings")} ({repeatingBookings.length})</Tabs.Tab>
        </Tabs.List>

        {/* ALMINDELIGE BOOKINGER */}
        <Tabs.Panel value="regular">
          {/* FILTERS */}
          <Group grow className="mt-6">
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
              label={t("booking.roomtype")}
              value={typeFilter}
              onChange={setTypeFilter}
              data={[
                { value: "normal", label: t("admin.normalbooking") },
                { value: "exam", label: t("admin.exambooking") },
              ]}
              clearable
            />
          </Group>

          {/* DATE PICKERS */}
          <Group grow className="mt-4">
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
          <Group className="mt-4">
            <Button onClick={pickToday}>{t("booking.today")}</Button>
            <Button onClick={pickTomorrow}>{t("booking.tomorrow")}</Button>
            <Button onClick={pickThisWeek}>{t("admin.thisWeek")}</Button>
            <Button onClick={pickNextWeek}>{t("admin.nextWeek")}</Button>
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

          {/* RESULT LIST */}
          <div className="flex flex-col gap-4 mt-6">
            {filtered.map((b) => {
              const room = rooms.find((r) => r.id === b.room_id);
              const user = profiles.find((p) => p.id === b.user_id);

              return (
                <Card key={b.id} withBorder padding="lg" className="rounded-lg shadow-sm border border-secondary-200">
                  <Group justify="space-between">
                    <div>
                      <Text fw={600}>{b.title || "Booking"}</Text>

                      <Text size="sm">
                        {room?.room_name ?? t("unknown.unknownRoom")} •{" "}
                        {dayjs(b.start_time).format("DD/MM/YYYY HH:mm")} –{" "}
                        {dayjs(b.end_time).format("HH:mm")}
                      </Text>
                      <Text size="sm">
                        {user?.full_name || t("unknown.unknownUser")}
                      </Text>
                      {b.parent_repeating_id && (
                        <Text size="xs" c="dimmed">
                          {t("repeatingBooking.partOfRepeating")}
                        </Text>
                      )}
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
        </Tabs.Panel>

        {/* TILBAGEVENDENDE BOOKINGER */}
        <Tabs.Panel value="repeating">
          {/* RESULT LIST */}
          <div className="flex flex-col gap-4 mt-6">
            {repeatingBookings.map((rb) => {
              const room = rooms.find((r) => r.id === rb.room_id);
              const creator = profiles.find((p) => p.id === rb.created_by);
              const bookingCount = bookings.filter(
                (b) => b.parent_repeating_id === rb.id
              ).length;

              return (
                <Card key={rb.id} withBorder padding="lg" className="rounded-lg shadow-sm border border-secondary-200 bg-secondary-300/30">
                  <Group justify="space-between">
                    <div>
                      <Text fw={600}>{rb.title || t("repeatingBooking.repeatingBookingLabel")}</Text>

                      <Text size="sm">
                        {room?.room_name ?? t("unknown.unknownRoom")} •{" "}
                        {rb.start_time} – {rb.end_time}
                      </Text>
                      <Text size="sm">
                        {getRecurrenceLabel(rb.recurrence_type)} • {t("repeatingBooking.endsOn")}:{" "}
                        {dayjs(rb.recurrence_end_date).format("DD/MM/YYYY")}
                      </Text>
                      <Text size="sm">
                        {t("repeatingBooking.createdBy")}: {creator?.full_name || t("unknown.unknownUser")}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {t("repeatingBooking.generatesBookings")} {bookingCount} {bookingCount === 1 ? "booking" : "bookinger"}
                      </Text>
                    </div>

                    <Button
                      color="red"
                      onClick={() => {
                        setRepeatingToDelete(rb);
                        setDeleteRepeatingOpen(true);
                      }}
                    >
                      {t("admin.delete")}
                    </Button>
                  </Group>
                </Card>
              );
            })}
          </div>
        </Tabs.Panel>
      </Tabs>

      {/* SLET BOOKING OVERLAY */}
      {deleteOpen && bookingToDelete && (
        <DeleteBookingOverlay
          opened={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          booking={bookingToDelete}
          room={rooms.find((r) => r.id === bookingToDelete.room_id) || null}
          profile={
            profiles.find((p) => p.id === bookingToDelete.user_id) || null
          }
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* DELETE REPEATING BOOKING CONFIRMATION */}
      {deleteRepeatingOpen && repeatingToDelete && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setDeleteRepeatingOpen(false)}
        >
          <Card
            className="bg-white p-6 rounded-lg shadow-sm border border-secondary-200"
            onClick={(e) => e.stopPropagation()}
          >
            <Text fw={600} size="lg" className="mb-4">
              {t("repeatingBooking.deleteConfirm")}
            </Text>
            <Text size="sm" className="mb-4">
              {t("repeatingBooking.deleteWarning")} "{repeatingToDelete.title}" {t("repeatingBooking.deleteWarningEnd")} {bookings.filter(
                (b) => b.parent_repeating_id === repeatingToDelete.id
              ).length}{" "}
              {t("repeatingBooking.deleteWarningLinked")}
            </Text>
            <Group justify="flex-end">
              <Button
                variant="outline"
                onClick={() => setDeleteRepeatingOpen(false)}
              >
                {t("repeatingBooking.cancel")}
              </Button>
              <Button color="red" onClick={handleConfirmDeleteRepeating}>
                {t("admin.delete")}
              </Button>
            </Group>
          </Card>
        </div>
      )}
    </div>
  );
}
