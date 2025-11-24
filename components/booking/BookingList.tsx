"use client";

import {
  Card,
  Group,
  Stack,
  Text,
  Badge,
  type BadgeProps,
} from "@mantine/core";
import { useBookingContext } from "@/context/BookingContext";

export function BookingList() {
  const { rooms, profiles, filteredBookings, loading, errorMsg } =
    useBookingContext();

  if (loading) {
    return (
      <Text c="var(--color-primary-200)" size="sm">
        Henter data...
      </Text>
    );
  }

  if (errorMsg) {
    return (
      <Text c="var(--color-danger-600)" size="sm">
        Fejl: {errorMsg}
      </Text>
    );
  }

  // Badge-styles så vi holder os til paletten
  const examBadgeStyles: BadgeProps["styles"] = {
    root: {
      backgroundColor: "var(--color-danger-600)",
      color: "var(--color-text-invert)",
    },
  };

  const teacherBadgeStyles: BadgeProps["styles"] = {
    root: {
      backgroundColor: "var(--color-primary-600)",
      color: "var(--color-text-invert)",
    },
  };

  const adminBadgeStyles: BadgeProps["styles"] = {
    root: {
      backgroundColor: "var(--color-neutral-900)",
      color: "var(--color-text-invert)",
    },
  };

  return (
    <section className="space-y-6">
      {/* Lokaler-kort */}
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
            Lokaler
          </Text>

          {rooms.length === 0 && (
            <Text c="var(--color-primary-200)" size="sm">
              Ingen lokaler fundet.
            </Text>
          )}

          {/* GRID: 1–4 kolonner alt efter skærmstørrelse */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rooms.map((room) => (
              <Card
                key={room.id}
                radius="md"
                padding="sm"
                style={{
                  backgroundColor: "var(--color-surface-card)",
                  border: "1px solid var(--color-primary-200)",
                }}
              >
                <Stack gap={2}>
                  <Text fw={500} c="var(--color-text-main)">
                    {room.room_name}
                  </Text>
                  <Text c="var(--color-primary-200)" size="sm">
                    Etage: {room.floor} • Pladser: {room.nr_of_seats}
                  </Text>
                </Stack>
              </Card>
            ))}
          </div>
        </Stack>
      </Card>

      {/* Booking-kort */}
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
            Resultater
          </Text>

          {filteredBookings.length === 0 && (
            <Text c="var(--color-primary-200)" size="sm">
              Ingen bookinger matcher filtrene.
            </Text>
          )}

          {/* GRID: 1–4 kolonner alt efter skærmstørrelse */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBookings.map((b) => {
              const room = rooms.find((r) => r.id === b.room_id);
              const profile = profiles.find((p) => p.id === b.user_id);

              const roomName = room?.room_name ?? "Ukendt lokale";
              const fullName = profile?.full_name ?? "Ukendt bruger";
              const role = profile?.role;
              const type = (b.booking_type ?? "normal") as "normal" | "exam";

              const start = new Date(b.start_time);
              const end = new Date(b.end_time);

              return (
                <Card
                  key={b.id}
                  radius="md"
                  padding="md"
                  style={{
                    backgroundColor: "var(--color-surface-card)",
                    border: "1px solid var(--color-primary-200)",
                  }}
                >
                  <Stack gap={6}>
                    {/* Titel + badges */}
                    <Group justify="space-between" align="flex-start">
                      <Stack gap={2}>
                        <Group gap={8}>
                          <Text fw={500} c="var(--color-text-main)">
                            {b.title}
                          </Text>

                          {type === "exam" && (
                            <Badge
                              size="xs"
                              variant="filled"
                              styles={examBadgeStyles}
                            >
                              Eksamen
                            </Badge>
                          )}
                          {role === "teacher" && (
                            <Badge
                              size="xs"
                              variant="filled"
                              styles={teacherBadgeStyles}
                            >
                              Teacher
                            </Badge>
                          )}
                          {role === "admin" && (
                            <Badge
                              size="xs"
                              variant="filled"
                              styles={adminBadgeStyles}
                            >
                              Admin
                            </Badge>
                          )}
                        </Group>

                        {/* Lokale + dato */}
                        <Text c="var(--color-primary-200)" size="sm">
                          {roomName} •{" "}
                          {start.toLocaleDateString("da-DK", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </Text>

                        {/* Tid på egen linje */}
                        <Text c="var(--color-primary-200)" size="sm">
                          {start.toLocaleTimeString("da-DK", {
                            timeStyle: "short",
                          })}{" "}
                          –{" "}
                          {end.toLocaleTimeString("da-DK", {
                            timeStyle: "short",
                          })}
                        </Text>
                      </Stack>
                    </Group>

                    <Text c="var(--color-primary-200)" size="sm">
                      Booker: {fullName}
                    </Text>

                    {b.description && (
                      <Text size="sm" c="var(--color-text-main)">
                        {b.description}
                      </Text>
                    )}
                  </Stack>
                </Card>
              );
            })}
          </div>
        </Stack>
      </Card>
    </section>
  );
}
