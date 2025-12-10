// Viser oversigt over alle lokaler på hver etage med deres status (ledigt/optaget/snart optaget).

"use client";

import { Card, CardSection, Text, Stack, Group } from "@mantine/core";
import dayjs from "dayjs";
import { useBookingContext } from "@/context/BookingContext";
import { useTranslation } from "react-i18next";

export default function BookingList() {
  const { rooms, bookings, selectedDate } = useBookingContext();
  const { t } = useTranslation();
  const now = dayjs();

  function getNextBooking(roomId: string) {
    return bookings
      .filter(
        (b) =>
          b.room_id === roomId &&
          dayjs(b.start_time).isSame(selectedDate, "day") &&
          dayjs(b.start_time).isAfter(now)
      )
      .sort((a, b) => dayjs(a.start_time).diff(dayjs(b.start_time)))[0];
  }

  function isOccupied(roomId: string) {
    return bookings.some((b) => {
      if (b.room_id !== roomId) return false;
      const s = dayjs(b.start_time);
      const e = dayjs(b.end_time);
      return now.isAfter(s) && now.isBefore(e);
    });
  }

  const roomsByFloor = rooms.reduce((acc, room) => {
    const floor = room.floor ?? 0;
    acc[floor] = acc[floor] || [];
    acc[floor].push(room);
    return acc;
  }, {} as Record<number, typeof rooms>);

  return (
    <section className="w-full">
      <Text fw={700} size="xl" className="text-main mb-4">
        {t("booking.overviewrooms")}
      </Text>

      {/* ⭐ ALWAYS 4 columns → only collapse at VERY small widths */}
      <div
        className="
        grid 
        grid-cols-4          /* ALWAYS 4 */
        max-[600px]:grid-cols-2  /* Go to 2 columns at <600px */
        max-[420px]:grid-cols-1  /* Go to 1 column at <420px */
        gap-6
      "
      >
        {Object.keys(roomsByFloor)
          .sort((a, b) => Number(a) - Number(b))
          .map((floor) => (
            <Card
              key={floor}
              radius="md"
              withBorder
              p={0}
              style={{
                width: "100%",
                borderColor: "#d0d7ea",
                backgroundColor: "white",
              }}
            >
              {/* Full-width header */}
              <div
                style={{
                  background: "#d4dcf4",
                  height: "48px",
                  borderTopLeftRadius: "8px",
                  borderTopRightRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  fw={700}
                  size="lg"
                  style={{
                    color: "#1a1a1a",
                    margin: 0,
                    lineHeight: "1",
                  }}
                >
                  {t("booking.floor")} {floor}
                </Text>
              </div>

              {/* ⭐ Content area */}
              <div style={{ padding: "14px" }}>
                <Stack gap={10}>
                  {roomsByFloor[Number(floor)]
                    .sort((a, b) => a.room_name.localeCompare(b.room_name))
                    .map((room, index) => {
                      const next = getNextBooking(room.id);
                      const occupied = isOccupied(room.id);

                      let badgeColor = "#3b8f3b";
                      let badgeText = t("booking.available").toUpperCase();

                      if (room.is_closed || occupied) {
                        badgeColor = "#b8000";
                        badgeText = t("booking.unavailable").toUpperCase();
                      } else if (
                        next &&
                        dayjs(next.start_time).diff(now, "minute") <= 60
                      ) {
                        const time = dayjs(next.start_time).format("HH:mm");
                        badgeColor = "#d4b100";
                        badgeText = `${t("booking.soonoccupied").toUpperCase()} • ${time}`;
                      }

                      return (
                        <div
                          key={room.id}
                          style={{
                            paddingTop: index === 0 ? "0" : "12px",
                            borderTop:
                              index === 0
                                ? "none"
                                : "1px solid rgba(0,0,0,0.15)",
                          }}
                        >
                          <Group justify="space-between" align="flex-start">
                            <Stack gap={2}>
                              <Text fw={600} className="text-main">
                                {room.room_name}
                              </Text>

                              <Text size="sm" className="text-main/70">
                                {room.room_type} • {room.nr_of_seats} {t("booking.seats")}
                              </Text>

                              {room.is_closed ? (
                                <Text size="sm" className="text-main/60">
                                  {t("booking.roomclosed")}
                                </Text>
                              ) : occupied ? (
                                <Text size="sm" className="text-main/60">
                                  {t("booking.occupied")} {t("booking.now")}.
                                </Text>
                              ) : next ? (
                                <Text size="sm" className="text-main/60">
                                  {t("booking.available")} {t("booking.now")} — {t("booking.occupied")} {t("booking.from")}{" "}
                                  {dayjs(next.start_time).format("HH:mm")}
                                </Text>
                              ) : (
                                <Text size="sm" className="text-main/60">
                                  {t("booking.roomavailable")}
                                </Text>
                              )}
                            </Stack>

                            <div
                              style={{
                                background: badgeColor,
                                color: "white",
                                padding: "4px 10px",
                                borderRadius: "8px",
                                fontSize: "11px",
                                fontWeight: 700,
                                whiteSpace: "nowrap",
                                minWidth: "110px",
                                textAlign: "center",
                              }}
                            >
                              {badgeText}
                            </div>
                          </Group>
                        </div>
                      );
                    })}
                </Stack>
              </div>
            </Card>
          ))}
      </div>
    </section>
  );
}
