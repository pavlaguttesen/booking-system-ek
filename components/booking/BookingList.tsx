/**
 * BookingList.tsx
 * 
 * FORMÅL:
 * Viser en kompakt oversigt over alle lokaler i bookingsystemet, grupperet efter etage.
 * For hvert lokale vises:
 * - Lokalets navn og type (studierum, klasseværelse, auditorium)
 * - Antal pladser
 * - Nuværende status: LEDIG (grøn), OPTAGET (rød), eller SNART OPTAGET (gul)
 * - Næste bookingstidspunkt hvis lokalet snart bliver optaget
 * 
 * KONTEKST:
 * Bruges som en alternativ visning til timeline-view på bookingsiden.
 * Giver brugeren et hurtigt overblik over tilgængeligheden af alle lokaler.
 * Opdateres dynamisk når selectedDate eller bookings ændres.
 * 
 * LAYOUT:
 * - 4 kolonner som standard (ét kort per etage)
 * - 2 kolonner ved skærmbredde < 600px
 * - 1 kolonne ved skærmbredde < 420px
 */

"use client";

import { Card, CardSection, Text, Stack, Group } from "@mantine/core";
import dayjs from "dayjs";
import { useBookingContext } from "@/context/BookingContext";
import { useTranslation } from "react-i18next";

export default function BookingList() {
  // Hent lokaler, bookinger og valgt dato fra booking context
  const { rooms, bookings, selectedDate } = useBookingContext();
  const { t } = useTranslation();
  const now = dayjs();

  /**
   * Finder den næste booking for et givet lokale efter nuværende tidspunkt.
   * 
   * @param roomId - ID'et på det lokale der skal tjekkes
   * @returns Den næste booking hvis den findes, ellers undefined
   * 
   * LOGIK:
   * 1. Filtrer bookinger til kun at inkludere det givne lokale
   * 2. Filtrer til kun bookinger der er på den valgte dato
   * 3. Filtrer til kun bookinger der starter efter nuværende tidspunkt
   * 4. Sortér bookingerne efter starttidspunkt (tidligst først)
   * 5. Returner den første booking (den nærmeste i fremtiden)
   */
  function getNextBooking(roomId: string) {
    return bookings
      .filter(
        (b) =>
          // Filtrer til bookinger i dette specifikke lokale
          b.room_id === roomId &&
          // Kun bookinger på den valgte dato
          dayjs(b.start_time).isSame(selectedDate, "day") &&
          // Kun bookinger der starter efter nuværende tidspunkt
          dayjs(b.start_time).isAfter(now)
      )
      // Sortér efter starttidspunkt (tidligst først)
      .sort((a, b) => dayjs(a.start_time).diff(dayjs(b.start_time)))[0];
  }

  /**
   * Tjekker om et lokale er optaget lige nu.
   * 
   * @param roomId - ID'et på det lokale der skal tjekkes
   * @returns true hvis lokalet er optaget, false ellers
   * 
   * LOGIK:
   * Et lokale er optaget hvis der findes en booking hvor:
   * - Nuværende tidspunkt er efter bookings starttid OG
   * - Nuværende tidspunkt er før bookings sluttid
   * (Dvs. vi er inde i tidsvinduet for bookingen)
   */
  function isOccupied(roomId: string) {
    return bookings.some((b) => {
      // Spring over hvis det ikke er det rigtige lokale
      if (b.room_id !== roomId) return false;
      // Konverter booking tidspunkter til dayjs objekter
      const s = dayjs(b.start_time);
      const e = dayjs(b.end_time);
      // Tjek om vi er inde i booking-vinduet
      return now.isAfter(s) && now.isBefore(e);
    });
  }

  /**
   * Gruppér alle lokaler efter etage nummer.
   * 
   * STRUKTUR:
   * Resultatet er et objekt hvor:
   * - Nøglen er etage nummeret (1, 2, 3, 4)
   * - Værdien er et array af lokaler på den etage
   * 
   * EKSEMPEL:
   * {
   *   1: [room1, room2],
   *   2: [room3, room4],
   *   ...
   * }
   */
  const roomsByFloor = rooms.reduce((acc, room) => {
    // Brug 0 som standard etage hvis floor er null/undefined
    const floor = room.floor ?? 0;
    // Initialiser array for denne etage hvis det ikke findes
    acc[floor] = acc[floor] || [];
    // Tilføj lokalet til den korrekte etage
    acc[floor].push(room);
    return acc;
  }, {} as Record<number, typeof rooms>);

  return (
    <section className="w-full">
      {/* Overskrift for lokaloversigten */}
      <Text fw={700} size="xl" className="text-main mb-4">
        {t("booking.overviewrooms")}
      </Text>

      {/* 
        GRID LAYOUT:
        - 4 kolonner som standard (ét etage-kort per kolonne)
        - 2 kolonner ved skærme mindre end 600px
        - 1 kolonne ved skærme mindre end 420px
        Dette giver optimal læsbarhed på alle enhedstyper
      */}
      <div
        className="
        grid 
        grid-cols-4          /* Standard: 4 kolonner */
        max-[600px]:grid-cols-2  /* Tablet: 2 kolonner */
        max-[420px]:grid-cols-1  /* Mobil: 1 kolonne */
        gap-6
      "
      >
        {/* 
          Iterér gennem alle etager:
          1. Konverter objekt nøgler (etage numre) til array
          2. Sortér etagerne numerisk (1, 2, 3, 4)
          3. Render et kort for hver etage
        */}
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
              {/* Header-sektion med etage nummer */}
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

              {/* Indholdsområde med lokale-liste */}
              <div style={{ padding: "14px" }}>
                <Stack gap={10}>
                  {/* 
                    Render alle lokaler på denne etage:
                    1. Sortér lokaler alfabetisk efter navn
                    2. Beregn status for hvert lokale
                    3. Vis lokale-information og status-badge
                  */}
                  {roomsByFloor[Number(floor)]
                    .sort((a, b) => a.room_name.localeCompare(b.room_name))
                    .map((room, index) => {
                      // Hent den næste booking for dette lokale
                      const next = getNextBooking(room.id);
                      // Tjek om lokalet er optaget lige nu
                      const occupied = isOccupied(room.id);

                      // STATUS BADGE BEREGNING:
                      // Standard: Grøn (lokale ledigt)
                      let badgeColor = "#3b8f3b";
                      let badgeText = t("booking.available").toUpperCase();

                      // Rød: Lokale lukket eller optaget
                      if (room.is_closed || occupied) {
                        badgeColor = "#b8000";
                        badgeText = t("booking.unavailable").toUpperCase();
                      } 
                      // Gul: Lokale snart optaget (næste booking inden for 60 min)
                      else if (
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
                            // Første lokale har ingen top-padding eller border
                            paddingTop: index === 0 ? "0" : "12px",
                            borderTop:
                              index === 0
                                ? "none"
                                : "1px solid rgba(0,0,0,0.15)",
                          }}
                        >
                          {/* Layout: Lokaleinformation til venstre, status badge til højre */}
                          <Group justify="space-between" align="flex-start">
                            {/* Venstre side: Lokale-information */}
                            <Stack gap={2}>
                              {/* Lokale navn (fed tekst) */}
                              <Text fw={600} className="text-main">
                                {room.room_name}
                              </Text>

                              {/* Lokale type og antal pladser */}
                              <Text size="sm" className="text-main/70">
                                {room.room_type} • {room.nr_of_seats} {t("booking.seats")}
                              </Text>

                              {/* 
                                STATUSMEDDELELSE (dynamisk baseret på lokale-tilstand):
                                1. Hvis lokalet er lukket: Vis "Lokalet er lukket"
                                2. Hvis lokalet er optaget: Vis "Optaget nu"
                                3. Hvis der er en kommende booking: Vis "Ledig nu - Optaget fra HH:mm"
                                4. Ellers: Vis "Lokalet er ledigt"
                              */}
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

                            {/* Højre side: Status badge med farve-kodet tilgængelighed */}
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
