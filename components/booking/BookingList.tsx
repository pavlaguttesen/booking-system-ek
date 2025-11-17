"use client";

import { Card, Group, Stack, Text, Badge } from "@mantine/core";
import { useBookingContext } from "@/context/BookingContext";

export function BookingList() {
  const { rooms, profiles, filteredBookings, loading, errorMsg } =
    useBookingContext();

  if (loading) {
    return (
      <Text c="#8B949E" size="sm">
        Henter data...
      </Text>
    );
  }

  if (errorMsg) {
    return (
      <Text c="red" size="sm">
        Fejl: {errorMsg}
      </Text>
    );
  }

  return (
    <section className="space-y-6">
      {/* Lokaler-kort */}
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
            Lokaler
          </Text>

          {rooms.length === 0 && (
            <Text c="#8B949E" size="sm">
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
                  backgroundColor: "#222B36",
                  border: "1px solid #30363D",
                }}
              >
                <Stack gap={2}>
                  <Text fw={500} c="#C9D1D9">
                    {room.room_name}
                  </Text>
                  <Text c="#8B949E" size="sm">
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
          backgroundColor: "#1E2630",
          border: "1px solid #30363D",
        }}
      >
        <Stack gap="sm">
          <Text fw={600} size="lg" c="#C9D1D9">
            Resultater
          </Text>

          {filteredBookings.length === 0 && (
            <Text c="#8B949E" size="sm">
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
                    backgroundColor: "#222B36",
                    border: "1px solid #30363D",
                  }}
                >
                  <Stack gap={6}>
                    {/* Titel + badges */}
                    <Group justify="space-between" align="flex-start">
                      <Stack gap={2}>
                        <Group gap={8}>
                          <Text fw={500} c="#C9D1D9">
                            {b.title}
                          </Text>

                          {type === "exam" && (
                            <Badge size="xs" variant="filled" color="yellow">
                              Eksamen
                            </Badge>
                          )}
                          {role === "teacher" && (
                            <Badge size="xs" variant="light" color="blue">
                              Teacher
                            </Badge>
                          )}
                          {role === "admin" && (
                            <Badge size="xs" variant="light" color="red">
                              Admin
                            </Badge>
                          )}
                        </Group>

                        {/* Lokale + dato */}
                        <Text c="#8B949E" size="sm">
                          {roomName} •{" "}
                          {start.toLocaleDateString("da-DK", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </Text>

                        {/* Tid på egen linje */}
                        <Text c="#8B949E" size="sm">
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

                    <Text c="#8B949E" size="sm">
                      Booker: {fullName}
                    </Text>

                    {b.description && (
                      <Text size="sm" c="#C9D1D9">
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
